/**
 * Read flash message once and remove it from the session immediately so it
 * cannot reappear on refresh (express-session persists after handler runs).
 */
function takeFlash(req) {
  if (!req.session) return undefined;
  const flash = req.session.flash;
  delete req.session.flash;
  return flash;
}

module.exports = { takeFlash };
