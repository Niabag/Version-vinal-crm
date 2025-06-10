import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import './registerClient.scss';

const RegisterClient = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    postalCode: '',
    city: '',
    subject: 'Demande de contact',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [businessCard, setBusinessCard] = useState(null);
  const [executionStatus, setExecutionStatus] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showWebsiteButton, setShowWebsiteButton] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [schemaType, setSchemaType] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);

  const trackCardView = async () => {
    try {
      await apiRequest(
        API_ENDPOINTS.BUSINESS_CARDS.TRACK_VIEW(userId),
        { method: 'POST' }
      );
    } catch (err) {
      console.error('Erreur suivi carte:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      trackCardView();
      fetchBusinessCard();
    } else {
      setError('ID utilisateur manquant');
      setLoading(false);
    }
  }, [userId]);

  const fetchBusinessCard = async () => {
    try {
      setLoading(true);
      // Utiliser l'userId directement dans l'URL
      const response = await apiRequest(`${API_ENDPOINTS.BUSINESS_CARDS.BASE}/public/${userId}`);
      
      if (response && response.businessCard) {
        setBusinessCard(response.businessCard);
        
        if (response.businessCard.cardConfig && response.businessCard.cardConfig.actions) {
          analyzeActions(response.businessCard.cardConfig.actions);
        } else {
          console.log('Aucune action configurée - Affichage du formulaire par défaut');
          setShowForm(true);
          setLoading(false);
        }
      } else {
        throw new Error('Carte de visite non trouvée');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
      // En cas d'erreur, afficher le formulaire par défaut
      console.log('Erreur chargement carte - Affichage du formulaire par défaut');
      setShowForm(true);
      setLoading(false);
    }
  };

  // Nouvelle fonction pour analyser les actions et configurer l'interface
  const analyzeActions = (actions) => {
    if (!actions || actions.length === 0) {
      console.log('Aucune action - Formulaire par défaut');
      setShowForm(true);
      setLoading(false);
      return;
    }

    const activeActions = actions.filter(action => action.active);
    const sortedActions = activeActions.sort((a, b) => (a.order || 1) - (b.order || 1));

    console.log('🎯 Actions actives à analyser:', sortedActions);

    if (sortedActions.length === 0) {
      console.log('Aucune action active - Formulaire par défaut');
      setShowForm(true);
      setLoading(false);
      return;
    }

    // Détection du type de schéma
    const hasWebsite = sortedActions.some(a => a.type === 'website');
    const hasForm = sortedActions.some(a => a.type === 'form');
    const hasDownload = sortedActions.some(a => a.type === 'download');

    let detectedSchema = '';
    
    if (hasWebsite && !hasForm && !hasDownload) {
      detectedSchema = 'website-only';
    } else if (!hasWebsite && hasForm && !hasDownload) {
      detectedSchema = 'form-only';
    } else if (!hasWebsite && !hasForm && hasDownload) {
      detectedSchema = 'download-only';
    } else if (hasWebsite && hasForm) {
      detectedSchema = 'form-website';
    } else if (hasForm && hasDownload) {
      detectedSchema = 'form-download';
    } else if (hasWebsite && hasForm && hasDownload) {
      detectedSchema = 'complete-funnel';
    } else {
      detectedSchema = 'custom';
    }

    setSchemaType(detectedSchema);
    console.log(`📋 Schéma détecté: ${detectedSchema}`);

    // Définir le nombre total d'étapes
    setTotalSteps(sortedActions.length);

    // Configuration de l'interface en fonction du schéma
    // Commencer par la première étape
    const firstAction = sortedActions[0];
    
    if (firstAction.type === 'form') {
      setShowForm(true);
    } else if (firstAction.type === 'website') {
      const websiteAction = sortedActions.find(a => a.type === 'website');
      if (websiteAction && websiteAction.url) {
        setWebsiteUrl(websiteAction.url);
        setShowWebsiteButton(true);
      }
    } else if (firstAction.type === 'download') {
      setShowDownloadButton(true);
    }
    
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.CLIENTS.REGISTER(userId), {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSubmitted(true);
      setExecutionStatus(prev => [...prev, {
        action: 'form',
        status: 'completed',
        message: 'Formulaire soumis avec succès !'
      }]);

      // Passer à l'étape suivante après la soumission du formulaire
      goToNextStep();

    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleWebsiteVisit = () => {
    if (websiteUrl) {
      window.open(websiteUrl, '_blank');
      setExecutionStatus(prev => [...prev, {
        action: 'website',
        status: 'completed',
        message: 'Site web ouvert dans un nouvel onglet'
      }]);
      
      // Passer à l'étape suivante après avoir visité le site web
      goToNextStep();
    } else {
      setError('URL du site web non configurée');
    }
  };

  const handleDownloadCard = async () => {
    try {
      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'executing',
        message: 'Téléchargement de la carte de visite...'
      }]);

      // Simuler un téléchargement
      await new Promise(resolve => setTimeout(resolve, 1000));

      const link = document.createElement('a');
      link.download = 'carte-visite-numerique.png';
      link.href = businessCard.cardImage || '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg';
      link.click();

      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'completed',
        message: 'Carte de visite téléchargée avec succès !'
      }]);
      
      // Passer à l'étape suivante après le téléchargement
      goToNextStep();

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'error',
        message: 'Erreur lors du téléchargement'
      }]);
    }
  };

  // Fonction pour passer à l'étape suivante
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      
      // Récupérer les actions actives et triées
      const activeActions = businessCard.cardConfig.actions
        .filter(action => action.active)
        .sort((a, b) => (a.order || 1) - (b.order || 1));
      
      // Déterminer quelle action afficher ensuite
      const nextAction = activeActions[currentStep];
      
      if (nextAction) {
        if (nextAction.type === 'form') {
          setShowForm(true);
          setShowWebsiteButton(false);
          setShowDownloadButton(false);
        } else if (nextAction.type === 'website') {
          setShowForm(false);
          setShowWebsiteButton(true);
          setShowDownloadButton(false);
          setWebsiteUrl(nextAction.url || '');
        } else if (nextAction.type === 'download') {
          setShowForm(false);
          setShowWebsiteButton(false);
          setShowDownloadButton(true);
        }
      }
    }
  };

  const getSchemaName = () => {
    switch (schemaType) {
      case 'website-only': return '🌐 Site Web Direct';
      case 'form-only': return '📝 Formulaire Simple';
      case 'download-only': return '📥 Téléchargement Direct';
      case 'form-website': return '📝 Formulaire + Site';
      case 'form-download': return '📝 Formulaire + Carte';
      case 'complete-funnel': return '🎯 Tunnel Complet';
      case 'custom': return '🔧 Stratégie Personnalisée';
      default: return 'Configuration par défaut';
    }
  };

  if (loading) {
    return (
      <div className="professional-contact-page">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>Chargement...</h2>
            <p>Préparation de votre expérience personnalisée</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !showForm && !showWebsiteButton && !showDownloadButton) {
    return (
      <div className="professional-contact-page">
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">❌ Erreur</h1>
            <p className="contact-subtitle">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-contact-page">
      <div className="contact-container">
        {/* En-tête professionnel */}
        <div className="contact-header">
          <h1 className="contact-title">💼 CRM Pro</h1>
          <p className="contact-subtitle">Découvrez nos services et entrons en contact</p>
        </div>

        {/* Indicateur d'étape */}
        {totalSteps > 1 && (
          <div className="step-indicator">
            <div className="step-progress">
              <div 
                className="step-progress-bar" 
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="step-text">
              Étape {currentStep} sur {totalSteps}
            </div>
          </div>
        )}

        {/* Statut d'exécution */}
        {executionStatus.length > 0 && (
          <div className="execution-status">
            {executionStatus.map((status, index) => (
              <div key={index} className={`status-message ${status.status}`}>
                <span className="status-icon">
                  {status.status === 'completed' ? '✅' : 
                   status.status === 'executing' ? '⏳' : 
                   status.status === 'form-shown' ? '📝' : '❓'}
                </span>
                <span>{status.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Message de succès */}
        {submitted && currentStep >= totalSteps && (
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <div className="success-content">
              <h4>Merci pour votre inscription !</h4>
              <p>Nous avons bien reçu vos informations et vous recontacterons très prochainement.</p>
            </div>
          </div>
        )}

        {/* Bouton Site Web */}
        {showWebsiteButton && (
          <div className="action-container">
            <h3 className="action-title">🌐 Visitez notre site web</h3>
            <p className="action-description">
              Découvrez tous nos services et informations sur notre site web officiel
            </p>
            <button 
              onClick={handleWebsiteVisit}
              className="action-button website-button"
            >
              <span className="button-icon">🌐</span>
              <span className="button-text">Visiter notre site web</span>
            </button>
          </div>
        )}

        {/* Bouton Téléchargement */}
        {showDownloadButton && (
          <div className="action-container">
            <h3 className="action-title">📥 Téléchargez notre carte de visite</h3>
            <p className="action-description">
              Gardez nos coordonnées à portée de main en téléchargeant notre carte de visite numérique
            </p>
            <button 
              onClick={handleDownloadCard}
              className="action-button download-button"
            >
              <span className="button-icon">📥</span>
              <span className="button-text">Télécharger la carte de visite</span>
            </button>
          </div>
        )}

        {/* Formulaire de contact */}
        {showForm && !submitted && (
          <div className="contact-form-section">
            <div className="form-header">
              <h2 className="form-title">📝 Formulaire de Contact</h2>
              <p className="form-description">Laissez-nous vos coordonnées et nous vous recontacterons rapidement</p>
            </div>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Votre nom et prénom"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📧</span>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📞</span>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🏢</span>
                    Entreprise
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Nom de votre entreprise"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📋</span>
                  Sujet
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="Demande de contact">Demande de contact</option>
                  <option value="Demande de devis">Demande de devis</option>
                  <option value="Information produit">Information produit</option>
                  <option value="Support technique">Support technique</option>
                  <option value="Partenariat">Partenariat</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">💬</span>
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Décrivez votre demande ou votre projet..."
                  required
                  rows={4}
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                <span className="btn-icon">📤</span>
                <span className="btn-text">
                  {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Message si aucune action configurée */}
        {!showForm && !showWebsiteButton && !showDownloadButton && (
          <div className="general-message">
            <p>Aucune action spécifique configurée. Contactez-nous directement pour plus d'informations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterClient;