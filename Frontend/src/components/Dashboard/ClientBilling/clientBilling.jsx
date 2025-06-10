import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import InvoicePreview from './InvoicePreview';
import './clientBilling.scss';

const ClientBilling = ({ client, onBack }) => {
  const [devis, setDevis] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (client && client._id) {
      fetchClientData();
    }
  }, [client]);

  const fetchClientData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les devis du client
      const devisData = await apiRequest(API_ENDPOINTS.DEVIS.BY_CLIENT(client._id));
      setDevis(Array.isArray(devisData) ? devisData : []);

      // Simuler la récupération des factures (à remplacer par un vrai appel API)
      // const invoicesData = await apiRequest(API_ENDPOINTS.INVOICES.BY_CLIENT(client._id));
      const mockInvoices = [
        {
          id: 'INV-001',
          invoiceNumber: 'FACT-2024-001',
          clientId: client._id,
          amount: 2500.0,
          status: 'paid',
          dueDate: '2024-02-15',
          createdAt: '2024-01-15',
          devisIds: devisData.length > 0 ? [devisData[0]._id] : []
        },
        {
          id: 'INV-002',
          invoiceNumber: 'FACT-2024-002',
          clientId: client._id,
          amount: 1800.0,
          status: 'pending',
          dueDate: '2024-03-20',
          createdAt: '2024-02-20',
          devisIds: devisData.length > 1 ? [devisData[1]._id] : []
        }
      ];
      setInvoices(mockInvoices);
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError("Erreur lors du chargement des données du client");
    } finally {
      setLoading(false);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch (error) {
      return "";
    }
  };

  const handleViewDevis = (devis) => {
    setSelectedDevis(devis);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoicePreview(true);
  };

  const handleCreateInvoice = (devis) => {
    // Créer une nouvelle facture à partir du devis
    const newInvoice = {
      invoiceNumber: `FACT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      clientId: client._id,
      amount: calculateTTC(devis),
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      devisIds: [devis._id]
    };
    
    setSelectedInvoice(newInvoice);
    setShowInvoicePreview(true);
  };

  const handleSaveInvoice = (invoice) => {
    // Ajouter la nouvelle facture à la liste
    const newInvoice = {
      ...invoice,
      id: `INV-${Date.now()}`
    };
    
    setInvoices(prev => [newInvoice, ...prev]);
    setShowInvoicePreview(false);
    setSelectedInvoice(null);
    
    alert("✅ Facture créée avec succès");
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
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

  const getDevisStatusColor = (status) => {
    switch (status) {
      case 'nouveau': return '#3b82f6';
      case 'en_attente': return '#8b5cf6';
      case 'fini': return '#10b981';
      case 'inactif': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getDevisStatusLabel = (status) => {
    switch (status) {
      case 'nouveau': return 'Nouveau';
      case 'en_attente': return 'En attente';
      case 'fini': return 'Finalisé';
      case 'inactif': return 'Inactif';
      default: return 'Inconnu';
    }
  };

  const getDevisStatusIcon = (status) => {
    switch (status) {
      case 'nouveau': return '🔵';
      case 'en_attente': return '🟣';
      case 'fini': return '🟢';
      case 'inactif': return '🔴';
      default: return '❓';
    }
  };

  // Calculer les statistiques du client
  const totalDevis = devis.length;
  const totalInvoices = invoices.length;
  const totalAmount = devis.reduce((sum, d) => sum + calculateTTC(d), 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return (
      <div className="client-billing-container">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Chargement des données de facturation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-billing-container">
        <div className="error-message">{error}</div>
        <button onClick={onBack} className="btn-secondary">← Retour</button>
      </div>
    );
  }

  return (
    <div className="client-billing-container">
      {/* En-tête avec informations client */}
      <div className="client-billing-header">
        <button onClick={onBack} className="back-button">
          ← Retour aux prospects
        </button>
        
        <div className="client-info">
          <div className="client-avatar">
            {client.name ? client.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="client-details">
            <h2>{client.name}</h2>
            <div className="client-contact">
              <span>📧 {client.email}</span>
              <span>📞 {client.phone}</span>
              {client.company && <span>🏢 {client.company}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques du client */}
      <div className="billing-stats">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{totalDevis}</h3>
            <p>Devis</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{totalInvoices}</h3>
            <p>Factures</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{totalAmount.toFixed(2)} €</h3>
            <p>Montant total</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{paidAmount.toFixed(2)} €</h3>
            <p>Payé</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{pendingAmount.toFixed(2)} €</h3>
            <p>En attente</p>
          </div>
        </div>
      </div>

      {/* Section des devis */}
      <div className="devis-section">
        <h3>📄 Devis du client</h3>
        
        {devis.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon">📄</div>
            <h3>Aucun devis</h3>
            <p>Ce client n'a pas encore de devis</p>
          </div>
        ) : (
          <div className="devis-grid">
            {devis.map((devisItem) => {
              const ttc = calculateTTC(devisItem);
              
              return (
                <div key={devisItem._id} className="devis-card">
                  <div className="devis-card-header">
                    <h3 className="devis-card-title">{devisItem.title || "Sans titre"}</h3>
                    <div className="devis-card-meta">
                      <span>📅 {formatDate(devisItem.dateDevis)}</span>
                      <span className="devis-card-amount">
                        💰 {ttc.toFixed(2)} € TTC
                      </span>
                    </div>
                  </div>
                  
                  <div className="status-text">
                    <span 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getDevisStatusColor(devisItem.status),
                        color: 'white'
                      }}
                    >
                      {getDevisStatusIcon(devisItem.status)} {getDevisStatusLabel(devisItem.status)}
                    </span>
                  </div>
                  
                  <div className="devis-card-actions">
                    <button 
                      className="card-btn card-btn-edit"
                      onClick={() => handleViewDevis(devisItem)}
                    >
                      👁️ Voir
                    </button>
                    
                    <button 
                      className="card-btn card-btn-invoice"
                      onClick={() => handleCreateInvoice(devisItem)}
                    >
                      📋 Facturer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section des factures */}
      <div className="invoices-section">
        <h3>📋 Factures du client</h3>
        
        {invoices.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon">📋</div>
            <h3>Aucune facture</h3>
            <p>Ce client n'a pas encore de factures</p>
          </div>
        ) : (
          <div className="invoices-grid">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="invoice-card">
                <div className="invoice-header">
                  <div className="invoice-number">{invoice.invoiceNumber}</div>
                  <div
                    className="invoice-status"
                    style={{ backgroundColor: getStatusColor(invoice.status), color: 'white' }}
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
                    <span>📄 Devis inclus : {invoice.devisIds.length}</span>
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
                    className="action-btn download-btn"
                    title="Télécharger PDF"
                  >
                    📥
                  </button>
                  <button
                    className="action-btn send-btn"
                    title="Envoyer par email"
                  >
                    📧
                  </button>
                  <button
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    className="action-btn delete-btn"
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

      {/* Modal de prévisualisation de facture */}
      {showInvoicePreview && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content invoice-preview-modal">
            <InvoicePreview
              invoice={selectedInvoice}
              client={client}
              devisDetails={selectedInvoice.devisIds.map(id => devis.find(d => d._id === id)).filter(Boolean)}
              onSave={handleSaveInvoice}
              onCancel={() => {
                setShowInvoicePreview(false);
                setSelectedInvoice(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de prévisualisation de devis */}
      {selectedDevis && (
        <div className="modal-overlay">
          <div className="modal-content devis-preview-modal">
            <div className="devis-preview">
              <div className="devis-preview-header">
                <h2>{selectedDevis.title || "Devis sans titre"}</h2>
                <p>
                  Montant total : <span className="total-amount">{calculateTTC(selectedDevis).toFixed(2)} € TTC</span>
                </p>
              </div>
              
              <div className="devis-preview-content">
                <div className="devis-preview-section">
                  <h3>Informations générales</h3>
                  <div className="devis-preview-info">
                    <div className="info-row">
                      <span className="info-label">Date du devis :</span>
                      <span className="info-value">{formatDate(selectedDevis.dateDevis)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Date de validité :</span>
                      <span className="info-value">{formatDate(selectedDevis.dateValidite)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Statut :</span>
                      <span className="info-value">
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: getDevisStatusColor(selectedDevis.status),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                          }}
                        >
                          {getDevisStatusIcon(selectedDevis.status)} {getDevisStatusLabel(selectedDevis.status)}
                        </span>
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
                      {selectedDevis.articles && selectedDevis.articles.map((article, index) => {
                        const price = parseFloat(article.unitPrice || 0);
                        const qty = parseFloat(article.quantity || 0);
                        const total = isNaN(price) || isNaN(qty) ? 0 : price * qty;
                        
                        return (
                          <tr key={index}>
                            <td>{article.description || "Sans description"}</td>
                            <td>{qty}</td>
                            <td>{price.toFixed(2)} €</td>
                            <td>{article.tvaRate || 20}%</td>
                            <td>{total.toFixed(2)} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="devis-preview-actions">
                  <button 
                    className="devis-action-btn pdf-btn"
                    onClick={() => {
                      setSelectedDevis(null);
                      // Télécharger le PDF
                    }}
                  >
                    📄 Télécharger PDF
                  </button>
                  
                  <button 
                    className="devis-action-btn invoice-btn"
                    onClick={() => {
                      handleCreateInvoice(selectedDevis);
                      setSelectedDevis(null);
                    }}
                  >
                    📋 Créer une facture
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBilling;