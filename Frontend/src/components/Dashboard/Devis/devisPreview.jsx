import React, { useRef, useState, useEffect } from 'react';
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
  const [pdfMode, setPdfMode] = useState(false);
  const [logoPreview, setLogoPreview] = useState(devisData.logoUrl || '');

  useEffect(() => {
    setLogoPreview(devisData.logoUrl || '');
  }, [devisData.logoUrl]);

  if (!devisData || !Array.isArray(devisData.articles)) {
    return <div className="devis-preview error-message">⚠️ Données du devis invalides ou incomplètes.</div>;
  }

  // Calculs des totaux
  const tauxTVA = {
    "20": { ht: 0, tva: 0 },
    "10": { ht: 0, tva: 0 },
    "5.5": { ht: 0, tva: 0 },
    "0": { ht: 0, tva: 0 }
  };

  devisData.articles.forEach((item) => {
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

  // Récupération des infos client
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

  // Formatage de l'adresse complète du client
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

  // Génération du PDF
  const handleGeneratePDF = async () => {
    try {
      setPdfMode(true);
      
      // Attendre que le DOM soit mis à jour avec la classe pdf-mode
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const content = previewRef.current;
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`devis-${devisData.title || 'sans-titre'}.pdf`);
      
      setPdfMode(false);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      setPdfMode(false);
      alert('Erreur lors de la génération du PDF: ' + error.message);
    }
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Calcul de la date de validité par défaut (30 jours après la date du devis)
  const calculateDefaultValidityDate = () => {
    if (!devisData.dateDevis) return '';
    
    try {
      const devisDate = new Date(devisData.dateDevis);
      const validityDate = new Date(devisDate);
      validityDate.setDate(validityDate.getDate() + 30);
      
      return validityDate.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="devis-preview">
      <div className="preview-toolbar">
        <button onClick={onAddArticle} className="toolbar-btn add-btn">
          ➕ Ajouter une ligne
        </button>
        <button onClick={handleGeneratePDF} className="toolbar-btn pdf-btn">
          📄 Générer PDF
        </button>
        {devisData._id && (
          <button onClick={onReset} className="toolbar-btn reset-btn">
            🔄 Nouveau devis
          </button>
        )}
      </div>

      <div className={`preview-content ${pdfMode ? 'pdf-mode' : ''}`} ref={previewRef}>
        {/* En-tête avec logo et titre */}
        <div className="document-header">
          <div className="logo-section">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo entreprise" className="company-logo" />
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
                      reader.onloadend = () => {
                        onFieldChange("logoUrl", reader.result);
                        setLogoPreview(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
          
          <div className="document-title">
            <h1>DEVIS</h1>
            <EditableInput 
              name="title" 
              value={devisData.title || ""} 
              placeholder="Titre du devis" 
              onChange={onFieldChange}
              className="document-subtitle"
            />
          </div>
        </div>

        {/* Informations entreprise et client */}
        <div className="parties-info">
          <div className="entreprise-section">
            <h3>Émetteur</h3>
            <div className="info-group">
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

          <div className="client-section">
            <h3>Destinataire</h3>
            <div className="info-group">
              <div className="client-selector">
                <label>Client</label>
                <select
                  value={devisData.clientId || ""}
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
              
              <EditableInput 
                name="clientName" 
                value={devisData.clientName || clientInfo.name || ""} 
                placeholder="Nom du client" 
                onChange={onFieldChange}
                className="client-name"
              />
              <EditableInput 
                name="clientEmail" 
                value={devisData.clientEmail || clientInfo.email || ""} 
                placeholder="Email du client" 
                onChange={onFieldChange} 
              />
              <EditableInput 
                name="clientPhone" 
                value={devisData.clientPhone || clientInfo.phone || ""} 
                placeholder="Téléphone du client" 
                onChange={onFieldChange} 
              />
              <textarea
                className="editable-input client-address"
                placeholder="Adresse du client"
                value={devisData.clientAddress || formatClientAddress()}
                onChange={(e) => onFieldChange("clientAddress", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Métadonnées du devis */}
        <div className="devis-metadata">
          <div className="metadata-grid">
            <div className="metadata-item">
              <label>Date du devis :</label>
              <EditableInput 
                type="date" 
                name="dateDevis" 
                value={devisData.dateDevis || new Date().toISOString().split('T')[0]} 
                onChange={onFieldChange} 
              />
            </div>
            <div className="metadata-item">
              <label>Numéro de devis :</label>
              <EditableInput 
                name="devisNumber" 
                value={devisData.devisNumber || `DEV-${Date.now().toString().slice(-6)}`} 
                onChange={onFieldChange} 
                className="devis-number"
              />
            </div>
            <div className="metadata-item">
              <label>Date de validité :</label>
              <EditableInput 
                type="date" 
                name="dateValidite" 
                value={devisData.dateValidite || calculateDefaultValidityDate()} 
                onChange={onFieldChange} 
              />
            </div>
            <div className="metadata-item">
              <label>Statut :</label>
              <select
                className="status-select"
                value={devisData.status || "nouveau"}
                onChange={(e) => onFieldChange("status", e.target.value)}
              >
                <option value="nouveau">🔵 Nouveau</option>
                <option value="en_attente">🟣 En attente</option>
                <option value="fini">🟢 Finalisé</option>
                <option value="inactif">🔴 Inactif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description du devis */}
        <div className="devis-description">
          <h3>Description</h3>
          <textarea
            className="editable-input description-textarea"
            placeholder="Description du projet ou commentaires généraux..."
            value={devisData.description || ""}
            onChange={(e) => onFieldChange("description", e.target.value)}
            rows={3}
          />
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
                  <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
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
                        min="0"
                        step="1"
                      />
                    </td>
                    <td>
                      <div className="price-input-container">
                        <EditableInput 
                          name="article-unitPrice" 
                          value={article.unitPrice || ""} 
                          onChange={onFieldChange} 
                          index={index} 
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <span className="currency-symbol">€</span>
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
                        <option value="0">0%</option>
                      </select>
                    </td>
                    <td className="total-cell">{total.toFixed(2)} €</td>
                    <td className="actions-column">
                      <button 
                        className="remove-article-btn"
                        onClick={() => onRemoveArticle && onRemoveArticle(index)}
                        title="Supprimer cette ligne"
                        type="button"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <button 
            className="add-article-btn"
            onClick={onAddArticle}
            type="button"
          >
            + Ajouter une ligne
          </button>
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
            <h4>Conditions</h4>
            <textarea
              className="editable-input conditions-textarea"
              placeholder="Conditions de vente, modalités de paiement, etc."
              value={devisData.conditions || "• Devis valable jusqu'au " + formatDate(devisData.dateValidite) + "\n• Règlement à 30 jours fin de mois\n• TVA non applicable, art. 293 B du CGI (si applicable)"}
              onChange={(e) => onFieldChange("conditions", e.target.value)}
              rows={4}
            />
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

        {/* Pied de page */}
        <div className="footer-section">
          <div className="footer-content">
            <EditableInput 
              name="footerText" 
              value={devisData.footerText || `${devisData.entrepriseName || 'Votre entreprise'} - ${devisData.entrepriseAddress || 'Adresse'} - ${devisData.entrepriseCity || 'Ville'}`} 
              onChange={onFieldChange}
              className="footer-text"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DevisPreview);