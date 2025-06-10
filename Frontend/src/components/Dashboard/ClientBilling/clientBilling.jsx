import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import InvoicePreview from './InvoicePreview';
import DynamicInvoice from '../Billing/DynamicInvoice';
import './clientBilling.scss';

const ClientBilling = ({ client, onBack }) => {
  const [devis, setDevis] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedDevisForInvoice, setSelectedDevisForInvoice] = useState([]);
  const [dynamicPreview, setDynamicPreview] = useState(true);
  const previewContainerRef = useRef(null);

  useEffect(() => {
    if (client && client._id) {
      fetchClientData();
    }
  }, [client]);

  // Effet pour prévisualiser automatiquement quand des devis sont sélectionnés
  useEffect(() => {
    if (selectedDevisForInvoice.length > 0 && dynamicPreview) {
      // Faire défiler jusqu'à la prévisualisation si elle est visible
      if (previewContainerRef.current) {
        setTimeout(() => {
          previewContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [selectedDevisForInvoice, dynamicPreview]);

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
    setSelectedDevisForInvoice([]);
    
    alert("✅ Facture créée avec succès");
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  };

  const handleSelectDevis = (devisId) => {
    setSelectedDevisForInvoice(prev => 
      prev.includes(devisId) 
        ? prev.filter(id => id !== devisId)
        : [...prev, devisId]
    );
    
    // Faire défiler jusqu'à la prévisualisation si elle est visible
    if (dynamicPreview && previewContainerRef.current) {
      setTimeout(() => {
        previewContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
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

  // Filtrer les devis
  const filteredDevis = devis
    .filter(devisItem => {
      const matchesSearch = devisItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           devisItem.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'nouveau' && devisItem.status === 'nouveau') ||
                           (statusFilter === 'en_attente' && devisItem.status === 'en_attente') ||
                           (statusFilter === 'fini' && devisItem.status === 'fini') ||
                           (statusFilter === 'inactif' && devisItem.status === 'inactif');
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || "").localeCompare(b.title || "");
        case 'client':
          return client.name.localeCompare(client.name);
        case 'amount':
          return calculateTTC(b) - calculateTTC(a);
        case 'date':
        default:
          return new Date(b.dateDevis || 0) - new Date(a.dateDevis || 0);
      }
    });

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

      {/* Filtres et recherche */}
      <div className="filters-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par titre, client ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Statut :</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous</option>
              <option value="nouveau">🔵 Nouveaux</option>
              <option value="en_attente">🟣 En attente</option>
              <option value="fini">🟢 Finalisés</option>
              <option value="inactif">🔴 Inactifs</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Trier par :</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="date">Plus récent</option>
              <option value="title">Titre A-Z</option>
              <option value="client">Client A-Z</option>
              <option value="amount">Montant décroissant</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="auto-preview-toggle">
              <input 
                type="checkbox" 
                checked={dynamicPreview} 
                onChange={() => setDynamicPreview(!dynamicPreview)}
              />
              <span className="toggle-label">Affichage dynamique</span>
            </label>
          </div>
        </div>

        <div className="pagination-info">
          <span>Affichage de 1 à {filteredDevis.length} sur {filteredDevis.length} devis</span>
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
            {filteredDevis.map((devisItem) => {
              const ttc = calculateTTC(devisItem);
              
              return (
                <div 
                  key={devisItem._id} 
                  className={`devis-card ${selectedDevisForInvoice.includes(devisItem._id) ? 'selected' : ''}`}
                  onClick={() => handleSelectDevis(devisItem._id)}
                >
                  <div className="card-top-section">
                    <div className="devis-avatar">
                      {devisItem.title ? devisItem.title.charAt(0).toUpperCase() : "D"}
                    </div>
                    
                    <div 
                      className="status-indicator clickable"
                      style={{ 
                        backgroundColor: getDevisStatusColor(devisItem.status),
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem'
                      }}
                      title={`Statut: ${getDevisStatusLabel(devisItem.status)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {getDevisStatusIcon(devisItem.status)}
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="devis-card-title">{devisItem.title || "Devis sans titre"}</h3>
                    
                    <div className="devis-card-meta">
                      <div className="devis-card-date">
                        <span>📅</span>
                        <span>{formatDate(devisItem.dateDevis)}</span>
                      </div>
                      <div className="devis-card-amount">
                        <span>💰</span>
                        <span>{ttc.toFixed(2)} € TTC</span>
                      </div>
                    </div>

                    <div className="devis-client-info">
                      <span className="devis-client-icon">👤</span>
                      <span className="devis-client-name">{client.name}</span>
                    </div>

                    <div className="devis-status-badge" style={{ backgroundColor: getDevisStatusColor(devisItem.status), color: 'white' }}>
                      {getDevisStatusIcon(devisItem.status)} {getDevisStatusLabel(devisItem.status)}
                    </div>

                    <div className="devis-card-actions">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDevis(devisItem);
                        }}
                        className="card-btn card-btn-edit"
                      >
                        ✏️
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Télécharger directement le PDF
                        }}
                        className="card-btn card-btn-pdf"
                        disabled={loading}
                      >
                        {loading ? "⏳" : "📄"}
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Supprimer le devis
                        }}
                        className="card-btn card-btn-delete"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prévisualisation dynamique de la facture */}
      {dynamicPreview && selectedDevisForInvoice.length > 0 && (
        <div className="dynamic-preview-container" ref={previewContainerRef}>
          <div className="dynamic-preview-header">
            <h2>📋 Prévisualisation de la facture</h2>
            <p>Modifiez directement les informations ci-dessous</p>
          </div>
          
          <div className="dynamic-preview-content">
            <DynamicInvoice
              invoice={{
                invoiceNumber: `FACT-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date().toISOString().split('T')[0],
                devisIds: selectedDevisForInvoice
              }}
              client={client}
              devisDetails={devis.filter(d => selectedDevisForInvoice.includes(d._id))}
              onSave={handleSaveInvoice}
            />
          </div>
        </div>
      )}

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