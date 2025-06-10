import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../../config/api';
import DynamicInvoice from './DynamicInvoice';
import './billing.scss';

const Billing = ({ clients = [], onRefresh }) => {
  const [devisList, setDevisList] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    devisIds: [],
    invoiceNumber: '',
    dueDate: '',
    notes: '',
    paymentTerms: '30',
    discount: 0,
    taxRate: 20
  });
  
  // Référence pour le conteneur de prévisualisation
  const previewContainerRef = useRef(null);
  // État pour la prévisualisation dynamique
  const [dynamicPreview, setDynamicPreview] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchDevis();
      await fetchInvoices();
    };
    loadData();
  }, []);

  // Effet pour prévisualiser automatiquement quand des devis sont sélectionnés
  useEffect(() => {
    if (selectedDevis.length > 0 && dynamicPreview) {
      // Faire défiler jusqu'à la prévisualisation si elle est visible
      if (previewContainerRef.current) {
        setTimeout(() => {
          previewContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [selectedDevis, dynamicPreview]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(API_ENDPOINTS.DEVIS.BASE);
      setDevisList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      // Simulation des factures - à remplacer par un vrai endpoint
      const mockInvoices = [
        {
          id: 'INV-001',
          clientId: clients[0]?._id,
          clientName: clients[0]?.name || 'Client Test',
          amount: 2500.0,
          status: 'paid',
          dueDate: '2024-02-15',
          createdAt: '2024-01-15',
          invoiceNumber: 'FACT-2024-001',
          devisIds: [devisList[0]?._id, devisList[1]?._id].filter(Boolean)
        },
        {
          id: 'INV-002',
          clientId: clients[1]?._id,
          clientName: clients[1]?.name || 'Client Test 2',
          amount: 1800.0,
          status: 'pending',
          dueDate: '2024-02-20',
          createdAt: '2024-01-20',
          invoiceNumber: 'FACT-2024-002',
          devisIds: [devisList[2]?._id].filter(Boolean)
        },
        {
          id: 'INV-003',
          clientId: clients[2]?._id,
          clientName: clients[2]?.name || 'Client Test 3',
          amount: 3200.0,
          status: 'overdue',
          dueDate: '2024-01-30',
          createdAt: '2024-01-01',
          invoiceNumber: 'FACT-2024-003',
          devisIds: [devisList[3]?._id, devisList[4]?._id].filter(Boolean)
        }
      ];

      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
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

  const getFinishedDevis = () => {
    return devisList.filter(devis => devis.status === 'fini');
  };

  const filteredDevis = getFinishedDevis().filter(devis => {
    const client = clients.find(c => c._id === (typeof devis.clientId === "object" ? devis.clientId?._id : devis.clientId));
    const clientName = client?.name || "Client inconnu";
    
    const matchesSearch = devis.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.title || "").localeCompare(b.title || "");
      case 'client':
        const clientA = clients.find(c => c._id === (typeof a.clientId === "object" ? a.clientId?._id : a.clientId))?.name || "";
        const clientB = clients.find(c => c._id === (typeof b.clientId === "object" ? b.clientId?._id : b.clientId))?.name || "";
        return clientA.localeCompare(clientB);
      case 'amount':
        return calculateTTC(b) - calculateTTC(a);
      case 'date':
      default:
        return new Date(b.dateDevis || 0) - new Date(a.dateDevis || 0);
    }
  });

  const handleSelectDevis = (devisId) => {
    setSelectedDevis(prev => 
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

  const handleSelectAll = () => {
    if (selectedDevis.length === filteredDevis.length) {
      setSelectedDevis([]);
    } else {
      setSelectedDevis(filteredDevis.map(d => d._id));
    }
  };

  const saveInvoice = async (updatedInvoice = null) => {
    try {
      setLoading(true);
      
      const invoiceToSave = updatedInvoice || newInvoice;
      const client = clients.find(c => c._id === invoiceToSave.clientId);
      const selectedDevisData = devisList.filter(d => invoiceToSave.devisIds.includes(d._id));
      const total = updatedInvoice ? updatedInvoice.amount : calculateInvoiceTotal();

      const invoice = {
        id: `INV-${Date.now()}`,
        clientId: invoiceToSave.clientId,
        clientName: client?.name || 'Client inconnu',
        amount: total,
        status: invoiceToSave.status || 'pending',
        dueDate: invoiceToSave.dueDate,
        createdAt: invoiceToSave.createdAt || new Date().toISOString(),
        invoiceNumber: invoiceToSave.invoiceNumber,
        devisIds: invoiceToSave.devisIds,
        notes: invoiceToSave.notes,
        paymentTerms: invoiceToSave.paymentTerms,
        discount: invoiceToSave.discount,
        taxRate: invoiceToSave.taxRate
      };

      // Ajouter à la liste locale (en attendant l'API)
      setInvoices(prev => [invoice, ...prev]);
      
      // Réinitialiser
      setSelectedDevis([]);
      setNewInvoice({
        clientId: '',
        devisIds: [],
        invoiceNumber: '',
        dueDate: '',
        notes: '',
        paymentTerms: '30',
        discount: 0,
        taxRate: 20
      });

      alert('✅ Facture créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      alert('❌ Erreur lors de la création de la facture');
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
      const devisDetails = await Promise.all(
        invoice.devisIds.map(async (id) => {
          try {
            return await apiRequest(API_ENDPOINTS.DEVIS.BY_ID(id));
          } catch (err) {
            console.error('Erreur récupération devis:', err);
            return null;
          }
        })
      );
      const validDevis = devisDetails.filter(Boolean);

      // Fusionner tous les articles
      const articles = validDevis.flatMap((d) => d.articles || []);

      const client = clients.find(c => c._id === invoice.clientId) || {};

      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.setFontSize(18);
      pdf.text(`Facture ${invoice.invoiceNumber}`, 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`Client : ${client.name || invoice.clientName}`, 20, 40);
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

  const handleInvoiceStatusClick = (invoiceId, currentStatus) => {
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR");
    } catch (error) {
      return "";
    }
  };

  const calculateInvoiceTotal = () => {
    const selectedDevisData = devisList.filter(d => selectedDevis.includes(d._id));
    const subtotal = selectedDevisData.reduce((sum, devis) => sum + calculateTTC(devis), 0);
    const discountAmount = subtotal * (newInvoice.discount / 100);
    return subtotal - discountAmount;
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
    <div className="billing-container">
      {/* En-tête avec statistiques */}
      <div className="billing-header">
        <div className="header-content">
          <h1 className="page-title">💰 Facturation</h1>
          <div className="billing-stats">
            <div className="stat-card revenue">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR')} €</h3>
                <p>Chiffre d'affaires</p>
                <span className="stat-trend">Factures payées</span>
              </div>
            </div>
            
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>{invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR')} €</h3>
                <p>En attente</p>
                <span className="stat-trend">À encaisser</span>
              </div>
            </div>
            
            <div className="stat-card overdue">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>{invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('fr-FR')} €</h3>
                <p>En retard</p>
                <span className="stat-trend">Relances nécessaires</span>
              </div>
            </div>
            
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{invoices.length}</h3>
                <p>Factures totales</p>
                <span className="stat-trend">Toutes périodes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section de création de factures */}
      <div className="billing-section">
        <div className="section-header">
          <h2>📄 Devis finalisés</h2>
          <p>Sélectionnez les devis à facturer</p>
        </div>

        {/* Filtres et recherche */}
        <div className="filters-section">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Rechercher par titre ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filters-row">
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

            {selectedDevis.length > 0 && (
              <div className="bulk-actions">
                <button 
                  onClick={() => {
                    // Créer une facture à partir des devis sélectionnés
                    const firstDevis = devisList.find(d => d._id === selectedDevis[0]);
                    if (!firstDevis) return;
                    
                    const clientId = typeof firstDevis.clientId === "object" ? firstDevis.clientId._id : firstDevis.clientId;
                    
                    setNewInvoice({
                      clientId,
                      devisIds: selectedDevis,
                      invoiceNumber: `FACT-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
                      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      notes: 'Merci pour votre confiance.',
                      paymentTerms: '30',
                      discount: 0,
                      taxRate: 20
                    });
                  }}
                  className="create-invoice-btn"
                  disabled={loading}
                >
                  💰 Créer une facture ({selectedDevis.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sélection en masse */}
        {filteredDevis.length > 0 && (
          <div className="bulk-select-bar">
            <label className="select-all-checkbox">
              <input
                type="checkbox"
                checked={selectedDevis.length === filteredDevis.length && filteredDevis.length > 0}
                onChange={handleSelectAll}
              />
              <span>Sélectionner tous les devis ({filteredDevis.length})</span>
            </label>
          </div>
        )}

        {/* Liste des devis finalisés */}
        {loading && devisList.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>Chargement...</p>
          </div>
        ) : filteredDevis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Aucun devis finalisé</h3>
            <p>Les devis avec le statut "Fini" apparaîtront ici pour être facturés</p>
          </div>
        ) : (
          <div className="devis-grid">
            {filteredDevis.map((devis) => {
              const client = clients.find(c => c._id === (typeof devis.clientId === "object" ? devis.clientId?._id : devis.clientId));
              
              return (
                <div 
                  key={devis._id} 
                  className={`devis-card ${selectedDevis.includes(devis._id) ? 'selected' : ''}`}
                  onClick={() => handleSelectDevis(devis._id)}
                >
                  <div className="card-select">
                    <input
                      type="checkbox"
                      checked={selectedDevis.includes(devis._id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectDevis(devis._id);
                      }}
                    />
                  </div>

                  <div className="devis-card-content">
                    <h3 className="devis-card-title">{devis.title || "Devis sans titre"}</h3>
                    
                    <div className="devis-meta">
                      <div className="devis-client">
                        <span className="client-icon">👤</span>
                        <span>{client?.name || "Client inconnu"}</span>
                      </div>
                      
                      <div className="devis-date">
                        <span className="date-icon">📅</span>
                        <span>{formatDate(devis.dateDevis)}</span>
                      </div>
                    </div>

                    <div className="devis-amount">
                      <span className="amount-label">Montant TTC :</span>
                      <span className="amount-value">{calculateTTC(devis).toFixed(2)} €</span>
                    </div>

                    <div className="devis-status">
                      <span className="status-badge fini">
                        ✅ Finalisé
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prévisualisation dynamique de la facture */}
      {dynamicPreview && selectedDevis.length > 0 && (
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
                devisIds: selectedDevis
              }}
              client={(() => {
                const firstDevis = devisList.find(d => d._id === selectedDevis[0]);
                if (!firstDevis) return {};
                const clientId = typeof firstDevis.clientId === "object" ? firstDevis.clientId._id : firstDevis.clientId;
                return clients.find(c => c._id === clientId) || {};
              })()}
              devisDetails={devisList.filter(d => selectedDevis.includes(d._id))}
              onSave={saveInvoice}
            />
          </div>
        </div>
      )}

      {/* Section des factures existantes */}
      <div className="billing-section">
        <div className="section-header">
          <h2>📋 Factures émises</h2>
          <p>Historique de vos factures</p>
        </div>

        {invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Aucune facture émise</h3>
            <p>Vos factures créées apparaîtront ici</p>
          </div>
        ) : (
          <div className="invoices-grid">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="invoice-card">
                <div className="invoice-header">
                  <div className="invoice-number">{invoice.invoiceNumber}</div>
                  <div
                    className="invoice-status clickable"
                    style={{ backgroundColor: getStatusColor(invoice.status), color: 'white' }}
                    title={getNextStatusLabel(invoice.status)}
                    onClick={() => handleInvoiceStatusClick(invoice.id, invoice.status)}
                  >
                    {getStatusIcon(invoice.status)} {getStatusLabel(invoice.status)}
                  </div>
                </div>

                <div className="invoice-content">
                  <div className="invoice-client">
                    <span className="client-icon">👤</span>
                    <span>{invoice.clientName}</span>
                  </div>

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
        )}
      </div>
    </div>
  );
};

export default Billing;