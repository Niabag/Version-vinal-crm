import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkPaymentStatus } from '../../services/stripe';
import Navbar from '../../components/Navbar';
import './paymentSuccess.scss';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Extraire l'ID de session de l'URL
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        
        if (!sessionId) {
          throw new Error('ID de session manquant');
        }
        
        // Vérifier le statut du paiement
        const paymentData = await checkPaymentStatus(sessionId);
        setPaymentDetails(paymentData);
      } catch (err) {
        console.error('Erreur lors de la vérification du paiement:', err);
        setError(err.message || 'Une erreur est survenue lors de la vérification du paiement');
      } finally {
        setLoading(false);
      }
    };
    
    verifyPayment();
  }, [location]);

  // Compte à rebours pour la redirection
  useEffect(() => {
    if (!loading && !error) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard#devis');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [loading, error, navigate]);

  return (
    <>
      <Navbar />
      <div className="payment-success-page">
        <div className="payment-success-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <h2>Vérification du paiement...</h2>
              <p>Veuillez patienter pendant que nous confirmons votre transaction</p>
            </div>
          ) : error ? (
            <>
              <div className="status-icon error">❌</div>
              <h2>Erreur de paiement</h2>
              <p>{error}</p>
              <button 
                className="return-button"
                onClick={() => navigate('/dashboard#devis')}
              >
                Retour au dashboard
              </button>
            </>
          ) : (
            <>
              <div className="status-icon success">✅</div>
              <h2>Paiement réussi !</h2>
              <p>Votre paiement a été traité avec succès.</p>
              
              {paymentDetails && (
                <div className="payment-details">
                  <div className="detail-row">
                    <span className="detail-label">Montant:</span>
                    <span className="detail-value">{paymentDetails.amount.toFixed(2)} €</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Facture:</span>
                    <span className="detail-value">{paymentDetails.invoiceNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                      {new Date(paymentDetails.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Référence:</span>
                    <span className="detail-value">{paymentDetails.reference}</span>
                  </div>
                </div>
              )}
              
              <p className="redirect-message">
                Redirection vers le dashboard dans {countdown} seconde{countdown !== 1 ? 's' : ''}...
              </p>
              
              <button 
                className="return-button"
                onClick={() => navigate('/dashboard#devis')}
              >
                Retour immédiat au dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;