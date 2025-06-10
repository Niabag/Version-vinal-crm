import React, { useState, useEffect, useRef } from 'react';
import './billing.scss';
import DynamicInvoice from './DynamicInvoice';
import InvoicePreview from './invoicePreview';

const Billing = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [devis, setDevis] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState([]);
  const [autoPreview, setAutoPreview] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const previewRef = useRef(null);

  // Simuler le chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Données de test pour les clients
        const mockClients = [
          { id: 1, name: 'Jean Dupont', company: 'Tech Solutions', email: 'jean.dupont@example.com', phone: '06 12 34 56 78', address: '123 Rue de Paris, 75001 Paris' },
          { id: 2, name: 'Marie Martin', company: 'Design Studio', email: 'marie.martin@example.com', phone: '07 23 45 67 89', address: '456 Avenue des Champs, 75008 Paris' },
          { id: 3, name: 'Pierre Durand', company: 'Consulting Pro', email: 'pierre.durand@example.com', phone: '06 34 56 78 90', address: '789 Boulevard Haussmann, 75009 Paris' },
          { id: 4, name: 'Sophie Lefebvre', company: 'Marketing Plus', email: 'sophie.lefebvre@example.com', phone: '07 45 67 89 01', address: '101 Rue de Rivoli, 75001 Paris' },
          { id: 5, name: 'Thomas Bernard', company: 'Web Factory', email: 'thomas.bernard@example.com', phone: '06 56 78 90 12', address: '202 Avenue Montaigne, 75008 Paris' }
        ];
        
        // Données de test pour les devis
        const mockDevis = [
          { 
            id: 1, 
            devisNumber: 'DEV-2025-001', 
            clientId: 1, 
            clientName: 'Jean Dupont',
            clientCompany: 'Tech Solutions',
            date: '2025-01-15', 
            amount: 1500.00,
            status: 'pending',
            articles: [
              { description: 'Développement site web', quantity: 1, unitPrice: 1500, tvaRate: '20' }
            ]
          },
          { 
            id: 2, 
            devisNumber: 'DEV-2025-002', 
            clientId: 2, 
            clientName: 'Marie Martin',
            clientCompany: 'Design Studio',
            date: '2025-01-20', 
            amount: 2800.00,
            status: 'accepted',
            articles: [
              { description: 'Refonte graphique', quantity: 1, unitPrice: 1800, tvaRate: '20' },
              { description: 'Intégration', quantity: 1, unitPrice: 1000, tvaRate: '20' }
            ]
          },
          { 
            id: 3, 
            devisNumber: 'DEV-2025-003', 
            clientId: 3, 
            clientName: 'Pierre Durand',
            clientCompany: 'Consulting Pro',
            date: '2025-02-05', 
            amount: 5000.00,
            status: 'pending',
            articles: [
              { description: 'Application mobile', quantity: 1, unitPrice: 5000, tvaRate: '20' }
            ]
          },
          { 
            id: 4, 
            devisNumber: 'DEV-2025-004', 
            clientId: 4, 
            clientName: 'Sophie Lefebvre',
            clientCompany: 'Marketing Plus',
            date: '2025-02-10', 
            amount: 950.00,
            status: 'rejected',
            articles: [
              { description: 'Campagne réseaux sociaux', quantity: 1, unitPrice: 950, tvaRate: '20' }
            ]
          },
          { 
            id: 5, 
            devisNumber: 'DEV-2025-005', 
            clientId: 5, 
            clientName: 'Thomas Bernard',
            clientCompany: 'Web Factory',
            date: '2025-02-15', 
            amount: 3200.00,
            status: 'accepted',
            articles: [
              { description: 'Refonte SEO', quantity: 1, unitPrice: 1200, tvaRate: '20' },
              { description: 'Optimisation performances', quantity: 1, unitPrice: 2000, tvaRate: '20' }
            ]
          }
        ];
        
        // Données de test pour les factures
        const mockInvoices = [
          { 
            id: 1, 
            invoiceNumber: 'FACT-2025-001', 
            clientId: 1, 
            clientName: 'Jean Dupont',
            clientCompany: 'Tech Solutions',
            date: '2025-01-20', 
            dueDate: '2025-02-20',
            amount: 1500.00,
            status: 'paid',
            devisId: 1,
            items: [
              { description: 'Développement site web', quantity: 1, unitPrice: 1500, tva: 20 }
            ],
            client: mockClients[0],
            companyName: 'Votre Entreprise',
            companyAddress: '123 Rue Exemple',
            companyCity: '75000 Paris',
            companyPhone: '01 23 45 67 89',
            companyEmail: 'contact@entreprise.com',
            notes: 'Merci pour votre confiance.',
            paymentTerms: '30'
          },
          { 
            id: 2, 
            invoiceNumber: 'FACT-2025-002', 
            clientId: 2, 
            clientName: 'Marie Martin',
            clientCompany: 'Design Studio',
            date: '2025-02-25', 
            dueDate: '2025-03-25',
            amount: 2800.00,
            status: 'pending',
            devisId: 2,
            items: [
              { description: 'Refonte graphique', quantity: 1, unitPrice: 1800, tva: 20 },
              { description: 'Intégration', quantity: 1, unitPrice: 1000, tva: 20 }
            ],
            client: mockClients[1],
            companyName: 'Votre Entreprise',
            companyAddress: '123 Rue Exemple',
            companyCity: '75000 Paris',
            companyPhone: '01 23 45 67 89',
            companyEmail: 'contact@entreprise.com',
            notes: 'Merci pour votre confiance.',
            paymentTerms: '30'
          },
          { 
            id: 3, 
            invoiceNumber: 'FACT-2025-003', 
            clientId: 5, 
            clientName: 'Thomas Bernard',
            clientCompany: 'Web Factory',
            date: '2025-03-01', 
            dueDate: '2025-04-01',
            amount: 3200.00,
            status: 'overdue',
            devisId: 5,
            items: [
              { description: 'Refonte SEO', quantity: 1, unitPrice: 1200, tva: 20 },
              { description: 'Optimisation performances', quantity: 1, unitPrice: 2000, tva: 20 }
            ],
            client: mockClients[4],
            companyName: 'Votre Entreprise',
            companyAddress: '123 Rue Exemple',
            companyCity: '75000 Paris',
            companyPhone: '01 23 45 67 89',
            companyEmail: 'contact@entreprise.com',
            notes: 'Merci pour votre confiance.',
            paymentTerms: '30'
          }
        ];
        
        setClients(mockClients);
        setDevis(mockDevis);
        setInvoices(mockInvoices);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'accepted':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-500';
      case 'rejected':
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-500';
      case 'pending':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-500';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'accepted': return 'Accepté';
      case 'rejected': return 'Refusé';
      case 'paid': return 'Payée';
      case 'overdue': return 'En retard';
      case 'pending':
      default: return 'En attente';
    }
  };

  const handleDevisSelection = (devisId) => {
    if (selectedDevis.includes(devisId)) {
      setSelectedDevis(selectedDevis.filter(id => id !== devisId));
    } else {
      setSelectedDevis([...selectedDevis, devisId]);
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoicePreview(true);
  };

  const handleCloseInvoicePreview = () => {
    setShowInvoicePreview(false);
    setSelectedInvoice(null);
  };

  const handleCreateInvoice = () => {
    setShowCreateInvoice(true);
  };

  const handleCloseCreateInvoice = () => {
    setShowCreateInvoice(false);
  };

  const calculateStats = () => {
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
    const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
    const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
    
    return {
      totalRevenue,
      pendingAmount,
      overdueAmount,
      totalAmount
    };
  };

  const filteredInvoices = invoices.filter(invoice => {
    // Filtre par statut
    if (filterStatus !== 'all' && invoice.status !== filterStatus) return false;
    
    // Filtre par date
    if (filterDate !== 'all') {
      const invoiceDate = new Date(invoice.date);
      const now = new Date();
      
      if (filterDate === 'thisMonth') {
        if (invoiceDate.getMonth() !== now.getMonth() || invoiceDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === 'lastMonth') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        if (invoiceDate.getMonth() !== lastMonth.getMonth() || invoiceDate.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (filterDate === 'thisYear') {
        if (invoiceDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    
    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.clientName.toLowerCase().includes(searchLower) ||
        (invoice.clientCompany && invoice.clientCompany.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const filteredDevis = devis.filter(devis => {
    // Filtre par statut
    if (filterStatus !== 'all' && devis.status !== filterStatus) return false;
    
    // Filtre par date
    if (filterDate !== 'all') {
      const devisDate = new Date(devis.date);
      const now = new Date();
      
      if (filterDate === 'thisMonth') {
        if (devisDate.getMonth() !== now.getMonth() || devisDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === 'lastMonth') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        if (devisDate.getMonth() !== lastMonth.getMonth() || devisDate.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (filterDate === 'thisYear') {
        if (devisDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    
    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        devis.devisNumber.toLowerCase().includes(searchLower) ||
        devis.clientName.toLowerCase().includes(searchLower) ||
        (devis.clientCompany && devis.clientCompany.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">⟳</div>
        <p>Chargement des données de facturation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message-container">
        <div className="error-icon">⚠️</div>
        <div className="error-text">{error}</div>
        <button className="error-dismiss" onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="billing-container">
      <div className="billing-header">
        <div className="header-content">
          <h1 className="page-title">Gestion de la facturation</h1>
          <div className="billing-stats">
            <div className="stat-card revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{formatCurrency(stats.totalRevenue)}</h3>
                <p>Revenus encaissés</p>
                <span className="stat-trend">+12% ce mois</span>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{formatCurrency(stats.pendingAmount)}</h3>
                <p>En attente</p>
                <span className="stat-trend">3 factures</span>
              </div>
            </div>
            <div className="stat-card overdue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>{formatCurrency(stats.overdueAmount)}</h3>
                <p>En retard</p>
                <span className="stat-trend">1 facture</span>
              </div>
            </div>
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{formatCurrency(stats.totalAmount)}</h3>
                <p>Total facturé</p>
                <span className="stat-trend">{invoices.length} factures</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Rechercher par numéro, client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search\" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>
        </div>
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="status-filter">Statut:</label>
            <select 
              id="status-filter" 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="pending">En attente</option>
              <option value="paid">Payée</option>
              <option value="overdue">En retard</option>
              <option value="accepted">Accepté</option>
              <option value="rejected">Refusé</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="date-filter">Période:</label>
            <select 
              id="date-filter" 
              className="filter-select"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="all">Toutes les périodes</option>
              <option value="thisMonth">Ce mois</option>
              <option value="lastMonth">Mois dernier</option>
              <option value="thisYear">Cette année</option>
            </select>
          </div>
          <div className="bulk-actions">
            <button className="preview-invoice-btn" onClick={handleCreateInvoice}>
              <i className="fas fa-plus-circle"></i> Créer une facture
            </button>
          </div>
        </div>
      </div>

      <div className="billing-section">
        <div className="section-header">
          <h2>Factures</h2>
          <p>Gérez vos factures et suivez leur statut</p>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><i className="fas fa-file-invoice-dollar"></i></div>
            <h3>Aucune facture trouvée</h3>
            <p>Vous n'avez pas encore créé de facture ou aucune facture ne correspond à vos critères de recherche.</p>
            <button className="create-invoice-btn" onClick={handleCreateInvoice}>
              <i className="fas fa-plus-circle"></i> Créer une facture
            </button>
          </div>
        ) : (
          <div className="invoices-grid">
            {filteredInvoices.map(invoice => {
              // Calculer le total TTC correctement
              const totalHT = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
              const totalTVA = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tva / 100), 0);
              const totalTTC = totalHT + totalTVA;
              
              return (
                <div className="invoice-card\" key={invoice.id}>
                  <div className="invoice-header">
                    <div className="invoice-number">{invoice.invoiceNumber}</div>
                    <div className={`invoice-status ${invoice.status}`}>
                      <i className={`fas ${invoice.status === 'paid' ? 'fa-check-circle' : invoice.status === 'overdue' ? 'fa-exclamation-circle' : 'fa-clock'}`}></i>
                      {getStatusText(invoice.status)}
                    </div>
                  </div>
                  <div className="invoice-content">
                    <div className="invoice-client">
                      <i className="fas fa-user"></i> {invoice.clientName}
                      {invoice.clientCompany && ` (${invoice.clientCompany})`}
                    </div>
                    <div className="invoice-amount">
                      <div className="amount-label">Montant</div>
                      <div className="amount-value">{formatCurrency(totalTTC)}</div>
                    </div>
                    <div className="invoice-dates">
                      <span>Émise le: {formatDate(invoice.date)}</span>
                      <span>Échéance: {formatDate(invoice.dueDate)}</span>
                    </div>
                    {invoice.devisId && (
                      <div className="invoice-devis">
                        Basée sur le devis #{devis.find(d => d.id === invoice.devisId)?.devisNumber || invoice.devisId}
                      </div>
                    )}
                  </div>
                  <div className="invoice-actions">
                    <button className="action-btn view-btn" onClick={() => handleViewInvoice(invoice)}>
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="action-btn download-btn">
                      <i className="fas fa-download"></i>
                    </button>
                    <button className="action-btn send-btn">
                      <i className="fas fa-paper-plane"></i>
                    </button>
                    <button className="action-btn delete-btn">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="billing-section">
        <div className="section-header">
          <h2>Devis à facturer</h2>
          <p>Convertissez vos devis acceptés en factures</p>
        </div>

        {filteredDevis.filter(d => d.status === 'accepted').length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><i className="fas fa-file-alt"></i></div>
            <h3>Aucun devis à facturer</h3>
            <p>Vous n'avez pas de devis acceptés en attente de facturation.</p>
          </div>
        ) : (
          <>
            {selectedDevis.length > 0 && (
              <div className="bulk-select-bar">
                <label className="select-all-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedDevis.length === filteredDevis.filter(d => d.status === 'accepted').length} 
                    onChange={() => {
                      if (selectedDevis.length === filteredDevis.filter(d => d.status === 'accepted').length) {
                        setSelectedDevis([]);
                      } else {
                        setSelectedDevis(filteredDevis.filter(d => d.status === 'accepted').map(d => d.id));
                      }
                    }}
                  />
                  {selectedDevis.length} devis sélectionnés
                </label>
                <div className="bulk-actions">
                  <button className="create-invoice-btn" onClick={handleCreateInvoice}>
                    <i className="fas fa-file-invoice-dollar"></i> Créer des factures
                  </button>
                </div>
              </div>
            )}
            <div className="devis-grid">
              {filteredDevis.filter(d => d.status === 'accepted').map(devis => {
                // Calculer le total TTC correctement
                const totalHT = devis.articles.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                const totalTVA = devis.articles.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tvaRate / 100), 0);
                const totalTTC = totalHT + totalTVA;
                
                return (
                  <div 
                    className={`devis-card ${selectedDevis.includes(devis.id) ? 'selected' : ''}`} 
                    key={devis.id}
                    onClick={() => handleDevisSelection(devis.id)}
                  >
                    <div className="card-select">
                      <input 
                        type="checkbox" 
                        checked={selectedDevis.includes(devis.id)} 
                        onChange={() => handleDevisSelection(devis.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="devis-card-content">
                      <h3 className="devis-card-title">Devis #{devis.devisNumber}</h3>
                      <div className="devis-meta">
                        <div className="devis-client">
                          <i className="fas fa-user client-icon"></i> {devis.clientName}
                        </div>
                        <div className="devis-date">
                          <i className="fas fa-calendar-alt date-icon"></i> {formatDate(devis.date)}
                        </div>
                      </div>
                      <div className="devis-amount">
                        <div className="amount-label">Montant</div>
                        <div className="amount-value">{formatCurrency(totalTTC)}</div>
                      </div>
                      <div className="devis-status">
                        <span className="status-badge fini">
                          <i className="fas fa-check-circle"></i> Accepté
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {autoPreview && selectedDevis.length > 0 && (
        <div className="dynamic-preview-container" ref={previewRef}>
          <div className="dynamic-preview-header">
            <h2>Aperçu de la facture</h2>
            <p>Basée sur le devis sélectionné</p>
          </div>
          <div className="dynamic-preview-content">
            {/* Contenu de l'aperçu dynamique */}
          </div>
        </div>
      )}

      {showInvoicePreview && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content invoice-preview-modal">
            <InvoicePreview invoice={selectedInvoice} onClose={handleCloseInvoicePreview} />
          </div>
        </div>
      )}

      {showCreateInvoice && (
        <div className="modal-overlay">
          <div className="modal-content invoice-preview-modal">
            <DynamicInvoice 
              onClose={handleCloseCreateInvoice} 
              clients={clients}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;