import React, { useState } from 'react';
import { createInvoicePaymentSession } from '../../../services/stripe';
import './PaymentModal.scss';

const PaymentModal = ({ invoice, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { url } = await createInvoicePaymentSession(
        invoice.id, 
        invoice.amount
      );
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Aucune URL de paiement retournée');
      }
    } catch (err) {
      console.error('Erreur lors de la création de la session de paiement:', err);
      setError('Impossible de procéder au paiement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Paiement de facture</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="payment-modal-body">
          <div className="invoice-details">
            <div className="detail-row">
              <span className="detail-label">Numéro de facture:</span>
              <span className="detail-value">{invoice.invoiceNumber}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Client:</span>
              <span className="detail-value">{invoice.clientName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date d'émission:</span>
              <span className="detail-value">
                {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date d'échéance:</span>
              <span className="detail-value">
                {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="detail-row total">
              <span className="detail-label">Montant total:</span>
              <span className="detail-value">{invoice.amount.toFixed(2)} €</span>
            </div>
          </div>
          
          {error && (
            <div className="payment-error">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{error}</span>
            </div>
          )}
          
          <div className="payment-methods">
            <h3>Méthode de paiement</h3>
            <p className="payment-info">
              Vous allez être redirigé vers notre partenaire de paiement sécurisé Stripe pour finaliser votre transaction.
            </p>
            <div className="payment-logos">
              <span className="payment-logo">💳</span>
              <span className="payment-logo">🔒</span>
            </div>
          </div>
        </div>
        
        <div className="payment-modal-footer">
          <button 
            className="cancel-btn" 
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button 
            className="pay-btn" 
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Traitement en cours...
              </>
            ) : (
              <>Payer {invoice.amount.toFixed(2)} €</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;