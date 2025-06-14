/**
 * Calcule le montant TTC d'un devis ou d'une facture
 * @param {Object} document - Le devis ou la facture contenant un tableau d'articles
 * @returns {number} - Le montant TTC calculé
 */
export const calculateTTC = (document) => {
  if (!document || !Array.isArray(document.articles)) return 0;

  return document.articles.reduce((total, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    const tva = parseFloat(article.tvaRate || 0);

    if (isNaN(price) || isNaN(qty) || isNaN(tva)) return total;

    const ht = price * qty;
    return total + ht + (ht * tva / 100);
  }, 0);
};

/**
 * Calcule le montant HT d'un devis ou d'une facture
 * @param {Object} document - Le devis ou la facture contenant un tableau d'articles
 * @returns {number} - Le montant HT calculé
 */
export const calculateHT = (document) => {
  if (!document || !Array.isArray(document.articles)) return 0;

  return document.articles.reduce((total, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);

    if (isNaN(price) || isNaN(qty)) return total;

    return total + (price * qty);
  }, 0);
};

/**
 * Calcule le montant de TVA d'un devis ou d'une facture
 * @param {Object} document - Le devis ou la facture contenant un tableau d'articles
 * @returns {number} - Le montant de TVA calculé
 */
export const calculateTVA = (document) => {
  if (!document || !Array.isArray(document.articles)) return 0;

  return document.articles.reduce((total, article) => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    const tva = parseFloat(article.tvaRate || 0);

    if (isNaN(price) || isNaN(qty) || isNaN(tva)) return total;

    const ht = price * qty;
    return total + (ht * tva / 100);
  }, 0);
};

/**
 * Calcule les montants par taux de TVA
 * @param {Object} document - Le devis ou la facture contenant un tableau d'articles
 * @returns {Object} - Un objet avec les montants HT et TVA par taux
 */
export const calculateTVABreakdown = (document) => {
  if (!document || !Array.isArray(document.articles)) return {};

  const breakdown = {};

  document.articles.forEach(article => {
    const price = parseFloat(article.unitPrice || 0);
    const qty = parseFloat(article.quantity || 0);
    const tvaRate = parseFloat(article.tvaRate || 0);

    if (isNaN(price) || isNaN(qty) || isNaN(tvaRate)) return;

    const ht = price * qty;
    const tva = ht * (tvaRate / 100);

    // Convertir le taux en string pour l'utiliser comme clé
    const rateKey = tvaRate.toString();

    if (!breakdown[rateKey]) {
      breakdown[rateKey] = { ht: 0, tva: 0 };
    }

    breakdown[rateKey].ht += ht;
    breakdown[rateKey].tva += tva;
  });

  return breakdown;
};