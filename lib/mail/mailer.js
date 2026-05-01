/* ============================================================
   SMTP mailer — optional; no-ops when not configured
   ============================================================ */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

let transporter;

const LOGO_EMAIL_CID = 'qimora-logo@brand';

/** Read logo from disk once and cache as Buffer so we never depend on an external URL. */
let _logoCache = null;
function getLogoBuffer() {
  if (_logoCache) return _logoCache;
  const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');
  const candidates = [
    { file: 'qimora.png', ct: 'image/png' },
    { file: 'qimora-logo.svg', ct: 'image/svg+xml' }
  ];
  for (const c of candidates) {
    const full = path.join(imagesDir, c.file);
    if (fs.existsSync(full)) {
      _logoCache = { buf: fs.readFileSync(full), ct: c.ct };
      return _logoCache;
    }
  }
  return null;
}

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && String(process.env.SMTP_HOST).trim() && process.env.MAIL_FROM);
}

function getPublicSiteUrl() {
  const u = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  return u || 'http://localhost:3000';
}

/**
 * Embed logo as an inline CID part sourced from a Buffer (no filename field).
 * Buffer + no filename → Content-Disposition: inline (no "attachment" chip in Gmail).
 * Falls back to a public URL if the file is missing from disk.
 * @param {string} [siteUrl] ignored; kept for API compatibility
 * @returns {{ attachments: object[]; logoImgSrc: string }}
 */
function getBrandedLogoEmailParts(siteUrl) {
  const logo = getLogoBuffer();
  if (logo) {
    return {
      attachments: [
        {
          filename: false,
          cid: LOGO_EMAIL_CID,
          contentType: logo.ct,
          contentDisposition: 'inline',
          content: logo.buf
        }
      ],
      logoImgSrc: `cid:${LOGO_EMAIL_CID}`
    };
  }
  const baseUrl = (siteUrl || getPublicSiteUrl()).replace(/\/$/, '');
  return {
    attachments: [],
    logoImgSrc: `${baseUrl}/images/qimora.png`
  };
}

function getTransport() {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth:
      process.env.SMTP_USER && String(process.env.SMTP_USER).trim()
        ? {
            user: process.env.SMTP_USER.trim(),
            /* Gmail app passwords are often pasted with spaces between groups */
            pass: (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '')
          }
        : undefined
  });
  return transporter;
}

/**
 * @param {{ to: string; subject: string; html: string; text?: string; attachments?: object[] }} opts
 * @returns {Promise<{ sent: boolean; error?: Error }>}
 */
async function sendMailSafe(opts) {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping send to', opts.to);
    return { sent: false };
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || '',
      attachments: Array.isArray(opts.attachments) ? opts.attachments : undefined
    });
    return { sent: true };
  } catch (err) {
    const detail =
      err && err.response ? JSON.stringify(err.response) : err && err.message ? err.message : String(err);
    console.error('[mail] send failed:', detail);
    return { sent: false, error: err };
  }
}

module.exports = {
  sendMailSafe,
  isSmtpConfigured,
  getPublicSiteUrl,
  getBrandedLogoEmailParts
};
