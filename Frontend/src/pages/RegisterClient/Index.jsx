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
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      trackCardView();
      setLoading(false);
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