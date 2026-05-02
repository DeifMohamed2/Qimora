/* ============================================================
   SMTP mailer — optional; no-ops when not configured

   Deliverability (production): Most “Spam” placement is fixed at DNS + provider,
   not in this file. Ensure:
   • MAIL_FROM domain matches SMTP-authenticated domain (SPF/DKIM aligned).
   • DKIM signing enabled at your provider (SendGrid, Mailgun, Resend, etc.).
   • DMARC record (e.g. _dmarc.yourdomain) — start with p=none, monitor, then tighten.
   • Optional MAIL_REPLY_TO (e.g. info@yourdomain) so replies go to a real mailbox.
   ============================================================ */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

let transporter;

const LOGO_EMAIL_CID = 'qimora-logo@brand';

/** Read logo from disk once and cache as Buffer so we never depend on an external URL.
 *  Only raster formats — SVG is blocked or stripped in many clients (e.g. Gmail). */
let _logoCache = null;
function getLogoBuffer() {
  if (_logoCache) return _logoCache;
  const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');
  const candidates = [
    { file: 'qimora.png', ct: 'image/png', attachName: 'qimora-logo.png' },
    { file: 'qimora.jpg', ct: 'image/jpeg', attachName: 'qimora-logo.jpg' },
    { file: 'qimora.jpeg', ct: 'image/jpeg', attachName: 'qimora-logo.jpg' }
  ];
  for (const c of candidates) {
    const full = path.join(imagesDir, c.file);
    if (fs.existsSync(full)) {
      _logoCache = { buf: fs.readFileSync(full), ct: c.ct, attachName: c.attachName };
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

/** Resolve `/images/<file>` for HTML logo src when inline CID is unavailable (no raster on disk). */
function getFallbackLogoPublicFilename() {
  const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');
  const names = ['qimora.png', 'qimora.jpg', 'qimora.jpeg', 'qimora-logo.svg'];
  for (const name of names) {
    if (fs.existsSync(path.join(imagesDir, name))) return name;
  }
  return 'qimora.png';
}

/**
 * Embed logo as an inline CID part sourced from a Buffer.
 * Falls back to an absolute `/images/...` URL if no raster file exists (SVG URL works in some clients; Gmail prefers PNG for `<img>`).
 * @param {string} [siteUrl] ignored; kept for API compatibility
 * @returns {{ attachments: object[]; logoImgSrc: string }}
 */
function getBrandedLogoEmailParts(siteUrl) {
  const logo = getLogoBuffer();
  if (logo) {
    return {
      attachments: [
        {
          /* Named filename helps MTAs attach inline CID reliably (filename:false breaks some relays). */
          filename: logo.attachName || 'qimora-logo.png',
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
    logoImgSrc: `${baseUrl}/images/${getFallbackLogoPublicFilename()}`
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
    const replyTo = (process.env.MAIL_REPLY_TO || '').trim();
    await t.sendMail({
      from: process.env.MAIL_FROM,
      to: opts.to,
      replyTo: replyTo || undefined,
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
