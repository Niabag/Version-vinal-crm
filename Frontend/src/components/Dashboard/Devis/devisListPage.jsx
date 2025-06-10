import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './devis.scss';

const DevisListPage = () => {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupByClient, setGroupByClient] = useState(false);
  const [clients, setClients] = useState([]);

  // Simuler le chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Données de test pour les clients
        const mockClients = [
          { id: 1, name: 'Jean Dupont', company: 'Tech Solutions', email: 'jean.dupont@example.com', phone: '06 12 34 56 78' },
          { id: 2, name: 'Marie Martin', company: 'Design Studio', email: 'marie.martin@example.com', phone: '07 23 45 67 89' },
          { id: 3, name: 'Pierre Durand', company: 'Consulting Pro', email: 'pierre.durand@example.com', phone: '06 34 56 78 90' },
          { id: 4, name: 'Sophie Lefebvre', company: 'Marketing Plus', email: 'sophie.lefebvre@example.com', phone: '07 45 67 89 01' },
          { id: 5, name: 'Thomas Bernard', company: 'Web Factory', email: 'thomas.bernard@example.com', phone: '06 56 78 90 12' }
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
          },
          { 
            id: 6, 
            devisNumber: 'DEV-2025-006', 
            clientId: 1, 
            clientName: 'Jean Dupont',
            clientCompany: 'Tech Solutions',
            date: '2025-02-20', 
            amount: 2500.00,
            status: 'pending',
            articles: [
              { description: 'Maintenance annuelle', quantity: 1, unitPrice: 2500, tvaRate: '20' }
            ]
          },
          { 
            id: 7, 
            devisNumber: 'DEV-2025-007', 
            clientId: 3, 
            clientName: 'Pierre Durand',
            clientCompany: 'Consulting Pro',
            date: '2025-03-01', 
            amount: 1800.00,
            status: 'accepted',
            articles: [
              { description: 'Formation équipe', quantity: 2, unitPrice: 900, tvaRate: '20' }
            ]
          }
        ];
        
        setClients(mockClients);
        setDevis(mockDevis);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des devis');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusClass = (status) => {
    switch(status) {
      case 'accepted': return 'bg-green-100 text-green-800 border-green-500';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-500';
      case 'pending':
      default: return 'bg-blue-100 text-blue-800 border-blue-500';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'accepted': return 'Accepté';
      case 'rejected': return 'Refusé';
      case 'pending':
      default: return 'En attente';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getClientInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Grouper les devis par client
  const groupedDevis = devis.reduce((acc, devis) => {
    const clientId = devis.clientId;
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(devis);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">⟳</div>
        <p>Chargement des devis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  if (devis.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📄</div>
        <h3>Aucun devis trouvé</h3>
        <p>Vous n'avez pas encore créé de devis. Commencez par en créer un nouveau.</p>
        <Link to="/dashboard/devis/new" className="btn-new">
          <i className="fas fa-plus"></i> Créer un devis
        </Link>
      </div>
    );
  }

  return (
    <div className="devis-list-section">
      <div className="devis-list-header">
        <h2 className="devis-list-title">Gestion des devis</h2>
        <div className="list-actions">
          <button 
            className={`btn-secondary ${groupByClient ? 'active' : ''}`} 
            onClick={() => setGroupByClient(!groupByClient)}
          >
            <i className={`fas ${groupByClient ? 'fa-th' : 'fa-users'}`}></i> 
            {groupByClient ? 'Vue standard' : 'Grouper par client'}
          </button>
          <Link to="/dashboard/devis/new" className="btn-new">
            <i className="fas fa-plus"></i> Nouveau devis
          </Link>
        </div>
      </div>

      {groupByClient ? (
        <div className="clients-devis-groups">
          {Object.entries(groupedDevis).map(([clientId, clientDevis]) => {
            const client = clients.find(c => c.id === parseInt(clientId)) || {};
            return (
              <div className="client-devis-group" key={clientId}>
                <div className="client-group-header">
                  <div className="client-avatar">{getClientInitials(client.name)}</div>
                  <div className="client-group-info">
                    <h3>{client.name}</h3>
                    {client.company && <p>{client.company}</p>}
                    <p>{client.email}</p>
                    <p className="devis-count">{clientDevis.length} devis</p>
                  </div>
                </div>
                <div className="devis-grid">
                  {clientDevis.map(devis => (
                    <div className="devis-card" key={devis.id}>
                      <div className="devis-card-top">
                        <div className="devis-avatar">{getClientInitials(devis.clientName)}</div>
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
                      <div className="card-footer">
                        <span className="join-date">Créé le {formatDate(devis.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="devis-grid">
          {devis.map(devis => (
            <div className="devis-card" key={devis.id}>
              <div className="devis-card-top">
                <div className="devis-avatar">{getClientInitials(devis.clientName)}</div>
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
                <div className="devis-client-info">
                  <i className="fas fa-user devis-client-icon"></i>
                  <span className="devis-client-name">{devis.clientName}</span>
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
              <div className="card-footer">
                <span className="join-date">Créé le {formatDate(devis.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevisListPage;