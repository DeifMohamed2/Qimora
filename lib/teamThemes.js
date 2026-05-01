/* ============================================================
   Team carousel color presets (themes 1–8) — matches legacy
   static members on the landing page; used by admin + home.
   ============================================================ */

const THEME_COUNT = 8;

/** @type {Array<Record<string, string>>} */
const TEAM_THEME_PRESETS = [
  {
    bg: '#0A1428',
    bgGradient: 'linear-gradient(145deg, #0A1428 0%, #0D1A35 100%)',
    accent: '#3B5BFF',
    accentDim: 'rgba(59,91,255,0.12)',
    shape1: 'rgba(59,91,255,0.18)',
    shape2: 'rgba(30,50,120,0.25)',
    bgLight: '#EEF2FF',
    bgGradientLight: 'linear-gradient(145deg, #EEF2FF 0%, #E0E8FF 100%)',
    accentDimLight: 'rgba(59,91,255,0.08)',
    shape1Light: 'rgba(59,91,255,0.12)',
    shape2Light: 'rgba(30,50,120,0.1)'
  },
  {
    bg: '#140E22',
    bgGradient: 'linear-gradient(145deg, #140E22 0%, #1A1230 100%)',
    accent: '#FF9F43',
    accentDim: 'rgba(255,159,67,0.12)',
    shape1: 'rgba(255,159,67,0.18)',
    shape2: 'rgba(120,70,30,0.25)',
    bgLight: '#FFF7ED',
    bgGradientLight: 'linear-gradient(145deg, #FFF7ED 0%, #FFEDD5 100%)',
    accentDimLight: 'rgba(255,159,67,0.1)',
    shape1Light: 'rgba(255,159,67,0.15)',
    shape2Light: 'rgba(120,70,30,0.1)'
  },
  {
    bg: '#071E1E',
    bgGradient: 'linear-gradient(145deg, #071E1E 0%, #0A2A2A 100%)',
    accent: '#5B7DFF',
    accentDim: 'rgba(91,125,255,0.12)',
    shape1: 'rgba(91,125,255,0.18)',
    shape2: 'rgba(30,60,120,0.25)',
    bgLight: '#EFF6FF',
    bgGradientLight: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%)',
    accentDimLight: 'rgba(91,125,255,0.08)',
    shape1Light: 'rgba(91,125,255,0.12)',
    shape2Light: 'rgba(30,60,120,0.1)'
  },
  {
    bg: '#1F0B18',
    bgGradient: 'linear-gradient(145deg, #1F0B18 0%, #2A0F22 100%)',
    accent: '#FFB366',
    accentDim: 'rgba(255,179,102,0.12)',
    shape1: 'rgba(255,179,102,0.18)',
    shape2: 'rgba(140,70,40,0.25)',
    bgLight: '#FFFBEB',
    bgGradientLight: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
    accentDimLight: 'rgba(255,179,102,0.1)',
    shape1Light: 'rgba(255,179,102,0.15)',
    shape2Light: 'rgba(140,70,40,0.1)'
  },
  {
    bg: '#061910',
    bgGradient: 'linear-gradient(145deg, #061910 0%, #092216 100%)',
    accent: '#3B5BFF',
    accentDim: 'rgba(59,91,255,0.12)',
    shape1: 'rgba(59,91,255,0.18)',
    shape2: 'rgba(20,80,60,0.25)',
    bgLight: '#F0FDF4',
    bgGradientLight: 'linear-gradient(145deg, #F0FDF4 0%, #DCFCE7 100%)',
    accentDimLight: 'rgba(59,91,255,0.08)',
    shape1Light: 'rgba(59,91,255,0.12)',
    shape2Light: 'rgba(20,80,60,0.1)'
  },
  {
    bg: '#160F04',
    bgGradient: 'linear-gradient(145deg, #160F04 0%, #1E1608 100%)',
    accent: '#FF9F43',
    accentDim: 'rgba(255,159,67,0.12)',
    shape1: 'rgba(255,159,67,0.18)',
    shape2: 'rgba(120,80,20,0.25)',
    bgLight: '#FFFBEB',
    bgGradientLight: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
    accentDimLight: 'rgba(255,159,67,0.1)',
    shape1Light: 'rgba(255,159,67,0.15)',
    shape2Light: 'rgba(120,80,20,0.1)'
  },
  {
    bg: '#0C0B22',
    bgGradient: 'linear-gradient(145deg, #0C0B22 0%, #130F30 100%)',
    accent: '#6B8CFF',
    accentDim: 'rgba(107,140,255,0.12)',
    shape1: 'rgba(107,140,255,0.18)',
    shape2: 'rgba(50,45,120,0.25)',
    bgLight: '#EEF2FF',
    bgGradientLight: 'linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 100%)',
    accentDimLight: 'rgba(107,140,255,0.08)',
    shape1Light: 'rgba(107,140,255,0.12)',
    shape2Light: 'rgba(50,45,120,0.1)'
  },
  {
    bg: '#051620',
    bgGradient: 'linear-gradient(145deg, #051620 0%, #071E2E 100%)',
    accent: '#FF943D',
    accentDim: 'rgba(255,148,61,0.12)',
    shape1: 'rgba(255,148,61,0.18)',
    shape2: 'rgba(100,70,30,0.25)',
    bgLight: '#FFF7ED',
    bgGradientLight: 'linear-gradient(145deg, #FFF7ED 0%, #FFEDD5 100%)',
    accentDimLight: 'rgba(255,148,61,0.1)',
    shape1Light: 'rgba(255,148,61,0.15)',
    shape2Light: 'rgba(100,70,30,0.1)'
  }
];

module.exports = {
  THEME_COUNT,
  TEAM_THEME_PRESETS
};
