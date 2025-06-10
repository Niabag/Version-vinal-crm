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
    "0": { ht: 0, tva: 0 }
  };

  devisData.articles.forEach((item) => {
    const price = parseFloat(item.unitPrice || "0");
    const qty = parseFloat(item.quantity || "0");
    const taux = item.tvaRate || "0";

    if (!isNaN(price) && !isNaN(qty) && tauxTVA[taux] !== undefined) {
      const ht = price * qty;
      tauxTVA[taux].ht += ht;
      tauxTVA[taux].tva += ht * (parseFloat(taux) / 100);
    } else if (!isNaN(price) && !isNaN(qty)) {
      // Si le taux n'est pas dans notre objet, on l'ajoute
      const tauxValue = parseFloat(taux) || 0;
      if (!tauxTVA[taux]) {
        tauxTVA[taux] = { ht: 0, tva: 0 };
      }
      const ht = price * qty;
      tauxTVA[taux].ht += ht;
      tauxTVA[taux].tva += ht * (tauxValue / 100);
    }
  });

  const totalHT = Object.values(tauxTVA).reduce((sum, { ht }) => sum + ht, 0);
  const totalTVA = Object.values(tauxTVA).reduce((sum, { tva }) => sum + tva, 0);
  const totalTTC = totalHT + totalTVA;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleGeneratePDF = () => {
    const input = previewRef.current;
    const pdfMode = document.createElement('div');
    pdfMode.innerHTML = input.innerHTML;
    pdfMode.classList.add('pdf-mode');
    document.body.appendChild(pdfMode);

    html2canvas(pdfMode, { scale: 2 }).then((canvas) => {
      document.body.removeChild(pdfMode);
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
      pdf.save(`devis_${devisData.devisNumber || 'nouveau'}.pdf`);
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onFieldChange('logo', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedClient = clients.find(c => c.id === devisData.clientId) || {};

  return (
    <div className="devis-preview">
      <div className="preview-toolbar">
        <button className="toolbar-btn add-btn" onClick={onAddArticle}>
          <i className="fas fa-plus"></i> Ajouter un article
        </button>
        <button className="toolbar-btn reset-btn" onClick={onReset}>
          <i className="fas fa-undo"></i> Réinitialiser
        </button>
        <button className="toolbar-btn pdf-btn" onClick={handleGeneratePDF}>
          <i className="fas fa-file-pdf"></i> Générer PDF
        </button>
      </div>

      <div className="preview-content" ref={previewRef}>
        <div className="document-header">
          <div className="logo-section">
            {devisData.logo ? (
              <img src={devisData.logo} alt="Logo" className="company-logo" />
            ) : (
              <div className="logo-upload-area" onClick={() => document.getElementById('logo-upload').click()}>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
                Cliquez pour ajouter un logo
              </div>
            )}
          </div>
          <div className="document-title">
            <h1>DEVIS</h1>
          </div>
        </div>

        <div className="parties-info">
          <div className="entreprise-section">
            <h3>ÉMETTEUR</h3>
            <div className="info-group">
              <EditableInput
                className="company-name"
                value={devisData.companyName || "Nom de l'entreprise"}
                onChange={(value) => onFieldChange('companyName', value)}
                placeholder="Nom de l'entreprise"
              />
              <EditableInput
                value={devisData.companyAddress || "123 Rue Exemple"}
                onChange={(value) => onFieldChange('companyAddress', value)}
                placeholder="Adresse"
              />
              <EditableInput
                value={devisData.companyCity || "75000 Paris"}
                onChange={(value) => onFieldChange('companyCity', value)}
                placeholder="Code postal et ville"
              />
              <EditableInput
                value={devisData.companyPhone || "01 23 45 67 89"}
                onChange={(value) => onFieldChange('companyPhone', value)}
                placeholder="Téléphone"
              />
              <EditableInput
                value={devisData.companyEmail || "contact@entreprise.com"}
                onChange={(value) => onFieldChange('companyEmail', value)}
                placeholder="Email"
              />
            </div>
          </div>
          <div className="client-section">
            <h3>CLIENT</h3>
            <div className="info-group">
              <EditableInput
                className="client-name"
                value={selectedClient.name || devisData.clientName || "Nom du client"}
                onChange={(value) => onFieldChange('clientName', value)}
                placeholder="Nom du client"
              />
              <EditableInput
                value={selectedClient.company || devisData.clientCompany || ""}
                onChange={(value) => onFieldChange('clientCompany', value)}
                placeholder="Société (optionnel)"
              />
              <EditableInput
                value={selectedClient.email || devisData.clientEmail || ""}
                onChange={(value) => onFieldChange('clientEmail', value)}
                placeholder="Email"
              />
              <EditableInput
                value={selectedClient.phone || devisData.clientPhone || ""}
                onChange={(value) => onFieldChange('clientPhone', value)}
                placeholder="Téléphone"
              />
              <textarea
                className="client-address"
                value={selectedClient.address || devisData.clientAddress || ""}
                onChange={(e) => onFieldChange('clientAddress', e.target.value)}
                placeholder="Adresse complète"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="devis-metadata">
          <div className="metadata-grid">
            <div className="metadata-item">
              <label>Numéro de devis</label>
              <EditableInput
                className="devis-number"
                value={devisData.devisNumber || `DEVIS-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`}
                onChange={(value) => onFieldChange('devisNumber', value)}
                placeholder="Numéro de devis"
              />
            </div>
            <div className="metadata-item">
              <label>Date d'émission</label>
              <EditableInput
                type="date"
                className="devis-number"
                value={devisData.issueDate || new Date().toISOString().split('T')[0]}
                onChange={(value) => onFieldChange('issueDate', value)}
              />
            </div>
            <div className="metadata-item">
              <label>Date de validité</label>
              <EditableInput
                type="date"
                className="devis-number"
                value={devisData.validUntil || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]}
                onChange={(value) => onFieldChange('validUntil', value)}
              />
            </div>
            <div className="metadata-item">
              <label>Référence client</label>
              <EditableInput
                className="client-id"
                value={devisData.clientReference || ""}
                onChange={(value) => onFieldChange('clientReference', value)}
                placeholder="Référence client (optionnel)"
              />
            </div>
          </div>
        </div>

        <div className="prestations-section">
          <h3>PRESTATIONS</h3>
          <table className="prestations-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>TVA</th>
                <th>Total HT</th>
                <th className="actions-column"></th>
              </tr>
            </thead>
            <tbody>
              {devisData.articles.map((article, index) => {
                const total = parseFloat(article.quantity || 0) * parseFloat(article.unitPrice || 0);
                return (
                  <tr key={index}>
                    <td className="description-cell">
                      <EditableInput
                        value={article.description || ""}
                        onChange={(value) => onFieldChange(`articles[${index}].description`, value)}
                        placeholder="Description de l'article"
                      />
                    </td>
                    <td>
                      <EditableInput
                        type="number"
                        value={article.quantity || ""}
                        onChange={(value) => onFieldChange(`articles[${index}].quantity`, value)}
                        placeholder="Qté"
                        min="1"
                      />
                    </td>
                    <td>
                      <EditableInput
                        type="number"
                        value={article.unitPrice || ""}
                        onChange={(value) => onFieldChange(`articles[${index}].unitPrice`, value)}
                        placeholder="0.00"
                        step="0.01"
                      /> €
                    </td>
                    <td>
                      <select
                        className="tva-select"
                        value={article.tvaRate || "0"}
                        onChange={(e) => onFieldChange(`articles[${index}].tvaRate`, e.target.value)}
                      >
                        <option value="0">0%</option>
                        <option value="5.5">5.5%</option>
                        <option value="10">10%</option>
                        <option value="20">20%</option>
                      </select>
                      <span className="tva-text-only">{article.tvaRate || "0"}%</span>
                    </td>
                    <td className="total-cell">{formatCurrency(total)}</td>
                    <td className="actions-column">
                      <button className="remove-article-btn" onClick={() => onRemoveArticle(index)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="totaux-section">
          <div className="totaux-detail">
            <h4>Détail TVA</h4>
            <table className="tva-table">
              <thead>
                <tr>
                  <th>Taux</th>
                  <th>Base HT</th>
                  <th>Montant TVA</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tauxTVA).map(([taux, { ht, tva }]) => {
                  if (ht > 0) {
                    return (
                      <tr key={taux}>
                        <td>{taux}%</td>
                        <td>{formatCurrency(ht)}</td>
                        <td>{formatCurrency(tva)}</td>
                      </tr>
                    );
                  }
                  return null;
                })}
              </tbody>
            </table>
          </div>
          <div className="totaux-finaux">
            <div className="total-line">
              <span>Total HT :</span>
              <span>{formatCurrency(totalHT)}</span>
            </div>
            <div className="total-line">
              <span>Total TVA :</span>
              <span>{formatCurrency(totalTVA)}</span>
            </div>
            <div className="total-line final-total">
              <span>Total TTC :</span>
              <span>{formatCurrency(totalTTC)}</span>
            </div>
          </div>
        </div>

        <div className="conditions-section">
          <div className="conditions-text">
            <EditableInput
              type="textarea"
              value={devisData.conditions || "Ce devis est valable 30 jours à compter de sa date d'émission. Le paiement est dû à réception de la facture."}
              onChange={(value) => onFieldChange('conditions', value)}
              placeholder="Conditions du devis..."
              multiline={true}
            />
          </div>
          <div className="signature-area">
            <p className="signature-instruction">Pour accepter ce devis, veuillez le signer ci-dessous et nous le retourner.</p>
            <div className="signature-box">
              <div className="signature-line">Signature du client</div>
              <div className="signature-line">Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DevisPreview);