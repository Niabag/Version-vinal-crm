import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import './invoiceTemplate.scss';

const InvoiceTemplate = ({ invoice, client, devisDetails = [], onClose }) => {
  const componentRef = useRef();

  // Calculer les totaux
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;
    
    // Regrouper les articles par taux de TVA
    const tvaGroups = {};
    
    devisDetails.forEach(devis => {
      if (!devis.articles) return;
      
      devis.articles.forEach(article => {
        const price = parseFloat(article.unitPrice || 0);
        const qty = parseFloat(article.quantity || 0);
        const tvaRate = parseFloat(article.tvaRate || 20);
        
        if (isNaN(price) || isNaN(qty)) return;
        
        const ht = price * qty;
        const tva = ht * (tvaRate / 100);
        
        totalHT += ht;
        totalTVA += tva;
        
        // Ajouter au groupe TVA
        if (!tvaGroups[tvaRate]) {
          tvaGroups[tvaRate] = { ht: 0, tva: 0 };
        }
        tvaGroups[tvaRate].ht += ht;
        tvaGroups[tvaRate].tva += tva;
      });
    });
    
    return {
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
      tvaGroups
    };
  };

  const totals = calculateTotals();
  
  // Formatage des dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Fonction pour imprimer la facture
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Facture_${invoice.invoiceNumber}`,
  });

  return (
    <div className="invoice-template-container">
      <div className="invoice-actions">
        <button className="invoice-action-btn print-btn" onClick={handlePrint}>
          <span className="btn-icon">🖨️</span>
          <span className="btn-text">Imprimer / PDF</span>
        </button>
        <button className="invoice-action-btn close-btn" onClick={onClose}>
          <span className="btn-icon">✕</span>
          <span className="btn-text">Fermer</span>
        </button>
      </div>
      
      <div className="invoice-template" ref={componentRef}>
        <div className="invoice-header">
          <div className="company-info">
            <div className="company-logo">
              {devisDetails[0]?.logoUrl ? (
                <img src={devisDetails[0].logoUrl} alt="Logo" />
              ) : (
                <div className="logo-placeholder">LOGO</div>
              )}
            </div>
            <div className="company-details">
              <h2>{devisDetails[0]?.entrepriseName || 'Votre Entreprise'}</h2>
              <p>{devisDetails[0]?.entrepriseAddress || 'Adresse de l\'entreprise'}</p>
              <p>{devisDetails[0]?.entrepriseCity || 'Code postal et ville'}</p>
              <p>Tél: {devisDetails[0]?.entreprisePhone || 'Téléphone'}</p>
              <p>Email: {devisDetails[0]?.entrepriseEmail || 'Email'}</p>
            </div>
          </div>
          
          <div className="invoice-title-section">
            <h1>FACTURE</h1>
            <div className="invoice-number">N° {invoice.invoiceNumber}</div>
            <div className="invoice-date">
              <div>Date d'émission: {formatDate(invoice.createdAt)}</div>
              <div>Date d'échéance: {formatDate(invoice.dueDate)}</div>
            </div>
          </div>
        </div>
        
        <div className="invoice-parties">
          <div className="invoice-from">
            <h3>ÉMETTEUR</h3>
            <div className="party-details">
              <p><strong>{devisDetails[0]?.entrepriseName || 'Votre Entreprise'}</strong></p>
              <p>{devisDetails[0]?.entrepriseAddress || 'Adresse'}</p>
              <p>{devisDetails[0]?.entrepriseCity || 'Code postal et ville'}</p>
              <p>SIRET: 123 456 789 00012</p>
              <p>TVA Intracom: FR 12 345678901</p>
            </div>
          </div>
          
          <div className="invoice-to">
            <h3>DESTINATAIRE</h3>
            <div className="party-details">
              <p><strong>{client?.name || invoice.clientName || 'Nom du client'}</strong></p>
              <p>{client?.email || 'Email du client'}</p>
              <p>{client?.phone || 'Téléphone du client'}</p>
              <p>{client?.address || 'Adresse du client'}</p>
              <p>{client?.postalCode} {client?.city}</p>
            </div>
          </div>
        </div>
        
        <div className="invoice-reference">
          <div className="reference-item">
            <span className="reference-label">Facture N°:</span>
            <span className="reference-value">{invoice.invoiceNumber}</span>
          </div>
          <div className="reference-item">
            <span className="reference-label">Date:</span>
            <span className="reference-value">{formatDate(invoice.createdAt)}</span>
          </div>
          <div className="reference-item">
            <span className="reference-label">Échéance:</span>
            <span className="reference-value">{formatDate(invoice.dueDate)}</span>
          </div>
          <div className="reference-item">
            <span className="reference-label">Conditions:</span>
            <span className="reference-value">{invoice.paymentTerms} jours</span>
          </div>
        </div>
        
        <div className="invoice-items">
          <table className="items-table">
            <thead>
              <tr>
                <th className="item-description">Description</th>
                <th className="item-quantity">Qté</th>
                <th className="item-unit">Unité</th>
                <th className="item-price">Prix unitaire HT</th>
                <th className="item-tva">TVA</th>
                <th className="item-total">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {devisDetails.flatMap((devis, devisIndex) => 
                devis.articles?.map((article, index) => {
                  const price = parseFloat(article.unitPrice || 0);
                  const qty = parseFloat(article.quantity || 0);
                  const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                  
                  return (
                    <tr key={`${devisIndex}-${index}`} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td className="item-description">
                        <div className="description-content">
                          <div className="description-title">{article.description || 'Article'}</div>
                          {devis.title && <div className="description-devis">Devis: {devis.title}</div>}
                        </div>
                      </td>
                      <td className="item-quantity">{qty}</td>
                      <td className="item-unit">{article.unit || 'u'}</td>
                      <td className="item-price">{price.toFixed(2)} €</td>
                      <td className="item-tva">{article.tvaRate || 20}%</td>
                      <td className="item-total">{total.toFixed(2)} €</td>
                    </tr>
                  );
                }) || []
              )}
            </tbody>
          </table>
        </div>
        
        <div className="invoice-summary">
          <div className="tva-summary">
            <h3>Récapitulatif TVA</h3>
            <table className="tva-table">
              <thead>
                <tr>
                  <th>Base HT</th>
                  <th>Taux TVA</th>
                  <th>Montant TVA</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totals.tvaGroups).map(([rate, { ht, tva }]) => (
                  <tr key={rate}>
                    <td>{ht.toFixed(2)} €</td>
                    <td>{rate}%</td>
                    <td>{tva.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="totals-summary">
            <div className="total-line">
              <span className="total-label">Total HT:</span>
              <span className="total-value">{totals.totalHT.toFixed(2)} €</span>
            </div>
            <div className="total-line">
              <span className="total-label">Total TVA:</span>
              <span className="total-value">{totals.totalTVA.toFixed(2)} €</span>
            </div>
            {invoice.discount > 0 && (
              <div className="total-line discount">
                <span className="total-label">Remise ({invoice.discount}%):</span>
                <span className="total-value">-{((totals.totalHT + totals.totalTVA) * (invoice.discount / 100)).toFixed(2)} €</span>
              </div>
            )}
            <div className="total-line grand-total">
              <span className="total-label">Total TTC:</span>
              <span className="total-value">
                {invoice.discount > 0 
                  ? ((totals.totalHT + totals.totalTVA) * (1 - invoice.discount / 100)).toFixed(2) 
                  : totals.totalTTC.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
        
        {invoice.notes && (
          <div className="invoice-notes">
            <h3>Notes</h3>
            <p>{invoice.notes}</p>
          </div>
        )}
        
        <div className="invoice-payment">
          <h3>Informations de paiement</h3>
          <div className="payment-details">
            <div className="payment-method">
              <p><strong>Virement bancaire:</strong></p>
              <p>IBAN: FR76 1234 5678 9012 3456 7890 123</p>
              <p>BIC: ABCDEFGHIJK</p>
            </div>
            <div className="payment-instructions">
              <p>Merci d'indiquer le numéro de facture {invoice.invoiceNumber} en référence de votre paiement.</p>
              <p>Cette facture est payable sous {invoice.paymentTerms} jours à compter de sa date d'émission.</p>
            </div>
          </div>
        </div>
        
        <div className="invoice-footer">
          <div className="legal-mentions">
            <p>TVA non applicable, art. 293 B du CGI</p>
            <p>En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement.</p>
          </div>
          <div className="company-signature">
            <p>{devisDetails[0]?.entrepriseName || 'Votre Entreprise'} - SIRET: 123 456 789 00012</p>
            <p>{devisDetails[0]?.entrepriseAddress || 'Adresse'} - {devisDetails[0]?.entrepriseCity || 'Ville'}</p>
          </div>
        </div>
        
        <div className="invoice-status-watermark" data-status={invoice.status}>
          {invoice.status === 'paid' && 'PAYÉE'}
          {invoice.status === 'overdue' && 'EN RETARD'}
          {invoice.status === 'canceled' && 'ANNULÉE'}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;