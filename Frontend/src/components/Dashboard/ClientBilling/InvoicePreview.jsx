import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './InvoicePreview.scss';

const InvoicePreview = ({ invoice, onClose }) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const input = invoiceRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
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
      pdf.save(`facture_${invoice.invoiceNumber}.pdf`);
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Calcul des totaux
  const calculateSubtotal = () => {
    return invoice.items.reduce((total, item) => {
      return total + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0));
    }, 0);
  };

  const calculateTVA = () => {
    return invoice.items.reduce((total, item) => {
      const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0);
      return total + (itemTotal * (parseFloat(item.tva || 0) / 100));
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tva = calculateTVA();
    return subtotal + tva;
  };

  const subtotal = calculateSubtotal();
  const tva = calculateTVA();
  const total = calculateTotal();

  return (
    <div className="invoice-preview-container">
      <div className="preview-toolbar">
        <button className="toolbar-btn print-btn" onClick={handlePrint}>
          <i className="fas fa-print"></i> Imprimer
        </button>
        <button className="toolbar-btn pdf-btn" onClick={handleDownloadPDF}>
          <i className="fas fa-file-pdf"></i> Télécharger PDF
        </button>
        <button className="toolbar-btn cancel-btn" onClick={onClose}>
          <i className="fas fa-times"></i> Fermer
        </button>
      </div>

      <div className="invoice-document" ref={invoiceRef}>
        <div className="document-header">
          <div className="company-info">
            {invoice.logo ? (
              <img src={invoice.logo} alt="Logo" className="company-logo" />
            ) : (
              <div className="company-name">
                {invoice.companyName || "Nom de l'entreprise"}
              </div>
            )}
            <div className="company-details">
              <p>{invoice.companyAddress || "123 Rue Exemple"}</p>
              <p>{invoice.companyCity || "75000 Paris"}</p>
              <p>{invoice.companyPhone || "01 23 45 67 89"}</p>
              <p>{invoice.companyEmail || "contact@entreprise.com"}</p>
            </div>
          </div>
          <div className="invoice-info">
            <h1>FACTURE</h1>
            <div className="invoice-number-container">
              <span className="label">N°</span>
              <span className="invoice-number">{invoice.invoiceNumber}</span>
            </div>
            <div className="invoice-date-container">
              <span className="label">Date:</span>
              <span className="invoice-date">{new Date(invoice.date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="invoice-due-container">
              <span className="label">Échéance:</span>
              <span className="invoice-due">{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="invoice-status-selector">
              <span className="label">Statut:</span>
              <span className={`invoice-status status-${invoice.status}`}>
                {invoice.status === 'paid' ? 'Payée' : 
                 invoice.status === 'pending' ? 'En attente' : 
                 invoice.status === 'overdue' ? 'En retard' : 'Brouillon'}
              </span>
            </div>
          </div>
        </div>

        <div className="client-section">
          <div className="section-title">FACTURER À</div>
          <div className="client-details">
            <p className="client-name">{invoice.client.name || 'Nom du client'}</p>
            <p>{invoice.client.email || 'email@client.com'}</p>
            <p>{invoice.client.phone || '01 23 45 67 89'}</p>
            <p>{invoice.client.address || 'Adresse du client'}</p>
            <p>{invoice.client.postalCode || '75000'} {invoice.client.city || 'Ville'}</p>
            {invoice.client.company && <p className="client-company">{invoice.client.company}</p>}
          </div>
        </div>

        <div className="invoice-items">
          <table>
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
              {invoice.items.map((item, index) => {
                const itemTotal = (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)).toFixed(2);
                return (
                  <tr key={index}>
                    <td>{item.description || 'Article sans description'}</td>
                    <td>{item.quantity || 0}</td>
                    <td>{formatCurrency(item.unitPrice || 0)}</td>
                    <td>{item.tva || 0}%</td>
                    <td>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>Sous-total:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>TVA:</span>
            <span>{formatCurrency(tva)}</span>
          </div>
          <div className="summary-row total">
            <span>Total TTC:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="invoice-notes">
          <div className="section-title">NOTES</div>
          <p>{invoice.notes || 'Aucune note'}</p>
        </div>

        <div className="payment-terms">
          <div className="section-title">CONDITIONS DE PAIEMENT</div>
          <div className="terms-row">
            <span className="terms-label">Délai de paiement:</span>
            <span className="terms-value">{invoice.paymentTerms || '30'} jours</span>
          </div>
        </div>

        <div className="invoice-footer">
          <p>{invoice.companyName || "Nom de l'entreprise"} - {invoice.companyAddress || "123 Rue Exemple"} - {invoice.companyCity || "75000 Paris"}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;