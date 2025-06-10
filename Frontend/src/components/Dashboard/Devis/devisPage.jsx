import { useEffect, useState } from "react";
import DevisPreview from "./devisPreview";
import { API_ENDPOINTS, apiRequest } from "../../../config/api";
import { DEFAULT_DEVIS } from "./constants";
import "./devis.scss";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR");
  } catch (error) {
    return "";
  }
};

const calculateTTC = (devis) => {
  if (!devis || !Array.isArray(devis.articles)) return 0;
  
  return devis.articles.reduce((total, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    const tva = parseFloat(article.tvaRate || 0);
    
    if (isNaN(price) || isNaN(qty) || isNaN(tva)) return total;
    
    const ht = price * qty;
    return total + ht + (ht * tva / 100);
  }, 0);
};

const Devis = ({ clients = [], initialDevisFromClient = null, onBack, selectedClientId = null }) => {
  const normalizeClientId = (c) => {
    if (!c) return null;
    return typeof c === "object" && c !== null ? c._id : c;
  };

  const [devisList, setDevisList] = useState([]);
  const [currentDevis, setCurrentDevis] = useState(() => {
    const baseDevis = initialDevisFromClient || DEFAULT_DEVIS;
    return {
      ...baseDevis,
      clientId: selectedClientId || normalizeClientId(baseDevis.clientId) || "",
      dateDevis: baseDevis.dateDevis || new Date().toISOString().split('T')[0]
    };
  });
  const [filterClientId, setFilterClientId] = useState(
    selectedClientId || normalizeClientId(initialDevisFromClient?.clientId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' ou 'list'

  useEffect(() => {
    const fetchDevis = async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        
        if (filterClientId) {
          console.log("🎯 Récupération des devis pour le client:", filterClientId);
          data = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(filterClientId));
        } else {
          data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
        }
        
        setDevisList(Array.isArray(data) ? data : []);
        console.log("📋 Devis récupérés:", data.length);
      } catch (err) {
        console.error("Erreur récupération des devis:", err);
        setError("Erreur lors de la récupération des devis");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevis();
  }, [filterClientId]);

  useEffect(() => {
    if (initialDevisFromClient) {
      setCurrentDevis(initialDevisFromClient);
      const clientId = normalizeClientId(initialDevisFromClient.clientId);
      setFilterClientId(clientId);
    }
  }, [initialDevisFromClient]);

  useEffect(() => {
    if (selectedClientId) {
      setFilterClientId(selectedClientId);
      setCurrentDevis(prev => ({
        ...prev,
        clientId: selectedClientId
      }));
    }
  }, [selectedClientId]);

  const handleSelectDevis = (devis) => {
    const normalizedClientId = normalizeClientId(devis.clientId);
    const updatedDevis = {
      ...devis,
      clientId: normalizedClientId,
      articles: Array.isArray(devis.articles) ? devis.articles : [],
    };
    setCurrentDevis(updatedDevis);
    setViewMode('edit');
  };

  const handleReset = () => {
    const newDevis = {
      ...DEFAULT_DEVIS,
      clientId: filterClientId || selectedClientId || "",
      dateDevis: new Date().toISOString().split('T')[0]
    };
    setCurrentDevis(newDevis);
  };

  const handleSave = async (updatedDevis, isEdit = false) => {
    const clientId = normalizeClientId(updatedDevis.clientId) || selectedClientId;
    
    if (!clientId) {
      alert("❌ Veuillez sélectionner un client");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit
        ? API_ENDPOINTS.DEVIS.UPDATE(updatedDevis._id)
        : API_ENDPOINTS.DEVIS.BASE;

      const method = isEdit ? "PUT" : "POST";
      
      const devisData = {
        ...updatedDevis,
        clientId: clientId
      };
      
      await apiRequest(url, {
        method,
        body: JSON.stringify(devisData),
      });

      let data;
      if (filterClientId) {
        data = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(filterClientId));
      } else {
        data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
      }
      setDevisList(Array.isArray(data) ? data : []);

      alert("✅ Devis enregistré avec succès !");
      
      const newDevis = {
        ...DEFAULT_DEVIS,
        clientId: filterClientId || selectedClientId || "",
        dateDevis: new Date().toISOString().split('T')[0]
      };
      setCurrentDevis(newDevis);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert(`❌ Erreur lors de l'enregistrement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("❗ Supprimer ce devis ?");
    if (!confirm) return;

    setLoading(true);
    try {
      await apiRequest(API_ENDPOINTS.DEVIS.DELETE(id), {
        method: "DELETE",
      });

      setDevisList((prev) => prev.filter((d) => d._id !== id));
      alert("✅ Devis supprimé");
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(`❌ Erreur lors de la suppression: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (devis) => {
    try {
      setLoading(true);
      
      // Créer un élément temporaire
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.background = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.color = 'black';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      document.body.appendChild(tempDiv);

      // Importer les modules nécessaires
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      let currentY = margin;

      // Fonction pour ajouter une section au PDF
      const addSectionToPDF = async (htmlContent, isFirstPage = false) => {
        tempDiv.innerHTML = htmlContent;
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Vérifier si on a besoin d'une nouvelle page
        if (currentY + imgHeight > pageHeight - margin && !isFirstPage) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5;

        return imgHeight;
      };

      // 1. EN-TÊTE
      await addSectionToPDF(generateHeaderHTML(devis), true);

      // 2. INFORMATIONS PARTIES
      await addSectionToPDF(generatePartiesHTML(devis));

      // 3. MÉTADONNÉES
      await addSectionToPDF(generateMetadataHTML(devis));
      
      // 4. DESCRIPTION
      if (devis.description) {
        await addSectionToPDF(generateDescriptionHTML(devis));
      }

      // 5. TABLEAU - TRAITEMENT LIGNE PAR LIGNE
      // En-tête du tableau
      await addSectionToPDF(generateTableHeaderHTML());

      // Traiter chaque ligne individuellement
      for (let i = 0; i < devis.articles.length; i++) {
        const article = devis.articles[i];
        const price = parseFloat(article.unitPrice || "0");
        const qty = parseFloat(article.quantity || "0");
        const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';

        const rowHTML = `
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr style="background: ${bgColor};">
                <td style="padding: 1rem 0.75rem; text-align: left; border-bottom: 1px solid #f1f5f9; width: 35%;">${article.description || ''}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9; width: 10%;">${article.unit || ''}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9; width: 10%;">${qty}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9; width: 15%;">${price.toFixed(2)} €</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9; width: 10%;">${article.tvaRate || "20"}%</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9; width: 20%; font-weight: 600; color: #10b981;">${total.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>
        `;

        await addSectionToPDF(rowHTML);
      }

      // 6. TOTAUX
      await addSectionToPDF(generateTotalsHTML(devis));

      // 7. CONDITIONS
      await addSectionToPDF(generateConditionsHTML(devis));
      
      // 8. PIED DE PAGE
      await addSectionToPDF(generateFooterHTML(devis));

      // Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);

      // Nettoyer
      document.body.removeChild(tempDiv);
      
      console.log("✅ PDF généré avec coupures au niveau des lignes");

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // FONCTIONS POUR GÉNÉRER CHAQUE SECTION HTML
  const generateHeaderHTML = (devis) => `
    <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f1f5f9;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          ${devis.logoUrl ? `<img src="${devis.logoUrl}" alt="Logo" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: 8px;">` : ''}
        </div>
        <div style="flex: 1; text-align: right;">
          <h1 style="font-size: 3rem; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: 2px;">DEVIS</h1>
          <p style="font-size: 1.5rem; color: #3b82f6; font-weight: 600; margin: 0;">${devis.title || ''}</p>
        </div>
      </div>
    </div>
  `;

  const generatePartiesHTML = (devis) => {
    const clientInfo = clients.find(c => c._id === devis.clientId) || {};
    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 1.5rem 0; color: #0f172a; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">ÉMETTEUR</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #0f172a;">${devis.entrepriseName || 'Nom de l\'entreprise'}</div>
            <div>${devis.entrepriseAddress || 'Adresse'}</div>
            <div>${devis.entrepriseCity || 'Code postal et ville'}</div>
            <div>${devis.entreprisePhone || 'Téléphone'}</div>
            <div>${devis.entrepriseEmail || 'Email'}</div>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 1.5rem 0; color: #0f172a; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">DESTINATAIRE</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="font-weight: 600; font-size: 1.1rem; color: #0f172a;">${clientInfo.name || devis.clientName || 'Nom du client'}</div>
            <div>${clientInfo.email || devis.clientEmail || 'Email du client'}</div>
            <div>${clientInfo.phone || devis.clientPhone || 'Téléphone du client'}</div>
            <div>${devis.clientAddress || 'Adresse du client'}</div>
          </div>
        </div>
      </div>
    `;
  };

  const generateMetadataHTML = (devis) => {
    const clientInfo = clients.find(c => c._id === devis.clientId) || {};
    return `
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date du devis :</div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(devis.dateDevis)}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Numéro de devis :</div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${devis.devisNumber || devis._id || 'À définir'}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date de validité :</div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(devis.dateValidite)}</div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Client :</div>
            <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${clientInfo.name || devis.clientName || 'Client non défini'}</div>
          </div>
        </div>
      </div>
    `;
  };
  
  const generateDescriptionHTML = (devis) => `
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 1rem 0; color: #0f172a; font-size: 1.2rem; font-weight: 600;">Description</h3>
      <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; color: #475569; line-height: 1.6; white-space: pre-line;">
        ${devis.description || ''}
      </div>
    </div>
  `;

  const generateTableHeaderHTML = () => `
    <div style="margin-bottom: 10px;">
      <h3 style="margin: 0 0 1.5rem 0; color: #0f172a; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem;">DÉTAIL DES PRESTATIONS</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white;">
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 35%;">Description</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">Unité</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">Qté</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 15%;">Prix unitaire HT</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 10%;">TVA</th>
            <th style="padding: 1rem 0.75rem; text-align: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; width: 20%;">Total HT</th>
          </tr>
        </thead>
      </table>
    </div>
  `;

  const generateTotalsHTML = (devis) => {
    const tauxTVA = {
      "20": { ht: 0, tva: 0 },
      "10": { ht: 0, tva: 0 },
      "5.5": { ht: 0, tva: 0 },
      "0": { ht: 0, tva: 0 }
    };

    devis.articles.forEach((item) => {
      const price = parseFloat(item.unitPrice || "0");
      const qty = parseFloat(item.quantity || "0");
      const taux = item.tvaRate || "20";

      if (!isNaN(price) && !isNaN(qty) && tauxTVA[taux] !== undefined) {
        const ht = price * qty;
        tauxTVA[taux].ht += ht;
        tauxTVA[taux].tva += ht * (parseFloat(taux) / 100);
      }
    });

    const totalHT = Object.values(tauxTVA).reduce((sum, t) => sum + t.ht, 0);
    const totalTVA = Object.values(tauxTVA).reduce((sum, t) => sum + t.tva, 0);
    const totalTTC = totalHT + totalTVA;

    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 30px 0;">
        <div>
          <h4 style="margin: 0 0 1rem 0; color: #0f172a; font-weight: 600;">Récapitulatif TVA</h4>
          <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);">
            <thead>
              <tr style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white;">
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Base HT</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Taux TVA</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Montant TVA</th>
                <th style="padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(tauxTVA)
                .filter(([, { ht }]) => ht > 0)
                .map(([rate, { ht, tva }]) => `
                  <tr style="background: white;">
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${ht.toFixed(2)} €</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${rate}%</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${tva.toFixed(2)} €</td>
                    <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #f1f5f9;">${(ht + tva).toFixed(2)} €</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; align-self: end;">
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 8px; font-weight: 500; min-width: 250px;">
            <span>Total HT :</span>
            <span>${totalHT.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 8px; font-weight: 500; min-width: 250px;">
            <span>Total TVA :</span>
            <span>${totalTVA.toFixed(2)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 700; font-size: 1.1rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); min-width: 250px;">
            <span>Total TTC :</span>
            <span>${totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    `;
  };

  const generateConditionsHTML = (devis) => `
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #3b82f6; margin-top: 30px;">
      <div style="margin-bottom: 2rem;">
        <h4 style="margin: 0 0 1rem 0; color: #0f172a; font-size: 1.1rem; font-weight: 600;">Conditions</h4>
        <div style="color: #475569; line-height: 1.6; white-space: pre-line;">
          ${devis.conditions || `• Devis valable jusqu'au ${formatDate(devis.dateValidite)}\n• Règlement à 30 jours fin de mois\n• TVA non applicable, art. 293 B du CGI (si applicable)`}
        </div>
      </div>
      
      <div style="text-align: center;">
        <p style="font-style: italic; color: #64748b; margin-bottom: 2rem;">
          <em>Bon pour accord - Date et signature du client :</em>
        </p>
        <div style="display: flex; justify-content: space-around; gap: 2rem;">
          <div style="flex: 1; padding: 1rem; border-bottom: 2px solid #0f172a; color: #475569; font-weight: 500;">
            <span>Date : _______________</span>
          </div>
          <div style="flex: 1; padding: 1rem; border-bottom: 2px solid #0f172a; color: #475569; font-weight: 500;">
            <span>Signature :</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const generateFooterHTML = (devis) => `
    <div style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; text-align: center;">
      <p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin: 0;">
        ${devis.footerText || `${devis.entrepriseName || 'Votre entreprise'} - ${devis.entrepriseAddress || 'Adresse'} - ${devis.entrepriseCity || 'Ville'}`}
      </p>
    </div>
  `;

  const handleFieldChange = (name, value, index = null) => {
    setCurrentDevis((prev) => {
      if (name.startsWith("article-") && index !== null) {
        const key = name.replace("article-", "");
        const updatedArticles = prev.articles.map((article, i) =>
          i === index ? { ...article, [key]: value } : article
        );
        return { ...prev, articles: updatedArticles };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  const handleAddArticle = () => {
    const updated = {
      ...currentDevis,
      articles: [
        ...currentDevis.articles,
        { description: "", unitPrice: "", quantity: "1", unit: "", tvaRate: "20" }
      ],
    };
    setCurrentDevis(updated);
  };

  const handleRemoveArticle = (index) => {
    const updated = {
      ...currentDevis,
      articles: currentDevis.articles.filter((_, i) => i !== index)
    };
    setCurrentDevis(updated);
  };

  const totalTTC = calculateTTC(currentDevis);

  const filteredDevisList = filterClientId 
    ? devisList.filter(devis => {
        const devisClientId = normalizeClientId(devis.clientId);
        return devisClientId === filterClientId;
      })
    : devisList;

  const selectedClient = filterClientId 
    ? clients.find(c => c._id === filterClientId)
    : null;

  if (loading && devisList.length === 0) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">⏳</div>
        <p>Chargement des devis...</p>
      </div>
    );
  }

  return (
    <div className="devis-page">
      {/* Liste des devis existants */}
      {viewMode === 'list' && (
        <div className="devis-list-section">
          <div className="devis-list-header">
            <h2 className="devis-list-title">
              📄 {selectedClient ? `Devis de ${selectedClient.name}` : "Mes Devis"}
            </h2>
            {selectedClient && (
              <p style={{textAlign: 'center', color: '#64748b', marginTop: '0.5rem'}}>
                📧 {selectedClient.email} • 📞 {selectedClient.phone}
              </p>
            )}
          </div>
          
          {error && (
            <div className="error-state">{error}</div>
          )}

          <div className="devis-actions">
            {onBack && (
              <button className="btn-secondary\" onClick={onBack}>
                ← Retour aux prospects
              </button>
            )}
            
            <button className="btn-new" onClick={() => setViewMode('edit')}>
              ✨ Créer un nouveau devis
            </button>
          </div>

          {filteredDevisList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <p className="empty-message">
                {selectedClient 
                  ? `Aucun devis créé pour ${selectedClient.name}`
                  : "Aucun devis créé pour le moment"
                }
              </p>
              <button className="cta-button" onClick={() => setViewMode('edit')}>
                🆕 Créer votre premier devis
              </button>
            </div>
          ) : (
            <div className="devis-grid">
              {filteredDevisList
                .filter((devis) => devis.title && devis.title.trim() !== "")
                .map((devis) => (
                  <div key={devis._id} className="devis-card">
                    <div className="devis-card-top">
                      <div className="devis-avatar">
                        {devis.title ? devis.title.charAt(0).toUpperCase() : "D"}
                      </div>
                      
                      <div 
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor(devis.status) }}
                        title={getStatusLabel(devis.status)}
                      >
                        {getStatusIcon(devis.status)}
                      </div>
                    </div>
                    
                    <div className="devis-card-content">
                      <h3 className="devis-card-title">{devis.title || "Devis sans titre"}</h3>
                      
                      <div className="devis-card-meta">
                        <div className="devis-card-date">
                          <span>📅</span>
                          <span>{formatDate(devis.dateDevis)}</span>
                        </div>
                        <div className="devis-card-amount">
                          <span>💰</span>
                          <span>{calculateTTC(devis).toFixed(2)} € TTC</span>
                        </div>
                      </div>
                      
                      <div className="devis-client-info">
                        <span className="devis-client-icon">👤</span>
                        <span className="devis-client-name">
                          {clients.find(c => c._id === normalizeClientId(devis.clientId))?.name || "Client inconnu"}
                        </span>
                      </div>
                      
                      <div className="devis-status-badge" style={{ backgroundColor: getStatusColor(devis.status), color: 'white' }}>
                        {getStatusIcon(devis.status)} {getStatusLabel(devis.status)}
                      </div>
                    </div>
                    
                    <div className="devis-card-actions">
                      <button 
                        className="card-btn card-btn-edit"
                        onClick={() => handleSelectDevis(devis)}
                      >
                        ✏️ Modifier
                      </button>
                      <button 
                        className="card-btn card-btn-pdf"
                        onClick={() => handleDownloadPDF(devis)}
                        disabled={loading}
                      >
                        {loading ? "⏳" : "📄"} PDF
                      </button>
                      <button 
                        className="card-btn card-btn-delete"
                        onClick={() => handleDelete(devis._id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Aperçu du devis */}
      {viewMode === 'edit' && (
        <div className="devis-preview-container">
          <div className="preview-header">
            <h2 className="preview-title">
              {currentDevis._id 
                ? `✏️ Modification du devis : ${currentDevis.title || "Sans titre"}` 
                : `🆕 Nouveau devis${selectedClient ? ` pour ${selectedClient.name}` : ""}`
              }
            </h2>
            <div className="preview-subtitle">
              Total TTC : <span className="total-amount">{totalTTC.toFixed(2)} €</span>
            </div>
          </div>

          <div className="preview-actions">
            <button
              className="btn-save"
              onClick={() => handleSave(currentDevis, !!currentDevis._id)}
              disabled={loading}
            >
              💾 {loading ? "Enregistrement..." : "Enregistrer le devis"}
            </button>
            
            <button
              className="btn-secondary"
              onClick={() => setViewMode('list')}
            >
              ← Retour à la liste
            </button>
            
            {currentDevis._id && (
              <button
                className="btn-new"
                onClick={handleReset}
              >
                🆕 Nouveau devis
              </button>
            )}
          </div>

          {currentDevis && (
            <DevisPreview
              devisData={currentDevis}
              totalTTC={totalTTC}
              onFieldChange={handleFieldChange}
              onAddArticle={handleAddArticle}
              onRemoveArticle={handleRemoveArticle}
              onReset={handleReset}
              clients={clients}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Fonctions utilitaires pour les statuts
const getStatusColor = (status) => {
  switch (status) {
    case 'nouveau': return '#3b82f6'; // Bleu
    case 'en_attente': return '#8b5cf6'; // Violet
    case 'fini': return '#10b981'; // Vert
    case 'inactif': return '#ef4444'; // Rouge
    default: return '#3b82f6';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'nouveau': return 'Nouveau';
    case 'en_attente': return 'En attente';
    case 'fini': return 'Finalisé';
    case 'inactif': return 'Inactif';
    default: return 'Nouveau';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'nouveau': return '🔵';
    case 'en_attente': return '🟣';
    case 'fini': return '🟢';
    case 'inactif': return '🔴';
    default: return '🔵';
  }
};

export default Devis;