import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import InvoiceList from './InvoiceList';
import DynamicInvoice from './DynamicInvoice';
import './billing.scss';

const Billing = ({ clients = [] }) => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    canceled: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0
  });
  
  // États pour la création de facture
  const [selectedDevis, setSelectedDevis] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showInvoiceCreator, setShowInvoiceCreator] = useState(false);
  const invoiceCreatorRef = useRef(null);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  // États pour la sélection en masse
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  
  // Référence pour le défilement
  const invoicePreviewRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(API_ENDPOINTS.INVOICES.STATS);
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedClient) {
      alert("Veuillez sélectionner un client");
      return;
    }
    
    if (selectedDevis.length === 0) {
      alert("Veuillez sélectionner au moins un devis");
      return;
    }
    
    setShowInvoiceCreator(true);
    
    // Faire défiler jusqu'à la prévisualisation
    setTimeout(() => {
      if (invoiceCreatorRef.current) {
        invoiceCreatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      setLoading(true);
      
      await apiRequest(API_ENDPOINTS.INVOICES.BASE, {
        method: 'POST',
        body: JSON.stringify({
          ...invoiceData,
          clientId: selectedClient._id,
          devisIds: selectedDevis.map(d => d._id)
        })
      });
      
      // Réinitialiser les états
      setSelectedClient(null);
      setSelectedDevis([]);
      setShowInvoiceCreator(false);
      
      // Rafraîchir les statistiques
      await fetchStats();
      
      alert('✅ Facture créée avec succès');
    } catch (err) {
      console.error('Erreur lors de la création de la facture:', err);
      alert(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedInvoices.length} facture(s) ?`
    );
    
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      
      await Promise.all(
        selectedInvoices.map(id => 
          apiRequest(API_ENDPOINTS.INVOICES.DELETE(id), { method: 'DELETE' })
        )
      );
      
      setSelectedInvoices([]);
      await fetchStats();
      
      alert(`✅ ${selectedInvoices.length} facture(s) supprimée(s) avec succès`);
    } catch (err) {
      console.error('Erreur lors de la suppression en masse:', err);
      alert(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="billing-container">
      <div className="billing-header">
        <div className="header-content">
          <h1 className="page-title">💰 Facturation</h1>
          <div className="billing-stats">
            <div className="stat-card revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{stats.totalAmount.toLocaleString('fr-FR')} €</h3>
                <p>Montant total</p>
                <span className="stat-trend positive">+{stats.total} factures</span>
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{stats.pendingAmount.toLocaleString('fr-FR')} €</h3>
                <p>En attente</p>
                <span className="stat-trend neutral">{stats.pending} factures</span>
              </div>
            </div>
            
            <div className="stat-card paid">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.paidAmount.toLocaleString('fr-FR')} €</h3>
                <p>Payées</p>
                <span className="stat-trend positive">{stats.paid} factures</span>
              </div>
            </div>
            
            <div className="stat-card overdue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>{stats.overdue || 0}</h3>
                <p>En retard</p>
                <span className="stat-trend negative">Attention requise</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="billing-tabs">
        <button 
          className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          📋 Mes Factures
        </button>
        <button 
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ✨ Créer une facture
        </button>
      </div>

      {activeTab === 'invoices' && (
        <div className="billing-section">
          <div className="section-header">
            <h2>📋 Gestion des Factures</h2>
            <p>Consultez et gérez toutes vos factures</p>
          </div>
          
          <InvoiceList 
            clients={clients}
            onRefresh={fetchStats}
          />
        </div>
      )}

      {activeTab === 'create' && (
        <div className="billing-section">
          <div className="section-header">
            <h2>✨ Créer une nouvelle facture</h2>
            <p>Sélectionnez un client et des devis pour créer une facture</p>
          </div>
          
          {/* Formulaire de création de facture */}
          <div className="create-invoice-form">
            <div className="form-row">
              <div className="form-group">
                <label>Client</label>
                <select 
                  value={selectedClient?._id || ''}
                  onChange={(e) => {
                    const client = clients.find(c => c._id === e.target.value);
                    setSelectedClient(client || null);
                    setSelectedDevis([]);
                  }}
                  className="form-select"
                >
                  <option value="">Sélectionnez un client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedClient && (
              <div className="client-devis-section">
                <h3>Devis disponibles pour {selectedClient.name}</h3>
                <p className="section-description">
                  Sélectionnez les devis à inclure dans la facture
                </p>
                
                <div className="devis-selection">
                  {/* Liste des devis du client sélectionné */}
                  {/* Cette partie serait implémentée avec les données réelles */}
                  <div className="empty-state small">
                    <div className="empty-icon">📄</div>
                    <h3>Aucun devis disponible</h3>
                    <p>Ce client n'a pas encore de devis finalisés</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleCreateInvoice}
                  className="create-invoice-btn"
                  disabled={selectedDevis.length === 0}
                >
                  ✨ Créer la facture
                </button>
              </div>
            )}
          </div>
          
          {/* Prévisualisation de la facture */}
          {showInvoiceCreator && (
            <div className="dynamic-preview-container" ref={invoiceCreatorRef}>
              <div className="dynamic-preview-header">
                <h2>📝 Prévisualisation de la facture</h2>
                <p>Personnalisez votre facture avant de l'enregistrer</p>
              </div>
              
              <div className="dynamic-preview-content">
                <DynamicInvoice
                  client={selectedClient}
                  devisDetails={selectedDevis}
                  onSave={handleSaveInvoice}
                  onCancel={() => setShowInvoiceCreator(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Billing;