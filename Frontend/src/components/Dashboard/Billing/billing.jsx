import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import InvoiceList from './InvoiceList';
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
    paidAmount: 0,
    overdueAmount: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(API_ENDPOINTS.INVOICES.STATS);
      if (data) {
        setStats({
          ...data,
          // Ensure all amount values have defaults to prevent errors
          totalAmount: data.totalAmount || 0,
          pendingAmount: data.pendingAmount || 0,
          paidAmount: data.paidAmount || 0,
          overdueAmount: data.overdueAmount || 0
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques de facturation:', err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="billing-container">
      {/* En-tête avec statistiques */}
      <div className="billing-header">
        <div className="header-content">
          <h1 className="page-title">💰 Facturation</h1>
          <div className="billing-stats">
            <div className="stat-card revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{stats.paidAmount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</h3>
                <p>Revenus encaissés</p>
                <span className="stat-trend positive">{stats.paid} facture{stats.paid !== 1 ? 's' : ''} payée{stats.paid !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{stats.pendingAmount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</h3>
                <p>En attente</p>
                <span className="stat-trend neutral">{stats.pending} facture{stats.pending !== 1 ? 's' : ''} en attente</span>
              </div>
            </div>
            
            <div className="stat-card overdue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>{stats.overdueAmount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</h3>
                <p>En retard</p>
                <span className="stat-trend">{stats.overdue} facture{stats.overdue !== 1 ? 's' : ''} en retard</span>
              </div>
            </div>
            
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{stats.totalAmount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</h3>
                <p>Total</p>
                <span className="stat-trend">{stats.total} facture{stats.total !== 1 ? 's' : ''} au total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="billing-tabs">
        <button 
          className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          📋 Factures
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'invoices' && (
        <InvoiceList clients={clients} />
      )}
    </div>
  );
};

export default Billing;