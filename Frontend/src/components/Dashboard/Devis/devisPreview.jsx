import React, { useRef, memo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import EditableInput from './editableInput';
import './devisPreview.scss';

const DevisPreview = ({ 
  devisData, 
  onFieldChange, 
  onAddArticle, 
  onRemoveArticle,
  onReset, 
  clients = [] 
}) => {
  const previewRef = useRef();

  if (!devisData || !Array.isArray(devisData.articles)) {
    return <div className="devis-preview error-message">⚠️ Données du devis invalides ou incomplètes.</div>;
  }

  const tauxTVA = {
    "20": { ht: 0, tva: 0 },
    "10": { ht: 0, tva: 0 },
    "5.5": { ht: 0, tva: 0 },
  };

  devisData.articles.forEach((item) => {
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

  // Fonction sécurisée pour récupérer les infos client
  const getClientInfo = () => {
    if (!devisData.clientId || !clients.length) {
      return { name: '', email: '', phone: '', address: '', postalCode: '', city: '' };
    }
    
    // Gérer le cas où clientId est un objet ou une string
    const clientId = typeof devisData.clientId === 'object' && devisData.clientId !== null 
      ? devisData.clientId._id 
      : devisData.clientId;
    
    const client = clients.find(c => c._id === clientId);
    return client || { name: '', email: '', phone: '', address: '', postalCode: '', city: '' };
  };

  const clientInfo = getClientInfo();

  // Formater l'adresse complète du client
  const formatClientAddress = () => {
    const parts = [];
    if (clientInfo.address) parts.push(clientInfo.address);
    if (clientInfo.postalCode && clientInfo.city) {
      parts.push(`${clientInfo.postalCode} ${clientInfo.city}`);
    } else if (clientInfo.city) {
      parts.push(clientInfo.city);
    }
    return parts.join('\n');
  };

  // Fonction pour générer un PDF
  const handleDownloadPDF = async () => {
    try {
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
              ${devisData.logoUrl ? `<img src="${devisData.logoUrl}" alt="Logo" style="max-width: 200px; max-height: 100px; object-fit: contain; border-radius: 8px;">` : ''}
            </div>
            <div style="flex: 1; text-align: right;">
              <h1 style="font-size: 3rem; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: 2px;">DEVIS</h1>
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
              <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${devisData.entrepriseName || 'Nom de l\'entreprise'}</div>
              <div>${devisData.entrepriseAddress || 'Adresse'}</div>
              <div>${devisData.entrepriseCity || 'Code postal et ville'}</div>
              <div>${devisData.entreprisePhone || 'Téléphone'}</div>
              <div>${devisData.entrepriseEmail || 'Email'}</div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 1.5rem 0; color: #2d3748; font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">DESTINATAIRE</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="font-weight: 600; font-size: 1.1rem; color: #2d3748;">${clientInfo.name || 'Nom du client'}</div>
              <div>${clientInfo.email || 'Email du client'}</div>
              <div>${clientInfo.phone || 'Téléphone du client'}</div>
              <div>${clientInfo.address || 'Adresse du client'}</div>
              <div>${clientInfo.postalCode || ''} ${clientInfo.city || ''}</div>
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
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(devisData.dateDevis)}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Numéro de devis :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${devisData._id || 'À définir'}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Date de validité :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${formatDate(devisData.dateValidite)}</div>
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; opacity: 0.9;">Client :</div>
              <div style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 6px; font-weight: 600;">${clientInfo.name || 'Client non défini'}</div>
            </div>
          </div>
        </div>
      `);

      // 4. TABLEAU - TRAITEMENT LIGNE PAR LIGNE
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
      for (let i = 0; i < devisData.articles.length; i++) {
        const article = devisData.articles[i];
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

      // 5. TOTAUX
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
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 6px; font-weight: 500;">
              <span>Total HT :</span>
              <span>${totalHT.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 6px; font-weight: 500;">
              <span>Total TVA :</span>
              <span>${totalTVA.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; font-weight: 700; font-size: 1.1rem; border-radius: 6px; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);">
              <span>Total TTC :</span>
              <span>${totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      `);

      // 6. CONDITIONS
      await addSectionToPDF(`
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 2rem; border-radius: 12px; border-left: 4px solid #667eea; margin-top: 30px;">
          <div style="margin-bottom: 2rem;">
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;"><strong>Conditions :</strong></p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Devis valable jusqu'au ${formatDate(devisData.dateValidite) || "date à définir"}</p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• Règlement à 30 jours fin de mois</p>
            <p style="margin: 0.5rem 0; color: #4a5568; line-height: 1.6;">• TVA non applicable, art. 293 B du CGI (si applicable)</p>
          </div>
          
          <div style="text-align: center;">
            <p style="font-style: italic; color: #718096; margin-bottom: 2rem;">
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

      // Télécharger le PDF
      const fileName = devisData.title?.replace(/[^a-zA-Z0-9]/g, '-') || `devis-${devisData._id || Date.now()}`;
      pdf.save(`${fileName}.pdf`);

      // Nettoyer
      document.body.removeChild(tempDiv);
      
      console.log("✅ PDF généré avec succès");

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('❌ Erreur lors de la génération du PDF: ' + error.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <div className="devis-preview">
      <div className="preview-toolbar">
        <button onClick={onAddArticle} className="toolbar-btn add-btn">
          ➕ Ajouter une ligne
        </button>
        <button onClick={handleDownloadPDF} className="toolbar-btn pdf-btn">
          📄 Télécharger PDF
        </button>
        <button onClick={onReset} className="toolbar-btn reset-btn">
          🔄 Nouveau devis
        </button>
      </div>

      <div className="preview-content" ref={previewRef}>
        {/* En-tête avec logo et titre */}
        <div className="document-header">
          <div className="company-info">
            {devisData.logoUrl ? (
              <img src={devisData.logoUrl} alt="Logo entreprise" className="company-logo" />
            ) : (
              <label className="logo-upload-area">
                📷 Cliquez pour ajouter un logo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => onFieldChange("logoUrl", reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
            <div className="company-details">
              <EditableInput 
                name="entrepriseName" 
                value={devisData.entrepriseName || ""} 
                placeholder="Nom de l'entreprise" 
                onChange={onFieldChange}
                className="company-name"
              />
              <EditableInput 
                name="entrepriseAddress" 
                value={devisData.entrepriseAddress || ""} 
                placeholder="Adresse" 
                onChange={onFieldChange} 
              />
              <EditableInput 
                name="entrepriseCity" 
                value={devisData.entrepriseCity || ""} 
                placeholder="Code postal et ville" 
                onChange={onFieldChange} 
              />
              <EditableInput 
                name="entreprisePhone" 
                value={devisData.entreprisePhone || ""} 
                placeholder="Téléphone" 
                onChange={onFieldChange} 
              />
              <EditableInput 
                name="entrepriseEmail" 
                value={devisData.entrepriseEmail || ""} 
                placeholder="Email" 
                onChange={onFieldChange} 
              />
            </div>
          </div>
          
          <div className="document-info">
            <h1>DEVIS</h1>
            <div className="document-number">N° {devisData._id || devisData.devisNumber || "À définir"}</div>
            <div className="document-date">
              Date: 
              <EditableInput 
                type="date" 
                name="dateDevis" 
                value={devisData.dateDevis || ""} 
                onChange={onFieldChange} 
                className="date-input"
              />
            </div>
            <div className="document-validity">
              Validité: 
              <EditableInput 
                type="date" 
                name="dateValidite" 
                value={devisData.dateValidite || ""} 
                onChange={onFieldChange} 
                className="date-input"
              />
            </div>
          </div>
        </div>

        {/* Informations client */}
        <div className="client-section">
          <div className="section-title">DESTINATAIRE</div>
          <div className="client-details">
            <div className="client-info-row">
              <div className="client-info-label">Client:</div>
              <div className="client-info-value">
                <select
                  value={typeof devisData.clientId === 'object' ? devisData.clientId?._id : devisData.clientId}
                  onChange={(e) => onFieldChange("clientId", e.target.value)}
                  className="client-select"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="client-info-row">
              <div className="client-info-label">Nom:</div>
              <div className="client-info-value">
                <EditableInput 
                  name="clientName" 
                  value={devisData.clientName || clientInfo.name || ""} 
                  placeholder="Nom du client" 
                  onChange={onFieldChange}
                  className="client-name"
                />
              </div>
            </div>
            <div className="client-info-row">
              <div className="client-info-label">Email:</div>
              <div className="client-info-value">
                <EditableInput 
                  name="clientEmail" 
                  value={devisData.clientEmail || clientInfo.email || ""} 
                  placeholder="Email du client" 
                  onChange={onFieldChange} 
                />
              </div>
            </div>
            <div className="client-info-row">
              <div className="client-info-label">Téléphone:</div>
              <div className="client-info-value">
                <EditableInput 
                  name="clientPhone" 
                  value={devisData.clientPhone || clientInfo.phone || ""} 
                  placeholder="Téléphone du client" 
                  onChange={onFieldChange} 
                />
              </div>
            </div>
            <div className="client-info-row">
              <div className="client-info-label">Adresse:</div>
              <div className="client-info-value">
                <textarea
                  className="editable-input client-address"
                  placeholder="Adresse du client"
                  value={devisData.clientAddress || formatClientAddress()}
                  onChange={(e) => onFieldChange("clientAddress", e.target.value)}
                  rows={3}
                  style={{
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des prestations */}
        <div className="prestations-section">
          <h3>Détail des prestations</h3>
          <table className="prestations-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Unité</th>
                <th>Qté</th>
                <th>Prix unitaire HT</th>
                <th>TVA</th>
                <th>Total HT</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devisData.articles.map((article, index) => {
                const price = parseFloat(article.unitPrice || "0");
                const qty = parseFloat(article.quantity || "0");
                const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                
                return (
                  <tr key={index}>
                    <td className="description-cell">
                      <EditableInput 
                        name="article-description" 
                        value={article.description || ""} 
                        onChange={onFieldChange} 
                        index={index} 
                        placeholder="Description de la prestation"
                      />
                    </td>
                    <td>
                      <EditableInput 
                        name="article-unit" 
                        value={article.unit || ""} 
                        onChange={onFieldChange} 
                        index={index} 
                        placeholder="u"
                      />
                    </td>
                    <td>
                      <EditableInput 
                        name="article-quantity" 
                        value={article.quantity || ""} 
                        onChange={onFieldChange} 
                        index={index} 
                        type="number"
                        placeholder="1"
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EditableInput 
                          name="article-unitPrice" 
                          value={article.unitPrice || ""} 
                          onChange={onFieldChange} 
                          index={index} 
                          type="number"
                          placeholder="0"
                        />
                        <span>€</span>
                      </div>
                    </td>
                    <td>
                      <span className="tva-text-only">{article.tvaRate || "20"}%</span>
                      <select
                        className="tva-select"
                        name="article-tvaRate"
                        value={article.tvaRate || "20"}
                        onChange={(e) => onFieldChange("article-tvaRate", e.target.value, index)}
                      >
                        <option value="20">20%</option>
                        <option value="10">10%</option>
                        <option value="5.5">5.5%</option>
                      </select>
                    </td>
                    <td className="total-cell">{total.toFixed(2)} €</td>
                    <td className="actions-column">
                      <button 
                        className="remove-article-btn"
                        onClick={() => onRemoveArticle && onRemoveArticle(index)}
                        title="Supprimer cette ligne"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Récapitulatif des totaux */}
        <div className="totaux-section">
          <div className="totaux-detail">
            <h4>Récapitulatif TVA</h4>
            <table className="tva-table">
              <thead>
                <tr>
                  <th>Base HT</th>
                  <th>Taux TVA</th>
                  <th>Montant TVA</th>
                  <th>Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tauxTVA)
                  .filter(([, { ht }]) => ht > 0)
                  .map(([rate, { ht, tva }]) => (
                  <tr key={rate}>
                    <td>{ht.toFixed(2)} €</td>
                    <td>{rate}%</td>
                    <td>{tva.toFixed(2)} €</td>
                    <td>{(ht + tva).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totaux-finaux">
            <div className="total-line">
              <span>Total HT :</span>
              <span>{totalHT.toFixed(2)} €</span>
            </div>
            <div className="total-line">
              <span>Total TVA :</span>
              <span>{totalTVA.toFixed(2)} €</span>
            </div>
            <div className="total-line final-total">
              <span>Total TTC :</span>
              <span>{totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Conditions et signature */}
        <div className="conditions-section">
          <div className="conditions-text">
            <p><strong>Conditions :</strong></p>
            <p>• Devis valable jusqu'au {devisData.dateValidite ? new Date(devisData.dateValidite).toLocaleDateString('fr-FR') : "date à définir"}</p>
            <p>• Règlement à 30 jours fin de mois</p>
            <p>• TVA non applicable, art. 293 B du CGI (si applicable)</p>
          </div>
          
          <div className="signature-area">
            <p className="signature-instruction">
              <em>Bon pour accord - Date et signature du client :</em>
            </p>
            <div className="signature-box">
              <div className="signature-line">
                <span>Date : _______________</span>
              </div>
              <div className="signature-line">
                <span>Signature :</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DevisPreview);