import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (client) {
      fetchClientInvoices();
      fetchClientDevis();
    }
  }, [client]);

  const fetchClientInvoices = async () => {
    try {
      setLoading(true);
      // Simulation - à remplacer par un vrai endpoint API
      // const data = await apiRequest(API_ENDPOINTS.INVOICES.BY_CLIENT(client._id));
      
      // Simulation de données
      const mockInvoices = [
        {
          id: `INV-${client._id.substring(0, 5)}-001`,
          clientId: client._id,
          clientName: client.name,
          amount: 600.00,
          status: 'paid',
          dueDate: '2024-05-15',
          createdAt: '2024-04-15',
          invoiceNumber: `FACT-2024-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
          devisIds: []
        },
        {
          id: `INV-${client._id.substring(0, 5)}-002`,
          clientId: client._id,
          clientName: client.name,
          amount: 850.00,
          status: 'pending',
          dueDate: '2024-05-30',
          createdAt: '2024-04-30',
          invoiceNumber: `FACT-2024-${String(Math.floor(Math.random() * 100) + 100).padStart(3, '0')}`,
          devisIds: []
        }
      ];
      
      setInvoices(mockInvoices);
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
      // Filtrer uniquement les devis finalisés
      const finishedDevis = data.filter(devis => devis.status === 'fini');
      setDevisForClient(finishedDevis);
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
          entrepriseName: "Votre Entreprise",
          entrepriseAddress: "123 Rue Exemple",
          entrepriseCity: "75000 Paris",
          entreprisePhone: "01 23 45 67 89",
          entrepriseEmail: "contact@entreprise.com",
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
          entrepriseName: "Votre Entreprise",
          entrepriseAddress: "123 Rue Exemple",
          entrepriseCity: "75000 Paris",
          entreprisePhone: "01 23 45 67 89",
          entrepriseEmail: "contact@entreprise.com",
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
          entrepriseName: "Votre Entreprise",
          entrepriseAddress: "123 Rue Exemple",
          entrepriseCity: "75000 Paris",
          entreprisePhone: "01 23 45 67 89",
          entrepriseEmail: "contact@entreprise.com",
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

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm("Supprimer cette facture ?")) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  };

  const handleStatusClick = (invoiceId, currentStatus) => {
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

    setInvoices(prev =>
      prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      )
    );

    alert(`Statut de la facture mis à jour : ${getStatusLabel(newStatus)}`);
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
        id: `INV-${Date.now()}`,
        clientId: client._id,
        clientName: client.name,
        amount: calculateInvoiceTotal(),
        status: 'draft',
        dueDate: newInvoice.dueDate,
        createdAt: new Date().toISOString(),
        invoiceNumber: newInvoice.invoiceNumber,
        devisIds: selectedDevis,
        notes: newInvoice.notes,
        paymentTerms: newInvoice.paymentTerms,
        discount: newInvoice.discount,
        taxRate: newInvoice.taxRate
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

  const handleSaveInvoice = (updatedInvoice) => {
    try {
      if (isCreatingNew) {
        // Ajouter la nouvelle facture
        setInvoices(prev => [updatedInvoice, ...prev]);
        alert('✅ Facture créée avec succès !');
      } else {
        // Mettre à jour une facture existante
        setInvoices(prev => 
          prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv)
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
            <h3>{invoices.length}</h3>
            <p>Factures totales</p>
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
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{invoices.filter(inv => inv.status === 'pending').length}</h3>
            <p>En attente</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
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

      {loading && invoices.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement des factures...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>Aucune facture</h3>
          <p>Ce client n'a pas encore de factures. Créez-en une maintenant !</p>
          <button 
            className="create-invoice-btn"
            onClick={() => setShowCreateInvoice(true)}
          >
            ✨ Créer une facture
          </button>
        </div>
      ) : (
        <div className="invoices-list">
          <h3>Factures de {client.name}</h3>
          <div className="invoices-grid">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="invoice-card">
                <div className="invoice-header">
                  <div className="invoice-number">{invoice.invoiceNumber}</div>
                  <div
                    className="invoice-status clickable"
                    style={{ backgroundColor: getStatusColor(invoice.status), color: 'white' }}
                    title={getNextStatusLabel(invoice.status)}
                    onClick={() => handleStatusClick(invoice.id, invoice.status)}
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
                    <span>📄 Devis inclus : {invoice.devisIds.length || "Aucun"}</span>
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
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    className="action-btn delete-btn"
                    title="Supprimer la facture"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
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
                    <p>Aucun devis finalisé disponible pour ce client.</p>
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