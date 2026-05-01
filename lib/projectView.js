/* ============================================================
   Normalize Mongoose Project doc → shape expected by EJS views
   ============================================================ */

/**
 * @param {object} doc — Mongoose doc or plain object
 * @returns {object}
 */
function projectToClient(doc) {
  const p = doc && typeof doc.toObject === 'function'
    ? doc.toObject({ virtuals: true })
    : { ...(doc || {}) };

  p.id = p.slug || p.id;
  if (!p.stats) p.stats = [];
  if (!p.results) p.results = [];
  if (!p.mobileScreenshots) p.mobileScreenshots = [];
  if (!p.technologies) p.technologies = [];
  if (!p.extraImages) p.extraImages = [];
  if (!p.features) p.features = [];
  if (!p.fullFeatures) p.fullFeatures = [];
  if (!p.subProjects) p.subProjects = [];

  if (p.websiteUrl === undefined || p.websiteUrl === null) p.websiteUrl = '';
  if (p.appStoreUrl === undefined || p.appStoreUrl === null) p.appStoreUrl = '';
  if (p.playStoreUrl === undefined || p.playStoreUrl === null) p.playStoreUrl = '';

  return p;
}

module.exports = { projectToClient };
