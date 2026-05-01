/* ============================================================
   Admin session guards
   ============================================================ */

function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  const redirect = encodeURIComponent(req.originalUrl || '/admin');
  return res.redirect(`/admin/login?redirect=${redirect}`);
}

function redirectIfAuthed(req, res, next) {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }
  next();
}

module.exports = { requireAuth, redirectIfAuthed };
