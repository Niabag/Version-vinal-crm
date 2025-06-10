import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './clientBilling.scss';
import InvoicePreview from './InvoicePreview';
import DynamicInvoice from '../Billing/DynamicInvoice';

const ClientBilling = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [devis, setDevis] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  // Simuler le chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Données de test pour le client
        const mockClient = {
          id: parseInt(clientId),
          name: 'Céline Bernard',
          company: 'Consulting Pro',
          email: 'célinebernard@sfr.fr',
          phone: '06 71 27 27 74',
          address: '145 Rue de la Paix',
          postalCode: '30900',
          city: 'Nîmes',
          status: 'active',
          createdAt: '2024-01-15'
        };
        
        // Données de test pour les devis
        const mockDevis = [
          { 
            id: 1, 
            devisNumber: 'DEV-2025-001', 
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
            date: '2025-02-20', 
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
            date: '2025-03-05', 
            amount: 5000.00,
            status: 'pending',
            articles: [
              { description: 'Application mobile', quantity: 1, unitPrice: 5000, tvaRate: '20' }
            ]
          }
        ];
        
        // Données de test pour les factures
        const mockInvoices = [
          { 
            id: 1, 
            invoiceNumber: 'FACT-2025-001', 
            date: '2025-01-20', 
            dueDate: '2025-02-20',
            amount: 1500.00,
            status: 'paid',
            devisId: 1,
            items: [
              { description: 'Développement site web', quantity: 1, unitPrice: 1500, tva: 20 }
            ],
            client: mockClient,
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
            date: '2025-02-25', 
            dueDate: '2025-03-25',
            amount: 2800.00,
            status: 'pending',
            devisId: 2,
            items: [
              { description: 'Refonte graphique', quantity: 1, unitPrice: 1800, tva: 20 },
              { description: 'Intégration', quantity: 1, unitPrice: 1000, tva: 20 }
            ],
            client: mockClient,
            companyName: 'Votre Entreprise',
            companyAddress: '123 Rue Exemple',
            companyCity: '75000 Paris',
            companyPhone: '01 23 45 67 89',
            companyEmail: 'contact@entreprise.com',
            notes: 'Merci pour votre confiance.',
            paymentTerms: '30'
          }
        ];
        
        setClient(mockClient);
        setDevis(mockDevis);
        setInvoices(mockInvoices);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

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

  const getClientInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

  const calculateTotalStats = () => {
    const totalDevis = devis.reduce((sum, d) => sum + d.amount, 0);
    const totalInvoices = invoices.reduce((sum, i) => sum + i.amount, 0);
    const paidInvoices = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const pendingInvoices = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
    
    return {
      totalDevis,
      totalInvoices,
      paidInvoices,
      pendingInvoices
    };
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">⟳</div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="empty-state">
        <div className="empty-icon">👤</div>
        <h3>Client non trouvé</h3>
        <p>Le client demandé n'existe pas ou a été supprimé.</p>
        <button onClick={() => navigate('/dashboard/clients')} className="btn-primary">
          Retour à la liste des clients
        </button>
      </div>
    );
  }

  const stats = calculateTotalStats();

  return (
    <div className="client-billing-container">
      <div className="client-billing-header">
        <button className="back-button" onClick={() => navigate('/dashboard/clients')}>
          <i className="fas fa-arrow-left"></i> Retour aux clients
        </button>
        <div className="client-info">
          <div className="client-avatar">{getClientInitials(client.name)}</div>
          <div className="client-details">
            <h2>{client.name}</h2>
            <div className="client-contact">
              {client.company && <span><i className="fas fa-building"></i> {client.company}</span>}
              <span><i className="fas fa-envelope"></i> {client.email}</span>
              <span><i className="fas fa-phone"></i> {client.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="billing-stats">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-file-invoice"></i></div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalDevis)}</h3>
            <p>Total des devis</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-file-invoice-dollar"></i></div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalInvoices)}</h3>
            <p>Total des factures</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.paidInvoices)}</h3>
            <p>Factures payées</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-clock"></i></div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.pendingInvoices)}</h3>
            <p>Factures en attente</p>
          </div>
        </div>
      </div>

      <div className="client-billing-actions">
        <button className="create-invoice-btn" onClick={handleCreateInvoice}>
          <i className="fas fa-plus-circle"></i> Créer une nouvelle facture
        </button>
      </div>

      <div className="devis-section">
        <h3>Devis</h3>
        {devis.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon"><i className="fas fa-file-alt"></i></div>
            <h3>Aucun devis</h3>
            <p>Ce client n'a pas encore de devis.</p>
          </div>
        ) : (
          <div className="devis-grid">
            {devis.map(devis => (
              <div className="devis-card" key={devis.id}>
                <div className="devis-card-top">
                  <div className="devis-avatar">{getClientInitials(client.name)}</div>
                </div>
                <div className="devis-card-content">
                  <div className="devis-card-header">
                    <h4 className="devis-card-title">Devis #{devis.devisNumber}</h4>
                    <div className="devis-card-meta">
                      <span className="devis-card-date">
                        <i className="far fa-calendar-alt"></i> {formatDate(devis.date)}
                      </span>
                      <span className="devis-card-amount">
                        <i className="fas fa-euro-sign"></i> {formatCurrency(devis.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="status-text">
                    <span className={`devis-status-badge ${getStatusClass(devis.status)}`}>
                      {getStatusText(devis.status)}
                    </span>
                  </div>
                  <div className="devis-card-actions">
                    <Link to={`/dashboard/devis/${devis.id}`} className="card-btn card-btn-edit">
                      <i className="fas fa-edit"></i> Modifier
                    </Link>
                    <button className="card-btn card-btn-pdf">
                      <i className="fas fa-file-pdf"></i> PDF
                    </button>
                    <button className="card-btn card-btn-delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="invoices-section">
        <h3>Factures</h3>
        {invoices.length === 0 ? (
          <div className="empty-state small">
            <div className="empty-icon"><i className="fas fa-file-invoice-dollar"></i></div>
            <h3>Aucune facture</h3>
            <p>Ce client n'a pas encore de factures.</p>
          </div>
        ) : (
          <div className="invoices-grid">
            {invoices.map(invoice => {
              // Calculer le total TTC correctement
              const totalHT = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
              const totalTVA = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tva / 100), 0);
              const totalTTC = totalHT + totalTVA;
              
              return (
                <div className="invoice-card" key={invoice.id}>
                  <div className="invoice-header">
                    <div className="invoice-number">{invoice.invoiceNumber}</div>
                    <div className={`invoice-status ${invoice.status}`}>
                      <i className={`fas ${invoice.status === 'paid' ? 'fa-check-circle' : 'fa-clock'}`}></i>
                      {getStatusText(invoice.status)}
                    </div>
                  </div>
                  <div className="invoice-content">
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
                    <button className="action-btn edit-btn">
                      <i className="fas fa-edit"></i>
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
              initialData={{ client: client }}
              clients={[client]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBilling;