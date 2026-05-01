/**
 * Display title for a payment line — prefers `title`, falls back to legacy `phase`.
 */
function paymentLineTitle(doc) {
  if (!doc || typeof doc !== 'object') return '';
  const t = doc.title != null ? String(doc.title).trim() : '';
  if (t) return t;
  return doc.phase != null ? String(doc.phase).trim() : '';
}

module.exports = { paymentLineTitle };
