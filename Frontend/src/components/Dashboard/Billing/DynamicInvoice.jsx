import React, { useState, useRef } from 'react';
import './DynamicInvoice.scss';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DynamicInvoice = ({ onClose, initialData = {}, clients = [] }) => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: initialData.invoiceNumber || `FACT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    date: initialData.date || new Date().toISOString().split('T')[0],
    dueDate: initialData.dueDate || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    client: initialData.client || (clients.length > 0 ? clients[0] : {}),
    items: initialData.items || [
      { description: 'Article 1', quantity: 1, unitPrice: 5000, tva: 0 }
    ],
    notes: initialData.notes || 'Merci pour votre confiance.',
    paymentTerms: initialData.paymentTerms || '30',
    companyName: initialData.companyName || 'Nom de l\'entreprise',
    companyAddress: initialData.companyAddress || '123 Rue Exemple',
    companyCity: initialData.companyCity || '75000 Paris',
    companyPhone: initialData.companyPhone || '01 23 45 67 89',
    companyEmail: initialData.companyEmail || 'contact@entreprise.com',
    logo: initialData.logo || null
  });

  const invoiceRef = useRef(null);

  const handleInputChange = (field, value) => {
    setInvoiceData({
      ...invoiceData,
      [field]: value
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items];
    newItems[index][field] = value;
    setInvoiceData({
      ...invoiceData,
      items: newItems
    });
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: 'Article sans description', quantity: 1, unitPrice: 0, tva: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = [...invoiceData.items];
    newItems.splice(index, 1);
    setInvoiceData({
      ...invoiceData,
      items: newItems
    });
  };

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((total, item) => {
      return total + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0));
    }, 0);
  };

  const calculateTVA = () => {
    return invoiceData.items.reduce((total, item) => {
      const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0);
      return total + (itemTotal * (parseFloat(item.tva || 0) / 100));
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tva = calculateTVA();
    return subtotal + tva;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    // Ici, vous pouvez implémenter la logique pour sauvegarder la facture
    console.log('Facture sauvegardée:', invoiceData);
    alert('Facture sauvegardée avec succès!');
  };

  const handleGeneratePDF = () => {
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
      pdf.save(`facture_${invoiceData.invoiceNumber}.pdf`);
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInvoiceData({
          ...invoiceData,
          logo: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const subtotal = calculateSubtotal();
  const tva = calculateTVA();
  const total = calculateTotal();

  return (
    <div className="dynamic-invoice">
      <div className="invoice-document" ref={invoiceRef}>
        <div className="document-header">
          <div className="company-info">
            {invoiceData.logo ? (
              <img src={invoiceData.logo} alt="Logo" className="company-logo" />
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
            <div className="company-details">
              <input
                type="text"
                className="editable-input company-name"
                value={invoiceData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Nom de l'entreprise"
              />
              <input
                type="text"
                className="editable-input"
                value={invoiceData.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                placeholder="Adresse"
              />
              <input
                type="text"
                className="editable-input"
                value={invoiceData.companyCity}
                onChange={(e) => handleInputChange('companyCity', e.target.value)}
                placeholder="Code postal et ville"
              />
              <input
                type="text"
                className="editable-input"
                value={invoiceData.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                placeholder="Téléphone"
              />
              <input
                type="text"
                className="editable-input"
                value={invoiceData.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                placeholder="Email"
              />
            </div>
          </div>
          <div className="invoice-info">
            <h1>FACTURE</h1>
            <div className="invoice-number-container">
              <span className="label">N°</span>
              <input
                type="text"
                className="editable-input invoice-number-input"
                value={invoiceData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                placeholder="Numéro de facture"
              />
            </div>
            <div className="invoice-date-container">
              <span className="label">Date:</span>
              <input
                type="date"
                className="editable-input date-input"
                value={invoiceData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
            <div className="invoice-due-container">
              <span className="label">Échéance:</span>
              <input
                type="date"
                className="editable-input date-input"
                value={invoiceData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="client-section">
          <div className="section-title">FACTURER À</div>
          <div className="client-details">
            <p className="client-name">{invoiceData.client.name || 'Nom du client'}</p>
            <p>{invoiceData.client.email || 'email@client.com'}</p>
            <p>{invoiceData.client.phone || '01 23 45 67 89'}</p>
            <p>{invoiceData.client.address || 'Adresse du client'}</p>
            <p>{invoiceData.client.postalCode || '75000'} {invoiceData.client.city || 'Ville'}</p>
            {invoiceData.client.company && <p className="client-company">{invoiceData.client.company}</p>}
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
              {invoiceData.items.map((item, index) => {
                const itemTotal = (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)).toFixed(2);
                return (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="editable-input"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Description de l'article"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="editable-input"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="1"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="editable-input"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        step="0.01"
                        min="0"
                      />
                      {' €'}
                    </td>
                    <td>
                      <select
                        className="editable-input"
                        value={item.tva}
                        onChange={(e) => handleItemChange(index, 'tva', e.target.value)}
                      >
                        <option value="0">0%</option>
                        <option value="5.5">5.5%</option>
                        <option value="10">10%</option>
                        <option value="20">20%</option>
                      </select>
                    </td>
                    <td>{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan="5">
                  <button onClick={addItem} style={{ padding: '5px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    + Ajouter un article
                  </button>
                </td>
              </tr>
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
          <textarea
            className="editable-textarea"
            value={invoiceData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Notes ou conditions particulières..."
            rows="3"
          ></textarea>
        </div>

        <div className="payment-terms">
          <div className="section-title">CONDITIONS DE PAIEMENT</div>
          <div className="terms-row">
            <span className="terms-label">Délai de paiement:</span>
            <select
              className="terms-select"
              value={invoiceData.paymentTerms}
              onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
            >
              <option value="15">15 jours</option>
              <option value="30">30 jours</option>
              <option value="45">45 jours</option>
              <option value="60">60 jours</option>
            </select>
          </div>
        </div>

        <div className="invoice-footer">
          <p>{invoiceData.companyName} - {invoiceData.companyAddress} - {invoiceData.companyCity}</p>
        </div>
      </div>

      <div className="invoice-actions">
        <button className="invoice-action-btn print-btn" onClick={handleGeneratePDF}>
          📄 Télécharger PDF
        </button>
        <button className="invoice-action-btn save-btn" onClick={handleSave}>
          💾 Enregistrer
        </button>
        <button className="invoice-action-btn cancel-btn" onClick={onClose}>
          ✕ Annuler
        </button>
      </div>
    </div>
  );
};

export default DynamicInvoice;