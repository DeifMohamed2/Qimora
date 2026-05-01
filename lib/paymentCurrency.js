/* Allowed payment / maintenance cost currencies */
const PAYMENT_CURRENCIES = ['USD', 'EGP'];

function normalizePaymentCurrency(c) {
  const u = String(c || 'USD').trim().toUpperCase();
  return u === 'EGP' ? 'EGP' : 'USD';
}

module.exports = {
  PAYMENT_CURRENCIES,
  normalizePaymentCurrency
};
