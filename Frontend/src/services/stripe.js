import { API_ENDPOINTS, apiRequest } from "../config/api";

/**
 * Service pour gérer les paiements via Stripe
 */

// Créer une session de paiement pour une facture
export const createInvoicePaymentSession = async (invoiceId, amount) => {
  try {
    const response = await apiRequest(`${API_ENDPOINTS.BASE_URL}/stripe/create-payment`, {
      method: 'POST',
      body: JSON.stringify({
        invoiceId,
        amount,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/dashboard#devis`
      })
    });
    
    return response;
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    throw error;
  }
};

// Vérifier le statut d'un paiement
export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await apiRequest(`${API_ENDPOINTS.BASE_URL}/stripe/payment-status/${paymentId}`);
    return response;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut de paiement:', error);
    throw error;
  }
};

// Récupérer l'historique des paiements
export const getPaymentHistory = async () => {
  try {
    const response = await apiRequest(`${API_ENDPOINTS.BASE_URL}/stripe/payment-history`);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des paiements:', error);
    throw error;
  }
};

// Créer un client Stripe
export const createStripeCustomer = async (clientData) => {
  try {
    const response = await apiRequest(`${API_ENDPOINTS.BASE_URL}/stripe/create-customer`, {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
    
    return response;
  } catch (error) {
    console.error('Erreur lors de la création du client Stripe:', error);
    throw error;
  }
};

// Mettre à jour les informations de paiement
export const updatePaymentMethod = async () => {
  try {
    const response = await apiRequest(`${API_ENDPOINTS.BASE_URL}/stripe/update-payment-method`, {
      method: 'POST'
    });
    
    return response;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la méthode de paiement:', error);
    throw error;
  }
};