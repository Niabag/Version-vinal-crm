import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import InvoiceTemplate from '../Billing/InvoiceTemplate';
import InvoicePreview from './InvoicePreview';
import './clientBilling.scss';

const ClientBilling = ({ client, onBack }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvoiceTemplate, setShowInvoiceTemplate] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [previewDevis, setPreviewDevis] = useState([]);
  const [devisForClient, setDevisForClient] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    clientId: client?._id || '',
    devisIds: [],
    invoiceNumber: `FACT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Merci pour votre confiance.',
    paymentTerms: '30',
    discount: 0,
    taxRate: 20
  });
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState([]);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [showDevisPreview, setShowDevisPreview] = useState(false);
  const [selectedDevisForPreview, setSelectedDevisForPreview] = useState(null);

  useEffect(() => {
    if (client) {
      fetchClientInvoices();
      fetchClientDevis();
    }
  }, [client]);

  const fetchClientInvoices = async () => {
    try {
      setLoading(true);
      // Utiliser l'API réelle
      const data = await apiRequest(API_ENDPOINTS.INVOICES.BY_CLIENT(client._id));
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur récupération factures:", err);
      setError("Erreur lors de la récupération des factures");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDevis = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(client._id));
      setDevisForClient(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur récupération devis:", err);
    }
  };

  const handleViewInvoice = async (invoice) => {
    try {
      setLoading(true);
      // Récupérer les détails des devis liés à la facture
      const devisDetails = [];
      
      // Si la facture a des devis liés, les récupérer
      if (invoice.devisIds && invoice.devisIds.length > 0) {
        for (const devisId of invoice.devisIds) {
          try {
            const devis = await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(devisId));
            if (devis) devisDetails.push(devis);
          } catch (err) {
            console.error(`Erreur récupération devis ${devisId}:`, err);
          }
        }
      } else {
        // Si pas de devis liés, utiliser un devis fictif basé sur la facture
        devisDetails.push({
          title: "Prestation de services",
          clientId: client._id,
          dateDevis: invoice.createdAt,
          dateValidite: invoice.dueDate,
          entrepriseName: invoice.entrepriseName || "Votre Entreprise",
          entrepriseAddress: invoice.entrepriseAddress || "123 Rue Exemple",
          entrepriseCity: invoice.entrepriseCity || "75000 Paris",
          entreprisePhone: invoice.entreprisePhone || "01 23 45 67 89",
          entrepriseEmail: invoice.entrepriseEmail || "contact@entreprise.com",
          articles: [
            {
              description: "Prestation complète",
              unitPrice: invoice.amount * 0.8,
              quantity: 1,
              unit: "forfait",
              tvaRate: "20"
            }
          ]
        });
      }

      setSelectedInvoice(invoice);
      setPreviewDevis(devisDetails);
      setShowInvoiceTemplate(true);
    } catch (err) {
      console.error("Erreur affichage facture:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = async (invoice) => {
    try {
      setLoading(true);
      // Récupérer les détails des devis liés à la facture
      const devisDetails = [];
      
      // Si la facture a des devis liés, les récupérer
      if (invoice.devisIds && invoice.devisIds.length > 0) {
        for (const devisId of invoice.devisIds) {
          try {
            const devis = await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(devisId));
            if (devis) devisDetails.push(devis);
          } catch (err) {
            console.error(`Erreur récupération devis ${devisId}:`, err);
          }
        }
      } else {
        // Si pas de devis liés, utiliser un devis fictif basé sur la facture
        devisDetails.push({
          title: "Prestation de services",
          clientId: client._id,
          dateDevis: invoice.createdAt,
          dateValidite: invoice.dueDate,
          entrepriseName: invoice.entrepriseName || "Votre Entreprise",
          entrepriseAddress: invoice.entrepriseAddress || "123 Rue Exemple",
          entrepriseCity: invoice.entrepriseCity || "75000 Paris",
          entreprisePhone: invoice.entreprisePhone || "01 23 45 67 89",
          entrepriseEmail: invoice.entrepriseEmail || "contact@entreprise.com",
          articles: [
            {
              description: "Prestation complète",
              unitPrice: invoice.amount * 0.8,
              quantity: 1,
              unit: "forfait",
              tvaRate: "20"
            }
          ]
        });
      }

      setSelectedInvoice(invoice);
      setPreviewDevis(devisDetails);
      setIsCreatingNew(false);
      setShowInvoicePreview(true);
    } catch (err) {
      console.error("Erreur édition facture:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoice) => {
    try {
      setLoading(true);

      const [{ default: jsPDF }] = await Promise.all([
        import('jspdf')
      ]);

      // Récupérer les détails des devis liés à la facture
      const devisDetails = [];
      
      // Si la facture a des devis liés, les récupérer
      if (invoice.devisIds && invoice.devisIds.length > 0) {
        for (const devisId of invoice.devisIds) {
          try {
            const devis = await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(devisId));
            if (devis) devisDetails.push(devis);
          } catch (err) {
            console.error(`Erreur récupération devis ${devisId}:`, err);
          }
        }
      } else {
        // Si pas de devis liés, utiliser un devis fictif basé sur la facture
        devisDetails.push({
          title: "Prestation de services",
          clientId: client._id,
          dateDevis: invoice.createdAt,
          dateValidite: invoice.dueDate,
          entrepriseName: invoice.entrepriseName || "Votre Entreprise",
          entrepriseAddress: invoice.entrepriseAddress || "123 Rue Exemple",
          entrepriseCity: invoice.entrepriseCity || "75000 Paris",
          entreprisePhone: invoice.entreprisePhone || "01 23 45 67 89",
          entrepriseEmail: invoice.entrepriseEmail || "contact@entreprise.com",
          articles: [
            {
              description: "Prestation complète",
              unitPrice: invoice.amount * 0.8,
              quantity: 1,
              unit: "forfait",
              tvaRate: "20"
            }
          ]
        });
      }

      // Fusionner tous les articles
      const articles = devisDetails.flatMap((d) => d.articles || []);

      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.setFontSize(18);
      pdf.text(`Facture ${invoice.invoiceNumber}`, 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Client : ${client.name}`, 20, 40);
      pdf.text(`Émise le : ${formatDate(invoice.createdAt)}`, 20, 48);
      pdf.text(`Échéance : ${formatDate(invoice.dueDate)}`, 20, 56);

      let currentY = 70;
      pdf.text('Articles :', 20, currentY);
      currentY += 8;

      articles.forEach((article) => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const total = price * qty;

        pdf.text(article.description || '', 20, currentY);
        pdf.text(`${qty}`, 110, currentY, { align: 'right' });
        pdf.text(`${price.toFixed(2)} €`, 130, currentY, { align: 'right' });
        pdf.text(`${total.toFixed(2)} €`, 190, currentY, { align: 'right' });

        currentY += 6;
        if (currentY > 280) { pdf.addPage(); currentY = 20; }
      });

      const totalHT = articles.reduce(
        (sum, a) => sum + parseFloat(a.unitPrice || 0) * parseFloat(a.quantity || 0),
        0
      );
      const totalTVA = articles.reduce(
        (sum, a) => sum + (
          parseFloat(a.unitPrice || 0) * parseFloat(a.quantity || 0) * (parseFloat(a.tvaRate || 0) / 100)
        ),
        0
      );
      const totalTTC = totalHT + totalTVA;

      currentY += 10;
      pdf.text(`Total HT : ${totalHT.toFixed(2)} €`, 20, currentY);
      currentY += 8;
      pdf.text(`Total TVA : ${totalTVA.toFixed(2)} €`, 20, currentY);
      currentY += 8;
      pdf.setFontSize(14);
      pdf.text(`Total TTC : ${totalTTC.toFixed(2)} €`, 20, currentY);

      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm("Supprimer cette facture ?")) {
      try {
        await apiRequest(API_ENDPOINTS.INVOICES.DELETE(invoiceId), {
          method: "DELETE"
        });
        
        setInvoices(prev => prev.filter(inv => inv._id !== invoiceId));
        alert("✅ Facture supprimée avec succès");
      } catch (error) {
        console.error("Erreur suppression facture:", error);
        alert("❌ Erreur lors de la suppression de la facture");
      }
    }
  };

  const handleStatusClick = async (invoiceId, currentStatus) => {
    let newStatus;
    switch (currentStatus) {
      case 'draft':
        newStatus = 'pending';
        break;
      case 'pending':
        newStatus = 'paid';
        break;
      case 'paid':
        newStatus = 'overdue';
        break;
      case 'overdue':
        newStatus = 'draft';
        break;
      default:
        newStatus = 'pending';
    }

    try {
      await apiRequest(API_ENDPOINTS.INVOICES.UPDATE_STATUS(invoiceId), {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      
      setInvoices(prev =>
        prev.map(inv =>
          inv._id === invoiceId ? { ...inv, status: newStatus } : inv
        )
      );

      alert(`Statut de la facture mis à jour : ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      alert("❌ Erreur lors de la mise à jour du statut");
    }
  };

  const handleSelectDevis = (devisId) => {
    setSelectedDevis(prev => 
      prev.includes(devisId) 
        ? prev.filter(id => id !== devisId)
        : [...prev, devisId]
    );
  };

  const calculateInvoiceTotal = () => {
    const selectedDevisData = devisForClient.filter(d => selectedDevis.includes(d._id));
    const subtotal = selectedDevisData.reduce((sum, devis) => sum + calculateTTC(devis), 0);
    const discountAmount = subtotal * (newInvoice.discount / 100);
    return subtotal - discountAmount;
  };

  const handleCreateInvoice = async () => {
    try {
      setLoading(true);
      
      // Récupérer les détails des devis sélectionnés
      const selectedDevisData = [];
      
      if (selectedDevis.length > 0) {
        for (const devisId of selectedDevis) {
          try {
            const devis = await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(devisId));
            if (devis) selectedDevisData.push(devis);
          } catch (err) {
            console.error(`Erreur récupération devis ${devisId}:`, err);
          }
        }
      } else {
        // Si aucun devis sélectionné, créer un devis fictif
        selectedDevisData.push({
          title: "Prestation de services",
          clientId: client._id,
          dateDevis: new Date().toISOString(),
          dateValidite: newInvoice.dueDate,
          entrepriseName: "Votre Entreprise",
          entrepriseAddress: "123 Rue Exemple",
          entrepriseCity: "75000 Paris",
          entreprisePhone: "01 23 45 67 89",
          entrepriseEmail: "contact@entreprise.com",
          articles: [
            {
              description: "Prestation complète",
              unitPrice: 500,
              quantity: 1,
              unit: "forfait",
              tvaRate: "20"
            }
          ]
        });
      }

      // Créer une nouvelle facture pour l'aperçu
      const newInvoiceData = {
        invoiceNumber: newInvoice.invoiceNumber,
        clientId: client._id,
        devisIds: selectedDevis,
        amount: calculateInvoiceTotal(),
        status: 'draft',
        dueDate: newInvoice.dueDate,
        createdAt: new Date().toISOString(),
        notes: newInvoice.notes,
        paymentTerms: newInvoice.paymentTerms,
        discount: newInvoice.discount,
        taxRate: newInvoice.taxRate,
        entrepriseName: selectedDevisData[0]?.entrepriseName || "Votre Entreprise",
        entrepriseAddress: selectedDevisData[0]?.entrepriseAddress || "123 Rue Exemple",
        entrepriseCity: selectedDevisData[0]?.entrepriseCity || "75000 Paris",
        entreprisePhone: selectedDevisData[0]?.entreprisePhone || "01 23 45 67 89",
        entrepriseEmail: selectedDevisData[0]?.entrepriseEmail || "contact@entreprise.com"
      };

      setSelectedInvoice(newInvoiceData);
      setPreviewDevis(selectedDevisData);
      setIsCreatingNew(true);
      setShowInvoicePreview(true);
      
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      alert('❌ Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async (updatedInvoice) => {
    try {
      setLoading(true);
      
      if (isCreatingNew) {
        // Créer une nouvelle facture
        const response = await apiRequest(API_ENDPOINTS.INVOICES.BASE, {
          method: "POST",
          body: JSON.stringify(updatedInvoice)
        });
        
        // Ajouter la nouvelle facture à la liste
        setInvoices(prev => [response.invoice, ...prev]);
        alert('✅ Facture créée avec succès !');
      } else {
        // Mettre à jour une facture existante
        const response = await apiRequest(API_ENDPOINTS.INVOICES.UPDATE(updatedInvoice._id), {
          method: "PUT",
          body: JSON.stringify(updatedInvoice)
        });
        
        // Mettre à jour la liste
        setInvoices(prev => 
          prev.map(inv => inv._id === updatedInvoice._id ? response.invoice : inv)
        );
        alert('✅ Facture mise à jour avec succès !');
      }
      
      // Réinitialiser
      setSelectedDevis([]);
      setShowInvoicePreview(false);
      setShowCreateInvoice(false);
      setNewInvoice({
        clientId: client._id,
        devisIds: [],
        invoiceNumber: `FACT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Merci pour votre confiance.',
        paymentTerms: '30',
        discount: 0,
        taxRate: 20
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la facture:', error);
      alert('❌ Erreur lors de l\'enregistrement de la facture');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'overdue': return '#ef4444';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      case 'draft': return 'Brouillon';
      default: return 'Inconnu';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'overdue': return '⚠️';
      case 'draft': return '📝';
      default: return '❓';
    }
  };

  const getNextStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Passer en Attente';
      case 'pending':
        return 'Marquer Payée';
      case 'paid':
        return 'Marquer En retard';
      case 'overdue':
        return 'Repasser en Brouillon';
      default:
        return 'Changer le statut';
    }
  };

  // Fonction pour prévisualiser un devis
  const handlePreviewDevis = (devis) => {
    setSelectedDevisForPreview(devis);
    setShowDevisPreview(true);
  };

  // Fonction pour générer un PDF à partir d'un devis
  const handleDownloadDevisPDF = async (devis) => {
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
      await addSectionToPDF(`
        <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #e2e8f0;">
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
      `, true);

      // 2. INFORMATIONS PARTIES
      await addSectionToPDF(`
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">ÉMETTEUR</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${devis.entrepriseName || 'Nom de l\'entreprise'}</div>
              <div>${devis.entrepriseAddress || 'Adresse'}</div>
              <div>${devis.entrepriseCity || 'Code postal et ville'}</div>
              <div>${devis.entreprisePhone || 'Téléphone'}</div>
              <div>${devis.entrepriseEmail || 'Email'}</div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">DESTINATAIRE</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${client.name || 'Nom du client'}</div>
              <div>${client.email || 'Email du client'}</div>
              <div>${client.phone || 'Téléphone du client'}</div>
              <div>${client.address || 'Adresse du client'}</div>
              <div>${client.postalCode || ''} ${client.city || ''}</div>
            </div>
          </div>
        </div>
      `);

      // 3. MÉTADONNÉES
      await addSectionToPDF(`
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 30px;">
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
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${client.name || 'Client non défini'}</div>
            </div>
          </div>
        </div>
      `);
      
      // 4. DESCRIPTION si présente
      if (devis.description) {
        await addSectionToPDF(`
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 1rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600;">Description</h3>
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; color: #475569; line-height: 1.6; white-space: pre-line;">
              ${devis.description || ''}
            </div>
          </div>
        `);
      }

      // 5. TABLEAU - TRAITEMENT LIGNE PAR LIGNE
      // En-tête du tableau
      await addSectionToPDF(`
        <div style="margin-bottom: 10px;">
          <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">DÉTAIL DES PRESTATIONS</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); color: white;">
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
      `);

      // TRAITER CHAQUE LIGNE INDIVIDUELLEMENT
      for (let i = 0; i < devis.articles.length; i++) {
        const article = devis.articles[i];
        const price = parseFloat(article.unitPrice || "0");
        const qty = parseFloat(article.quantity || "0");
        const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f8f9fa';

        const rowHTML = `
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr style="background: ${bgColor};">
                <td style="padding: 1rem 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; width: 35%;">${article.description || ''}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${article.unit || ''}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${qty}</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 15%;">${price.toFixed(2)} €</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 10%;">${article.tvaRate || "20"}%</td>
                <td style="padding: 1rem 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; width: 20%; font-weight: 600; color: #48bb78;">${total.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>
        `;

        await addSectionToPDF(rowHTML);
      }

      // 6. TOTAUX
      const tauxTVA = {
        "20": { ht: 0, tva: 0 },
        "10": { ht: 0, tva: 0 },
        "5.5": { ht: 0, tva: 0 },
      };

      devis.articles.forEach((item) => {
        const price = parseFloat(item.unitPrice || "0");
        const qty = parseFloat(item.quantity || "0");
        const taux = item.tvaRate || "20";

        if (!isNaN(price) && !isNaN(qty) && tauxTVA[taux]) {
          const ht = price * qty;
          tauxTVA[taux].ht += ht;
          tauxTVA[taux].tva += ht * (parseFloat(taux) / 100);
        }
      });

      const totalHT = Object.values(tauxTVA).reduce((sum, t) => sum + t.ht, 0);
      const totalTVA = Object.values(tauxTVA).reduce((sum, t) => sum + t.tva, 0);
      const totalTTC = totalHT + totalTVA;

      await addSectionToPDF(`
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 30px 0;">
          <div>
            <h4 style="margin: 0 0 1rem 0; color: #2d3748; font-weight: 600;">Récapitulatif TVA</h4>
            <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white;">
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
                    <tr>
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
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 10px; font-weight: 500; min-width: 250px;">
              <span>Total HT :</span>
              <span>${totalHT.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 10px; font-weight: 500; min-width: 250px;">
              <span>Total TVA :</span>
              <span>${totalTVA.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; font-weight: 700; font-size: 1.1rem; border-radius: 10px; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3); min-width: 250px;">
              <span>Total TTC :</span>
              <span>${totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      `);

      // 7. CONDITIONS
      await addSectionToPDF(`
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
              <div style="flex: 1; padding: 1rem; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
                <span>Date : _______________</span>
              </div>
              <div style="flex: 1; padding: 1rem; border-bottom: 2px solid #2d3748; color: #4a5568; font-weight: 500;">
                <span>Signature :</span>
              </div>
            </div>
          </div>
        </div>
      `);

      // 8. PIED DE PAGE
      await addSectionToPDF(`
        <div style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin: 0;">
            ${devis.footerText || `${devis.entrepriseName || 'Votre entreprise'} - ${devis.entrepriseAddress || 'Adresse'} - ${devis.entrepriseCity || 'Ville'}`}
          </p>
        </div>
      `);

      // Télécharger le PDF
      const fileName = devis.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devis._id}`;
      pdf.save(`${fileName}.pdf`);

      // Nettoyer
      document.body.removeChild(tempDiv);
      
      console.log("✅ PDF généré avec succès");

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-billing-container">
      <div className="client-billing-header">
        <button onClick={onBack} className="back-button">
          ← Retour aux prospects
        </button>
        <div className="client-info">
          <div className="client-avatar">
            {client.name ? client.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="client-details">
            <h2>{client.name}</h2>
            <div className="client-contact">
              <span>{client.email}</span>
              <span>•</span>
              <span>{client.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="billing-stats">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{devisForClient.length}</h3>
            <p>Devis</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{invoices.length}</h3>
            <p>Factures</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{invoices.filter(inv => inv.status === 'paid').length}</h3>
            <p>Factures payées</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>{invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.amount : 0), 0).toFixed(2)} €</h3>
            <p>CA réalisé</p>
          </div>
        </div>
      </div>

      <div className="client-billing-actions">
        <button 
          className="create-invoice-btn"
          onClick={() => setShowCreateInvoice(true)}
        >
          ✨ Créer une facture
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Section des devis du client */}
      <div className="devis-section">
        <h3>Devis de {client.name}</h3>
        {devisForClient.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon">📄</div>
            <h3>Aucun devis</h3>
            <p>Ce client n'a pas encore de devis.</p>
          </div>
        ) : (
          <div className="devis-grid">
            {devisForClient.map((devis) => (
              <div 
                key={devis._id} 
                className="devis-card"
                onClick={() => handlePreviewDevis(devis)}
              >
                <div className="devis-card-content">
                  <h3 className="devis-card-title">{devis.title || "Devis sans titre"}</h3>
                  
                  <div className="devis-meta">
                    <div className="devis-date">
                      <span className="date-icon">📅</span>
                      <span>{formatDate(devis.dateDevis)}</span>
                    </div>
                    
                    <div className="devis-status">
                      <span className="status-badge" style={{ 
                        backgroundColor: 
                          devis.status === 'nouveau' ? '#4299e1' : 
                          devis.status === 'en_attente' ? '#9f7aea' : 
                          devis.status === 'fini' ? '#48bb78' : 
                          '#f56565',
                        color: 'white'
                      }}>
                        {devis.status === 'nouveau' ? '🔵' : 
                         devis.status === 'en_attente' ? '🟣' : 
                         devis.status === 'fini' ? '🟢' : 
                         '🔴'} {
                          devis.status === 'nouveau' ? 'Nouveau' : 
                          devis.status === 'en_attente' ? 'En attente' : 
                          devis.status === 'fini' ? 'Finalisé' : 
                          'Inactif'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="devis-amount">
                    <span className="amount-label">Montant TTC :</span>
                    <span className="amount-value">{calculateTTC(devis).toFixed(2)} €</span>
                  </div>

                  <div className="devis-card-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDevisPDF(devis);
                      }}
                      className="card-btn card-btn-pdf"
                      disabled={loading}
                    >
                      {loading ? "⏳" : "📄"} PDF
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Créer une facture à partir de ce devis
                        setSelectedDevis([devis._id]);
                        handleCreateInvoice();
                      }}
                      className="card-btn card-btn-invoice"
                    >
                      💰 Facturer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section des factures */}
      <div className="invoices-section">
        <h3>Factures de {client.name}</h3>
        {loading && invoices.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Chargement des factures...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon">📋</div>
            <h3>Aucune facture</h3>
            <p>Ce client n'a pas encore de factures.</p>
          </div>
        ) : (
          <div className="invoices-grid">
            {invoices.map((invoice) => (
              <div key={invoice._id} className="invoice-card">
                <div className="invoice-header">
                  <div className="invoice-number">{invoice.invoiceNumber}</div>
                  <div
                    className="invoice-status clickable"
                    style={{ backgroundColor: getStatusColor(invoice.status), color: 'white' }}
                    title={getNextStatusLabel(invoice.status)}
                    onClick={() => handleStatusClick(invoice._id, invoice.status)}
                  >
                    {getStatusIcon(invoice.status)} {getStatusLabel(invoice.status)}
                  </div>
                </div>

                <div className="invoice-content">
                  <div className="invoice-amount">
                    <span className="amount-label">Montant :</span>
                    <span className="amount-value">{invoice.amount.toFixed(2)} €</span>
                  </div>

                  <div className="invoice-dates">
                    <div className="invoice-date">
                      <span>📅 Émise le : {formatDate(invoice.createdAt)}</span>
                    </div>
                    <div className="invoice-due">
                      <span>⏰ Échéance : {formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>

                  <div className="invoice-devis">
                    <span>📄 Devis inclus : {invoice.devisIds?.length || "Aucun"}</span>
                  </div>
                </div>

                <div className="invoice-actions">
                  <button
                    onClick={() => handleViewInvoice(invoice)}
                    className="action-btn view-btn"
                    title="Voir la facture"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleEditInvoice(invoice)}
                    className="action-btn edit-btn"
                    title="Modifier la facture"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDownloadInvoicePDF(invoice)}
                    className="action-btn download-btn"
                    title="Télécharger PDF"
                  >
                    📥
                  </button>
                  <button className="action-btn send-btn" title="Envoyer par email">
                    📧
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(invoice._id)}
                    className="action-btn delete-btn"
                    title="Supprimer la facture"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de prévisualisation de devis */}
      {showDevisPreview && selectedDevisForPreview && (
        <div className="modal-overlay" onClick={() => setShowDevisPreview(false)}>
          <div className="modal-content devis-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Aperçu du devis</h3>
              <button onClick={() => setShowDevisPreview(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="devis-preview">
                <div className="devis-preview-header">
                  <h2>{selectedDevisForPreview.title || "Devis sans titre"}</h2>
                  <p>Montant total: <span className="total-amount">{calculateTTC(selectedDevisForPreview).toFixed(2)} €</span></p>
                </div>
                
                <div className="devis-preview-content">
                  <div className="devis-preview-section">
                    <h3>Informations</h3>
                    <div className="devis-preview-info">
                      <div className="info-row">
                        <span className="info-label">Date du devis:</span>
                        <span className="info-value">{formatDate(selectedDevisForPreview.dateDevis)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Date de validité:</span>
                        <span className="info-value">{formatDate(selectedDevisForPreview.dateValidite)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Statut:</span>
                        <span className="info-value status-badge" style={{ 
                          backgroundColor: 
                            selectedDevisForPreview.status === 'nouveau' ? '#4299e1' : 
                            selectedDevisForPreview.status === 'en_attente' ? '#9f7aea' : 
                            selectedDevisForPreview.status === 'fini' ? '#48bb78' : 
                            '#f56565',
                          color: 'white',
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem'
                        }}>
                          {selectedDevisForPreview.status === 'nouveau' ? '🔵 Nouveau' : 
                           selectedDevisForPreview.status === 'en_attente' ? '🟣 En attente' : 
                           selectedDevisForPreview.status === 'fini' ? '🟢 Finalisé' : 
                           '🔴 Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="devis-preview-section">
                    <h3>Articles</h3>
                    <table className="devis-preview-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Quantité</th>
                          <th>Prix unitaire</th>
                          <th>TVA</th>
                          <th>Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDevisForPreview.articles && selectedDevisForPreview.articles.map((article, index) => {
                          const price = parseFloat(article.unitPrice || 0);
                          const qty = parseFloat(article.quantity || 0);
                          const lineTotal = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                          
                          return (
                            <tr key={index}>
                              <td>{article.description || "Article sans description"}</td>
                              <td>{qty} {article.unit}</td>
                              <td>{price.toFixed(2)} €</td>
                              <td>{article.tvaRate || 0}%</td>
                              <td>{lineTotal.toFixed(2)} €</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="devis-preview-actions">
                    <button 
                      onClick={() => {
                        setShowDevisPreview(false);
                        handleDownloadDevisPDF(selectedDevisForPreview);
                      }}
                      className="devis-action-btn pdf-btn"
                    >
                      📄 Télécharger PDF
                    </button>
                    <button 
                      onClick={() => {
                        setShowDevisPreview(false);
                        setSelectedDevis([selectedDevisForPreview._id]);
                        handleCreateInvoice();
                      }}
                      className="devis-action-btn invoice-btn"
                    >
                      💰 Créer une facture
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de facture */}
      {showCreateInvoice && (
        <div className="modal-overlay" onClick={() => setShowCreateInvoice(false)}>
          <div className="modal-content create-invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Créer une nouvelle facture pour {client.name}</h3>
              <button 
                onClick={() => setShowCreateInvoice(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="invoice-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Numéro de facture :</label>
                    <input
                      type="text"
                      value={newInvoice.invoiceNumber}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Date d'échéance :</label>
                    <input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Conditions de paiement :</label>
                    <select
                      value={newInvoice.paymentTerms}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      className="form-select"
                    >
                      <option value="15">15 jours</option>
                      <option value="30">30 jours</option>
                      <option value="45">45 jours</option>
                      <option value="60">60 jours</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Remise (%) :</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newInvoice.discount}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes :</label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-textarea"
                    rows={3}
                    placeholder="Notes ou conditions particulières..."
                  />
                </div>

                {/* Sélection des devis */}
                {devisForClient.length > 0 ? (
                  <div className="devis-selection">
                    <h4>Sélectionner les devis à inclure :</h4>
                    <div className="devis-list">
                      {devisForClient.map(devis => (
                        <div key={devis._id} className="devis-item">
                          <label className="devis-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedDevis.includes(devis._id)}
                              onChange={() => handleSelectDevis(devis._id)}
                            />
                            <div className="devis-details">
                              <span className="devis-title">{devis.title}</span>
                              <span className="devis-amount">{calculateTTC(devis).toFixed(2)} €</span>
                              <span className="devis-date">{formatDate(devis.dateDevis)}</span>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-devis-message">
                    <p>Aucun devis disponible pour ce client.</p>
                    <p>La facture sera créée sans référence à un devis.</p>
                  </div>
                )}

                <div className="invoice-summary">
                  <h4>Résumé de la facture :</h4>
                  <div className="summary-details">
                    <div className="summary-line">
                      <span>Devis sélectionnés :</span>
                      <span>{selectedDevis.length}</span>
                    </div>
                    <div className="summary-line">
                      <span>Sous-total :</span>
                      <span>{(calculateInvoiceTotal() / (1 - newInvoice.discount / 100)).toFixed(2)} €</span>
                    </div>
                    {newInvoice.discount > 0 && (
                      <div className="summary-line discount">
                        <span>Remise ({newInvoice.discount}%) :</span>
                        <span>-{((calculateInvoiceTotal() / (1 - newInvoice.discount / 100)) * newInvoice.discount / 100).toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="summary-line total">
                      <span>Total TTC :</span>
                      <span>{calculateInvoiceTotal().toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowCreateInvoice(false)}
                className="btn-cancel"
              >
                Annuler
              </button>
              <button 
                onClick={handleCreateInvoice}
                className="btn-save"
                disabled={loading}
              >
                {loading ? 'Création...' : '👁️ Prévisualiser la facture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de prévisualisation de facture */}
      {showInvoicePreview && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoicePreview(false)}>
          <div className="modal-content invoice-preview-modal" onClick={(e) => e.stopPropagation()}>
            <InvoicePreview
              invoice={selectedInvoice}
              client={client}
              devisDetails={previewDevis}
              onSave={handleSaveInvoice}
              onCancel={() => setShowInvoicePreview(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de facture professionnelle */}
      {showInvoiceTemplate && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoiceTemplate(false)}>
          <div className="modal-content invoice-template-modal" onClick={(e) => e.stopPropagation()}>
            <InvoiceTemplate
              invoice={selectedInvoice}
              devisDetails={previewDevis}
              client={client}
              onClose={() => setShowInvoiceTemplate(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBilling;