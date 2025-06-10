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
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [businessCard, setBusinessCard] = useState(null);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [showWebsiteButton, setShowWebsiteButton] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');

  useEffect(() => {
    if (userId) {
      trackCardView();
      fetchBusinessCard();
    } else {
      setError('ID utilisateur manquant');
      setLoading(false);
    }
  }, [userId]);

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

  const fetchBusinessCard = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`${API_ENDPOINTS.BUSINESS_CARDS.BASE}/public/${userId}`);
      
      if (response && response.businessCard) {
        setBusinessCard(response.businessCard);
        
        // Vérifier les actions configurées
        if (response.businessCard.cardConfig && response.businessCard.cardConfig.actions) {
          const actions = response.businessCard.cardConfig.actions;
          
          // Vérifier s'il y a une action de téléchargement
          const downloadAction = actions.find(a => a.type === 'download' && a.active);
          if (downloadAction) {
            setShowDownloadButton(true);
          }
          
          // Vérifier s'il y a une action de site web
          const websiteAction = actions.find(a => a.type === 'website' && a.active);
          if (websiteAction && websiteAction.url) {
            setShowWebsiteButton(true);
            setWebsiteUrl(websiteAction.url);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
    } finally {
      setLoading(false);
    }
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
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCard = () => {
    if (businessCard && businessCard.cardImage) {
      const link = document.createElement('a');
      link.download = 'carte-visite.png';
      link.href = businessCard.cardImage;
      link.click();
    }
  };

  const handleVisitWebsite = () => {
    if (websiteUrl) {
      window.open(websiteUrl, '_blank');
    }
  };

  if (loading && !submitted) {
    return (
      <div className="professional-contact-page">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>Chargement...</h2>
            <p>Préparation du formulaire de contact</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
        {/* En-tête simplifié */}
        <div className="contact-header">
          <h1 className="contact-title">💼 CRM Pro</h1>
          <p className="contact-subtitle">Formulaire de contact</p>
        </div>

        {/* Message de succès */}
        {submitted && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <div className="success-content">
              <h4>Merci pour votre inscription !</h4>
              <p>Nous avons bien reçu vos informations et vous recontacterons très prochainement.</p>
              
              {/* Boutons d'action après soumission */}
              <div className="post-submit-actions">
                {showDownloadButton && (
                  <button 
                    onClick={handleDownloadCard}
                    className="action-button download-button"
                  >
                    <span className="button-icon">📥</span>
                    <span className="button-text">Télécharger la carte de visite</span>
                  </button>
                )}
                
                {showWebsiteButton && (
                  <button 
                    onClick={handleVisitWebsite}
                    className="action-button website-button"
                  >
                    <span className="button-icon">🌐</span>
                    <span className="button-text">Visiter le site web</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de contact simplifié */}
        {!submitted && (
          <div className="contact-form-section">
            <div className="form-header">
              <h2 className="form-title">📝 Formulaire de Contact</h2>
              <p className="form-description">Laissez-nous vos coordonnées et nous vous recontacterons rapidement</p>
            </div>

            {/* Boutons d'action avant soumission */}
            {(showDownloadButton || showWebsiteButton) && (
              <div className="pre-submit-actions">
                {showDownloadButton && (
                  <button 
                    onClick={handleDownloadCard}
                    className="action-button download-button"
                  >
                    <span className="button-icon">📥</span>
                    <span className="button-text">Télécharger la carte de visite</span>
                  </button>
                )}
                
                {showWebsiteButton && (
                  <button 
                    onClick={handleVisitWebsite}
                    className="action-button website-button"
                  >
                    <span className="button-icon">🌐</span>
                    <span className="button-text">Visiter le site web</span>
                  </button>
                )}
              </div>
            )}

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
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="06 12 34 56 78"
                    required
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
                  <span className="label-icon">💬</span>
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Comment pouvons-nous vous aider ?"
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
      </div>
    </div>
  );
};

export default RegisterClient;