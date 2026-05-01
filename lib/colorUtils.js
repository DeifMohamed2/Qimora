/* ============================================================
   Hex color helpers for portfolio card CSS variables
   ============================================================ */

/**
 * @param {string} hex — "#RGB", "#RRGGBB"
 * @param {number} alpha — 0–1
 * @returns {string} rgba(...)
 */
function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') {
    return `rgba(255, 159, 67, ${alpha})`;
  }
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) {
    return `rgba(255, 159, 67, ${alpha})`;
  }
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Portfolio card glow (outer blob) */
function accentGlow(hex) {
  return hexToRgba(hex, 0.18);
}

/** Portfolio card dim (tag backgrounds) */
function accentDim(hex) {
  return hexToRgba(hex, 0.07);
}

module.exports = { hexToRgba, accentGlow, accentDim };
