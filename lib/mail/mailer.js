/* ============================================================
   SMTP mailer — optional; no-ops when not configured
   ============================================================ */

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

let transporter;

const LOGO_EMAIL_CID = 'qimora-logo@brand';

/** Raster types only — Gmail/Outlook often fail to render inline SVG (CID). */
const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);

/** Read logo from disk once and cache as Buffer so we never depend on an external URL. */
let _logoCache = null;
function getRasterLogoBuffer() {
  if (_logoCache) return _logoCache;
  const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');
  const candidates = [
    { file: 'qimora.png', ct: 'image/png', attachName: 'qimora.png' },
    { file: 'qimora-email.png', ct: 'image/png', attachName: 'qimora-email.png' },
    { file: 'logo-email.png', ct: 'image/png', attachName: 'logo-email.png' }
  ];
  for (const c of candidates) {
    if (!RASTER_EXT.has(path.extname(c.file).toLowerCase())) continue;
    const full = path.join(imagesDir, c.file);
    if (fs.existsSync(full)) {
      _logoCache = { buf: fs.readFileSync(full), ct: c.ct, filename: c.attachName };
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

function hostnameForMessageId() {
  const explicit = (process.env.MAIL_MESSAGE_ID_DOMAIN || '').trim();
  if (explicit) return explicit.replace(/^@/, '');
  try {
    const u = new URL(
      getPublicSiteUrl().startsWith('http') ? getPublicSiteUrl() : `https://${getPublicSiteUrl()}`
    );
    if (u.hostname && u.hostname !== 'localhost') return u.hostname;
  } catch (_) {}
  const from = (process.env.MAIL_FROM || '').trim();
  const m = from.match(/<([^>]+)>/);
  const addr = m ? m[1].trim() : from;
  const at = addr.lastIndexOf('@');
  if (at > 0) return addr.slice(at + 1);
  return 'localhost';
}

function getReplyToAddress() {
  const r = (process.env.MAIL_REPLY_TO || '').trim();
  if (r) return r;
  const from = (process.env.MAIL_FROM || '').trim();
  const m = from.match(/<([^>]+)>/);
  return m ? m[1].trim() : from;
}

/**
 * Embed logo as an inline CID (PNG/JPEG/WebP/GIF). SVG is skipped — poor client support.
 * Falls back to an absolute https URL if no raster file exists on disk.
 * @returns {{ attachments: object[]; logoImgSrc: string }}
 */
function getBrandedLogoEmailParts(siteUrl) {
  const logo = getRasterLogoBuffer();
  if (logo) {
    return {
      attachments: [
        {
          filename: logo.filename || 'logo.png',
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
    const replyTo = getReplyToAddress();
    const idHost = hostnameForMessageId();
    const msgId =
      idHost !== 'localhost'
        ? `${Date.now()}.${crypto.randomBytes(6).toString('hex')}@${idHost}`
        : undefined;
    await t.sendMail({
      from: process.env.MAIL_FROM,
      to: opts.to,
      replyTo: replyTo || undefined,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || '',
      attachments: Array.isArray(opts.attachments) ? opts.attachments : undefined,
      messageId: msgId
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
