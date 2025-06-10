import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DevisPreview from './devisPreview';
import './devis.scss';

const DevisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [devisData, setDevisData] = useState({
    devisNumber: `DEVIS-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    issueDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    clientId: '',
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    companyName: 'Votre Entreprise',
    companyAddress: '123 Rue Exemple',
    companyCity: '75000 Paris',
    companyPhone: '01 23 45 67 89',
    companyEmail: 'contact@entreprise.com',
    articles: [
      { description: 'Article 1', quantity: 1, unitPrice: 5000, tvaRate: '0' }
    ],
    conditions: 'Ce devis est valable 30 jours à compter de sa date d\'émission. Le paiement est dû à réception de la facture.',
    logo: null
  });

  // Simuler le chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Données de test pour les clients
        const mockClients = [
          { id: 1, name: 'Jean Dupont', company: 'Tech Solutions', email: 'jean.dupont@example.com', phone: '06 12 34 56 78', address: '123 Rue de Paris\n75001 Paris' },
          { id: 2, name: 'Marie Martin', company: 'Design Studio', email: 'marie.martin@example.com', phone: '07 23 45 67 89', address: '456 Avenue des Champs\n75008 Paris' },
          { id: 3, name: 'Pierre Durand', company: 'Consulting Pro', email: 'pierre.durand@example.com', phone: '06 34 56 78 90', address: '789 Boulevard Haussmann\n75009 Paris' },
          { id: 4, name: 'Sophie Lefebvre', company: 'Marketing Plus', email: 'sophie.lefebvre@example.com', phone: '07 45 67 89 01', address: '101 Rue de Rivoli\n75001 Paris' },
          { id: 5, name: 'Thomas Bernard', company: 'Web Factory', email: 'thomas.bernard@example.com', phone: '06 56 78 90 12', address: '202 Avenue Montaigne\n75008 Paris' }
        ];
        
        setClients(mockClients);
        
        // Si on modifie un devis existant
        if (id && id !== 'new') {
          // Simuler la récupération d'un devis existant
          const mockDevis = {
            id: parseInt(id),
            devisNumber: `DEVIS-2025-00${id}`,
            issueDate: '2025-01-15',
            validUntil: '2025-02-15',
            clientId: 3,
            clientName: 'Pierre Durand',
            clientCompany: 'Consulting Pro',
            clientEmail: 'pierre.durand@example.com',
            clientPhone: '06 34 56 78 90',
            clientAddress: '789 Boulevard Haussmann\n75009 Paris',
            companyName: 'Votre Entreprise',
            companyAddress: '123 Rue Exemple',
            companyCity: '75000 Paris',
            companyPhone: '01 23 45 67 89',
            companyEmail: 'contact@entreprise.com',
            articles: [
              { description: 'Développement site web', quantity: 1, unitPrice: 3000, tvaRate: '20' },
              { description: 'Intégration design', quantity: 1, unitPrice: 1500, tvaRate: '20' },
              { description: 'Maintenance (1 an)', quantity: 1, unitPrice: 500, tvaRate: '20' }
            ],
            conditions: 'Ce devis est valable 30 jours à compter de sa date d\'émission. Le paiement est dû à réception de la facture.',
            logo: null
          };
          
          setDevisData(mockDevis);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFieldChange = (field, value) => {
    // Gestion des champs imbriqués comme "articles[0].description"
    if (field.includes('[') && field.includes(']')) {
      const matches = field.match(/([a-zA-Z]+)\[(\d+)\]\.([a-zA-Z]+)/);
      if (matches && matches.length === 4) {
        const [, arrayName, index, property] = matches;
        const newArray = [...devisData[arrayName]];
        newArray[index][property] = value;
        setDevisData({
          ...devisData,
          [arrayName]: newArray
        });
      }
    } else {
      setDevisData({
        ...devisData,
        [field]: value
      });
    }
  };

  const handleClientChange = (e) => {
    const clientId = parseInt(e.target.value);
    const selectedClient = clients.find(c => c.id === clientId) || {};
    
    setDevisData({
      ...devisData,
      clientId,
      clientName: selectedClient.name || '',
      clientCompany: selectedClient.company || '',
      clientEmail: selectedClient.email || '',
      clientPhone: selectedClient.phone || '',
      clientAddress: selectedClient.address || ''
    });
  };

  const handleAddArticle = () => {
    setDevisData({
      ...devisData,
      articles: [...devisData.articles, { description: '', quantity: 1, unitPrice: 0, tvaRate: '0' }]
    });
  };

  const handleRemoveArticle = (index) => {
    const newArticles = [...devisData.articles];
    newArticles.splice(index, 1);
    setDevisData({
      ...devisData,
      articles: newArticles
    });
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser le devis ? Toutes les modifications seront perdues.')) {
      setDevisData({
        devisNumber: `DEVIS-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        issueDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        clientId: '',
        clientName: '',
        clientCompany: '',
        clientEmail: '',
        clientPhone: '',
        clientAddress: '',
        companyName: 'Votre Entreprise',
        companyAddress: '123 Rue Exemple',
        companyCity: '75000 Paris',
        companyPhone: '01 23 45 67 89',
        companyEmail: 'contact@entreprise.com',
        articles: [
          { description: 'Article 1', quantity: 1, unitPrice: 0, tvaRate: '0' }
        ],
        conditions: 'Ce devis est valable 30 jours à compter de sa date d\'émission. Le paiement est dû à réception de la facture.',
        logo: null
      });
    }
  };

  const handleSave = () => {
    // Ici, vous pouvez implémenter la logique pour sauvegarder le devis
    console.log('Devis sauvegardé:', devisData);
    alert('Devis sauvegardé avec succès!');
    navigate('/dashboard/devis');
  };

  const calculateTotal = () => {
    let total = 0;
    devisData.articles.forEach(article => {
      const price = parseFloat(article.unitPrice || 0);
      const qty = parseFloat(article.quantity || 0);
      const tva = parseFloat(article.tvaRate || 0);
      
      const itemTotal = price * qty;
      const itemTva = itemTotal * (tva / 100);
      total += itemTotal + itemTva;
    });
    return total;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">⟳</div>
        <p>Chargement du devis...</p>
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

  return (
    <div className="devis-page">
      <div className="devis-preview-container">
        <div className="preview-header">
          <h2 className="preview-title">{id === 'new' ? 'Créer un nouveau devis' : 'Modifier le devis'}</h2>
          <p className="preview-subtitle">
            Montant total: <span className="total-amount">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}</span>
          </p>
        </div>
        
        <div className="preview-actions">
          <button className="btn-save" onClick={handleSave}>
            <i className="fas fa-save"></i> Enregistrer le devis
          </button>
          <button className="btn-secondary" onClick={() => navigate('/dashboard/devis')}>
            <i className="fas fa-times"></i> Annuler
          </button>
        </div>
        
        <div className="client-selection">
          <label htmlFor="client-select">Sélectionner un client:</label>
          <select 
            id="client-select" 
            value={devisData.clientId || ''} 
            onChange={handleClientChange}
            className="client-select"
          >
            <option value="">-- Sélectionner un client --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} {client.company ? `(${client.company})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <DevisPreview 
          devisData={devisData}
          onFieldChange={handleFieldChange}
          onAddArticle={handleAddArticle}
          onRemoveArticle={handleRemoveArticle}
          onReset={handleReset}
          clients={clients}
        />
      </div>
    </div>
  );
};

export default DevisPage;