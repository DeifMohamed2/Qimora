/* ============================================================
   Map TeamMember documents → client shape for team carousel JS
   ============================================================ */

const { TEAM_THEME_PRESETS, THEME_COUNT } = require('./teamThemes');

function clampTheme(n) {
  const t = Number.parseInt(String(n), 10);
  if (Number.isNaN(t) || t < 1) return 1;
  if (t > THEME_COUNT) return THEME_COUNT;
  return t;
}

/** Accept http(s) URLs; allow empty. Bare domains get https:// */
function normalizeSocialUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  if (/^\/\//.test(s)) return `https:${s}`;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(s)) return `https://${s}`;
  return '';
}

/**
 * @param {object} doc — lean TeamMember
 * @param {number} displayIndexZeroBased — order in published list (for "01" label)
 */
function buildTeamCarouselMember(doc, displayIndexZeroBased) {
  const theme = clampTheme(doc.theme);
  const preset = TEAM_THEME_PRESETS[theme - 1];
  const id = doc._id ? String(doc._id) : String(displayIndexZeroBased + 1);
  const number = String(displayIndexZeroBased + 1).padStart(2, '0');

  return {
    id,
    number,
    name: doc.name,
    role: doc.role || '',
    specialty: doc.specialty,
    description: doc.description || '',
    image: doc.image || '',
    years: typeof doc.years === 'number' ? doc.years : Number.parseInt(doc.years, 10) || 0,
    socialGithub: normalizeSocialUrl(doc.socialGithub),
    socialLinkedin: normalizeSocialUrl(doc.socialLinkedin),
    ...preset
  };
}

function teamDocsToCarousel(docsSorted) {
  return docsSorted.map((d, i) => buildTeamCarouselMember(d, i));
}

module.exports = {
  clampTheme,
  normalizeSocialUrl,
  buildTeamCarouselMember,
  teamDocsToCarousel,
  THEME_COUNT
};
