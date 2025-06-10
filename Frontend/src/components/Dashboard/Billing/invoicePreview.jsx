import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './invoicePreview.scss';

const InvoicePreview = ({ invoice, devisDetails = [], client = {}, onClose }) => {
  const previewRef = useRef();
  const [pdfMode, setPdfMode] = useState(false);

  const articles = devisDetails.flatMap(d => d.articles || []);

  const totals = articles.reduce((acc, item) => {
    const price = parseFloat(item.unitPrice || 0);
    const qty = parseFloat(item.quantity || 0);
    const tva = parseFloat(item.tvaRate || 0);
    const ht = price * qty;
    acc.ht += ht;
    acc.tva += ht * tva / 100;
    return acc;
  }, { ht: 0, tva: 0 });
  const totalTTC = totals.ht + totals.tva;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setPdfMode(true);
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgX = (pdfWidth - canvas.width * ratio) / 2;
      pdf.addImage(imgData, 'PNG', imgX, 0, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
      setPdfMode(false);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      setPdfMode(false);
    }
  };

  return (
    <div className="invoice-preview">
      <div className="preview-toolbar">
        <button onClick={handleGeneratePDF} className="toolbar-btn pdf-btn">📄 Générer PDF</button>
        <button onClick={onClose} className="toolbar-btn close-btn">✕ Fermer</button>
      </div>
      <div className={`preview-content ${pdfMode ? 'pdf-mode' : ''}`} ref={previewRef}>
        <div className="document-header">
          <div className="document-title">
            <h1>FACTURE {invoice.invoiceNumber}</h1>
            <p>Émise le : {formatDate(invoice.createdAt)}</p>
            <p>Échéance : {formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        <div className="parties-info">
          <div className="entreprise-section">
            <h3>Émetteur</h3>
            <p>{devisDetails[0]?.entrepriseName}</p>
            <p>{devisDetails[0]?.entrepriseAddress}</p>
            <p>{devisDetails[0]?.entrepriseCity}</p>
            <p>{devisDetails[0]?.entrepriseEmail}</p>
            <p>{devisDetails[0]?.entreprisePhone}</p>
          </div>
          <div className="client-section">
            <h3>Client</h3>
            <p>{client.name || invoice.clientName}</p>
            <p>{client.address || ''}</p>
            <p>{client.postalCode ? `${client.postalCode} ${client.city}` : client.city}</p>
            <p>{client.email}</p>
            <p>{client.phone}</p>
          </div>
        </div>

        <div className="articles-section">
          <table className="articles-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qté</th>
                <th>PU HT</th>
                <th>TVA</th>
                <th>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a, idx) => {
                const price = parseFloat(a.unitPrice || 0);
                const qty = parseFloat(a.quantity || 0);
                const total = price * qty;
                return (
                  <tr key={idx}>
                    <td>{a.description}</td>
                    <td>{qty}</td>
                    <td>{price.toFixed(2)} €</td>
                    <td>{a.tvaRate || 0}%</td>
                    <td>{total.toFixed(2)} €</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="totaux-section">
          <p>Total HT : {totals.ht.toFixed(2)} €</p>
          <p>Total TVA : {totals.tva.toFixed(2)} €</p>
          <p className="total-ttc">Total TTC : {totalTTC.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
