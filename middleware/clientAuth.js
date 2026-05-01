/* ============================================================
   Client portal session guards
   ============================================================ */

function requireClientAuth(req, res, next) {
  if (req.session && req.session.clientId) {
    return next();
  }
  const redirect = encodeURIComponent(req.originalUrl || '/client');
  return res.redirect(`/client/login?redirect=${redirect}`);
}

function redirectIfClientAuthed(req, res, next) {
  if (req.session && req.session.clientId) {
    return res.redirect('/client');
  }
  next();
}

module.exports = { requireClientAuth, redirectIfClientAuthed };
