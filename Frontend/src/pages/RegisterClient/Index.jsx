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
  const [pendingActions, setPendingActions] = useState([]);
  const [hasRedirectedFromWebsite, setHasRedirectedFromWebsite] = useState(false);
  const [schemaType, setSchemaType] = useState('');

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
      checkRedirectionSource();
    } else {
      setError('ID utilisateur manquant');
      setLoading(false);
    }
  }, [userId]);

  const checkRedirectionSource = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromWebsite = urlParams.get('from') === 'website' || 
                       urlParams.get('from') === 'qr' ||
                       document.referrer.includes('votre-site.com') ||
                       sessionStorage.getItem('redirectedFromWebsite') === 'true';
    
    if (fromWebsite) {
      setHasRedirectedFromWebsite(true);
      sessionStorage.setItem('redirectedFromWebsite', 'true');
      console.log('✅ Détection: Retour depuis le site web');
    }
  };

  const fetchBusinessCard = async () => {
    try {
      setLoading(true);
      // Utiliser l'API publique pour récupérer la carte
      const response = await apiRequest(`${API_ENDPOINTS.BUSINESS_CARDS.BASE}/public/${userId}`);
      
      if (response && response.businessCard) {
        setBusinessCard(response.businessCard);
        
        if (response.businessCard.cardConfig && response.businessCard.cardConfig.actions) {
          await executeActions(response.businessCard.cardConfig.actions);
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

  const executeActions = async (actions) => {
    if (!actions || actions.length === 0) {
      console.log('Aucune action - Formulaire par défaut');
      setShowForm(true);
      setLoading(false);
      return;
    }

    const activeActions = actions.filter(action => action.active);
    const sortedActions = activeActions.sort((a, b) => (a.order || 1) - (b.order || 1));

    console.log('🎯 Actions actives à exécuter:', sortedActions);

    if (sortedActions.length === 0) {
      console.log('Aucune action active - Formulaire par défaut');
      setShowForm(true);
      setLoading(false);
      return;
    }

    // ✅ DÉTECTION DU TYPE DE SCHÉMA
    const hasWebsite = sortedActions.some(a => a.type === 'website');
    const hasForm = sortedActions.some(a => a.type === 'form');
    const hasDownload = sortedActions.some(a => a.type === 'download');
    
    // Identifier le schéma en fonction des actions présentes
    let detectedSchema = '';
    
    if (sortedActions.length === 1) {
      // Schémas à action unique
      if (hasWebsite && !hasForm && !hasDownload) {
        detectedSchema = 'website-only';
      } else if (!hasWebsite && hasForm && !hasDownload) {
        detectedSchema = 'form-only';
      } else if (!hasWebsite && !hasForm && hasDownload) {
        detectedSchema = 'download-only';
      }
    } else if (sortedActions.length === 2) {
      // Schémas à deux actions
      if (hasForm && hasWebsite) {
        detectedSchema = 'form-website';
      } else if (hasForm && hasDownload) {
        detectedSchema = 'form-download';
      }
    } else if (sortedActions.length >= 3) {
      // Schéma complet
      if (hasForm && hasDownload && hasWebsite) {
        detectedSchema = 'complete-funnel';
      }
    }
    
    // Si aucun schéma n'a été identifié, utiliser un schéma personnalisé
    if (!detectedSchema) {
      detectedSchema = 'custom';
    }

    setSchemaType(detectedSchema);
    console.log(`📋 Schéma détecté: ${detectedSchema}`);

    // ✅ AFFICHER LE FORMULAIRE PAR DÉFAUT POUR TOUS LES SCHÉMAS
    // Sauf pour les schémas website-only et download-only
    if (detectedSchema === 'website-only') {
      // Pour website-only, afficher un bouton pour visiter le site
      setExecutionStatus([{
        action: 'website',
        status: 'form-shown',
        message: 'Cliquez sur le bouton pour visiter notre site web'
      }]);
      
      // Trouver l'action website
      const websiteAction = sortedActions.find(a => a.type === 'website');
      if (websiteAction) {
        setPendingActions([websiteAction]);
      }
    } 
    else if (detectedSchema === 'download-only') {
      // Pour download-only, afficher un bouton pour télécharger la carte
      setExecutionStatus([{
        action: 'download',
        status: 'form-shown',
        message: 'Cliquez sur le bouton pour télécharger notre carte de visite'
      }]);
      
      // Trouver l'action download
      const downloadAction = sortedActions.find(a => a.type === 'download');
      if (downloadAction) {
        setPendingActions([downloadAction]);
      }
    }
    else {
      // Pour tous les autres schémas, afficher le formulaire
      setShowForm(true);
      
      // Stocker les actions non-form pour exécution après soumission
      const nonFormActions = sortedActions.filter(a => a.type !== 'form');
      if (nonFormActions.length > 0) {
        setPendingActions(nonFormActions);
      }
      
      setExecutionStatus([{
        action: 'form',
        status: 'form-shown',
        message: 'Formulaire de contact affiché'
      }]);
    }
    
    setLoading(false);
  };

  const handleManualWebsiteVisit = () => {
    const websiteAction = pendingActions.find(action => action.type === 'website');
    if (websiteAction && websiteAction.url) {
      window.open(websiteAction.url, '_blank');
      
      setExecutionStatus(prev => [...prev, {
        action: 'website',
        status: 'completed',
        message: 'Site web ouvert dans un nouvel onglet'
      }]);
    }
  };

  const handleManualDownload = async () => {
    const downloadAction = pendingActions.find(action => action.type === 'download');
    if (downloadAction) {
      await handleDownloadAction(downloadAction);
    }
  };

  const handleDownloadAction = async (action) => {
    try {
      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'executing',
        message: 'Génération de votre carte de visite...'
      }]);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const link = document.createElement('a');
      link.download = 'carte-visite-numerique.png';
      link.href = '/images/modern-business-card-design-template-42551612346d5b08984f0b61a8044609_screen.jpg';
      link.click();

      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'completed',
        message: 'Carte de visite téléchargée avec succès !'
      }]);

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setExecutionStatus(prev => [...prev, {
        action: 'download',
        status: 'error',
        message: 'Erreur lors du téléchargement'
      }]);
    }
  };

  const executeRemainingActions = async () => {
    if (pendingActions.length === 0) return;

    console.log('🔄 Exécution des actions restantes:', pendingActions);

    for (const action of pendingActions) {
      await new Promise(resolve => setTimeout(resolve, action.delay || 1000));

      if (action.type === 'download') {
        await handleDownloadAction(action);
      } else if (action.type === 'website') {
        window.open(action.url, '_blank');
        setExecutionStatus(prev => [...prev, {
          action: 'website',
          status: 'completed',
          message: 'Site web ouvert dans un nouvel onglet'
        }]);
      }
    }

    setPendingActions([]);
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

      // Exécuter les actions restantes après soumission
      await executeRemainingActions();

    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
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

  const getSchemaName = () => {
    switch (schemaType) {
      case 'website-only': return '🌐 Site Web Direct';
      case 'form-only': return '📝 Formulaire Simple';
      case 'download-only': return '📥 Carte de Visite';
      case 'form-website': return '📝 Formulaire puis Site';
      case 'form-download': return '📝 Contact → Carte';
      case 'complete-funnel': return '🎯 Tunnel Complet';
      case 'custom': return '🔧 Stratégie Personnalisée';
      default: return 'Configuration par défaut';
    }
  };

  const getSchemaSequence = () => {
    if (!businessCard?.cardConfig?.actions) return [];
    
    return businessCard.cardConfig.actions
      .filter(a => a.active)
      .sort((a, b) => (a.order || 1) - (b.order || 1))
      .map(action => {
        switch (action.type) {
          case 'website': return '🌐 Site web';
          case 'form': return '📝 Formulaire contact';
          case 'download': return '📥 Téléchargement carte';
          default: return '❓ Action inconnue';
        }
      });
  };

  if (loading && !showForm) {
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

  if (error && !showForm) {
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

        {/* Affichage du schéma actif */}
        {businessCard?.cardConfig?.actions && (
          <div className="schema-display">
            <h3 className="schema-title">🎯 Stratégie Active : {getSchemaName()}</h3>
            <div className="schema-sequence">
              {getSchemaSequence().map((step, index) => (
                <span key={index} className="schema-step">
                  {step}
                  {index < getSchemaSequence().length - 1 && ' →'}
                </span>
              ))}
            </div>
            
            {/* Affichage de l'URL du site web si configurée */}
            {businessCard.cardConfig.actions.some(a => a.type === 'website' && a.active) && (
              <div className="website-info">
                <div className="website-label">🌐 URL du site web :</div>
                <a 
                  href={businessCard.cardConfig.actions.find(a => a.type === 'website')?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="website-link"
                >
                  {businessCard.cardConfig.actions.find(a => a.type === 'website')?.url || 'https://www.votre-site.com'}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Message de redirection depuis le site web */}
        {hasRedirectedFromWebsite && showForm && (
          <div className="redirection-info">
            <div className="redirection-icon">✅</div>
            <div className="redirection-content">
              <h4>Vous avez été redirigé depuis notre site web</h4>
              <p>Merci de votre intérêt ! Veuillez remplir le formulaire ci-dessous pour nous contacter.</p>
              <div className="website-badge">
                <span className="website-icon">🌐</span>
                <a 
                  href={businessCard?.cardConfig?.actions?.find(a => a.type === 'website')?.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {businessCard?.cardConfig?.actions?.find(a => a.type === 'website')?.url || 'https://www.votre-site.com'}
                </a>
              </div>
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

        {/* Actions manuelles disponibles */}
        {pendingActions.length > 0 && !showForm && !submitted && (
          <div className="actions-manual">
            {pendingActions
              .filter(action => action.type === 'website')
              .map((action, index) => (
                <div key={action.id || index} className="action-manual-item">
                  <button 
                    onClick={handleManualWebsiteVisit}
                    className="action-btn website-btn"
                  >
                    <span className="btn-icon">🌐</span>
                    <span className="btn-text">Visiter notre site web</span>
                  </button>
                </div>
              ))}
            
            {pendingActions
              .filter(action => action.type === 'download')
              .map((action, index) => (
                <div key={action.id || index} className="action-manual-item">
                  <button 
                    onClick={handleManualDownload}
                    className="action-btn download-btn"
                  >
                    <span className="btn-icon">📥</span>
                    <span className="btn-text">Télécharger notre carte de visite</span>
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* Actions en attente après soumission du formulaire */}
        {pendingActions.length > 0 && showForm && !submitted && (
          <div className="pending-actions">
            <h4>🕒 Actions disponibles après soumission :</h4>
            <ul>
              {pendingActions.map((action, index) => (
                <li key={index}>
                  {action.type === 'download' && '📥 Téléchargement de votre carte de visite'}
                  {action.type === 'website' && '🌐 Ouverture de notre site web'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Message de succès */}
        {submitted && (
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <div className="success-content">
              <h4>Merci pour votre inscription !</h4>
              <p>Nous avons bien reçu vos informations et vous recontacterons très prochainement.</p>
              
              {/* Boutons d'actions après soumission */}
              {pendingActions.length > 0 && (
                <div className="actions-manual">
                  {pendingActions
                    .filter(action => action.type === 'website')
                    .map((action, index) => (
                      <div key={action.id || index} className="action-manual-item">
                        <button 
                          onClick={handleManualWebsiteVisit}
                          className="action-btn website-btn"
                        >
                          <span className="btn-icon">🌐</span>
                          <span className="btn-text">Visiter notre site web</span>
                        </button>
                      </div>
                    ))}
                  
                  {pendingActions
                    .filter(action => action.type === 'download')
                    .map((action, index) => (
                      <div key={action.id || index} className="action-manual-item">
                        <button 
                          onClick={handleManualDownload}
                          className="action-btn download-btn"
                        >
                          <span className="btn-icon">📥</span>
                          <span className="btn-text">Télécharger notre carte de visite</span>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
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

        {/* Message général si aucune action configurée */}
        {!businessCard?.cardConfig?.actions?.length && !showForm && (
          <div className="general-message">
            <p>Aucune action spécifique configurée. Contactez-nous directement pour plus d'informations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterClient;