import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionStatus, getTrialDaysRemaining, SUBSCRIPTION_STATUS, createPortalSession } from '../../services/subscription';
import './SubscriptionBanner.scss';

const SubscriptionBanner = () => {
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const status = await getSubscriptionStatus();
        setSubscriptionData(status);
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { url } = await createPortalSession();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
    } finally {
      setIsManagingSubscription(false);
    }
  };

  if (loading || !subscriptionData) {
    return null;
  }

  // Don't show banner for active subscriptions
  if (subscriptionData.status === SUBSCRIPTION_STATUS.ACTIVE) {
    return null;
  }

  // Show trial banner
  if (subscriptionData.status === SUBSCRIPTION_STATUS.TRIAL) {
    const daysRemaining = getTrialDaysRemaining(subscriptionData.trialEndDate);
    
    return (
      <div className="subscription-banner trial">
        <div className="banner-content">
          <div className="banner-icon">🎁</div>
          <div className="banner-message">
            <p>
              <strong>Période d'essai en cours :</strong> {daysRemaining} jour{daysRemaining !== 1 ? 's' : ''} restant{daysRemaining !== 1 ? 's' : ''}
            </p>
            <p className="banner-submessage">
              Abonnez-vous pour continuer à utiliser toutes les fonctionnalités après votre période d'essai
            </p>
          </div>
          <button 
            className="banner-button"
            onClick={handleManageSubscription}
            disabled={isManagingSubscription}
          >
            {isManagingSubscription ? 'Chargement...' : 'S\'abonner maintenant'}
          </button>
        </div>
      </div>
    );
  }

  // Show expired/canceled banner
  return (
    <div className="subscription-banner expired">
      <div className="banner-content">
        <div className="banner-icon">⚠️</div>
        <div className="banner-message">
          <p>
            <strong>Abonnement requis :</strong> Votre accès a expiré
          </p>
          <p className="banner-submessage">
            Renouvelez votre abonnement pour continuer à utiliser toutes les fonctionnalités
          </p>
        </div>
        <button 
          className="banner-button"
          onClick={handleManageSubscription}
          disabled={isManagingSubscription}
        >
          {isManagingSubscription ? 'Chargement...' : 'Renouveler l\'abonnement'}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionBanner;