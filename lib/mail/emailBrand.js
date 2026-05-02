/* ============================================================
   Shared email brand — Qimora dark UI (aligned with web portal)
   Dark-mode safe: meta color-scheme, bgcolor fallbacks, contrast.
   ============================================================ */

/**
 * Palette tokens — use for inline styles (email clients strip classes often).
 * Deeper contrast than before so Gmail/Apple dark mode stays readable.
 */
const emailPalette = {
  pageBg: '#070a0f',
  cardBg: '#101824',
  insetBg: '#0b1018',
  insetBorder: '#264060',
  border: '#2a3f5c',
  borderSoft: '#243044',
  /** Email header — matches brand banner (dark navy, pill logo, slate tagline) */
  headerBg: '#0b1120',
  headerPillBg: '#0f172a',
  headerPillBorder: '#334155',
  taglineColor: '#94a3b8',
  footerBg: '#0c121a',
  text: '#f2f6fc',
  textSecondary: '#c8d8ee',
  textMuted: '#9eb4d0',
  textSubtle: '#7a93ad',
  accent: '#7eb8ff',
  accentSoft: '#a8d0ff',
  strong: '#ffffff',
  link: '#9ebfff',
  linkUnderline: '#7eb8ff',
  successTint: '#1a2638',
  btnFrom: '#3b5bff',
  btnTo: '#5a7dff'
};

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Safe for HTML attribute value (href, src) */
function attrSafe(s) {
  return String(s || '').replace(/"/g, '&quot;');
}

const P = emailPalette;

/**
 * Head styles: declare dark UI so clients don’t invert blindly; stabilize Gmail/Apple.
 */
function emailDarkModeHead() {
  const bg = P.pageBg;
  const fg = P.text;
  return `
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: dark; }
    html, body { margin:0 !important; padding:0 !important; width:100% !important; }
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      background-color: ${bg} !important;
      color: ${fg} !important;
    }
    table { border-collapse: collapse !important; }
    img { border: 0; outline: none; text-decoration: none; }
    /* Inline link colors stay explicit per template (avoids breaking CTA buttons). */
    /* Apple Mail: stop blue auto-links from breaking contrast */
    a[x-apple-data-detectors] {
      color: inherit !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    .qim-outer { background-color: ${bg} !important; }
    .qim-card { background-color: ${P.cardBg} !important; }
    .qim-footer { background-color: ${P.footerBg} !important; }
    .qim-header { background-color: ${P.headerBg} !important; }
    a.qim-btn, a.qim-btn:link, a.qim-btn:visited {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    @media (prefers-color-scheme: dark) {
      .qim-outer { background-color: ${bg} !important; }
      .qim-card { background-color: ${P.cardBg} !important; }
      .qim-header { background-color: ${P.headerBg} !important; }
    }
  </style>`;
}

/**
 * @param {string} logoImgSrc absolute https URL or cid:...
 * @param {string} siteUrl no trailing slash
 */
function brandHeaderHtml(logoImgSrc, siteUrl) {
  const hb = P.headerBg;
  return `<tr>
  <td class="qim-header" bgcolor="${hb}" style="padding:0;margin:0;background:${hb};border-radius:18px 18px 0 0;border:1px solid ${P.borderSoft};border-bottom:none;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${hb}" style="background:${hb};">
      <tr>
        <td align="center" style="padding:36px 28px 28px;">
          <a href="${attrSafe(siteUrl)}/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;" title="Qimora">
            <span style="display:inline-block;padding:14px 24px;background:${P.headerPillBg};border-radius:999px;border:1px solid ${P.headerPillBorder};">
              <img src="${attrSafe(logoImgSrc)}" width="168" height="34" alt="Qimora" style="display:block;margin:0 auto;border:0;outline:none;height:34px;width:168px;max-width:100%;-ms-interpolation-mode:bicubic;" />
            </span>
          </a>
          <p style="margin:18px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${P.taglineColor};line-height:1.4;">Build once · Scale fast</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function brandFooterHtml(siteUrl) {
  return `<tr>
  <td class="qim-footer" bgcolor="${P.footerBg}" style="padding:22px 26px 28px;background:${P.footerBg};border:1px solid ${P.border};border-top:none;border-radius:0 0 18px 18px;text-align:center;">
    <p style="margin:0 0 10px;font-size:12px;color:${P.textMuted};line-height:1.55;">
      <a href="mailto:info@qimora.io" style="color:${P.link};text-decoration:none;">info@qimora.io</a>
      <span style="color:${P.textSubtle};"> &nbsp;·&nbsp; </span>
      <a href="https://wa.me/201156012078" style="color:${P.link};text-decoration:none;">WhatsApp</a>
    </p>
    <p style="margin:0;font-size:11px;color:${P.textSubtle};">
      <a href="${attrSafe(siteUrl)}/" style="color:${P.textMuted};text-decoration:none;">Visit website</a>
      <span style="color:${P.textSubtle};"> · </span>
      © ${new Date().getFullYear()} Qimora
    </p>
  </td>
</tr>`;
}

/**
 * @param {string} mainInnerHtml content inside the body card (above footer)
 */
function emailShell(mainInnerHtml, logoImgSrc, siteUrl) {
  const bg = P.pageBg;
  const card = P.cardBg;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Qimora</title>
  ${emailDarkModeHead()}
</head>
<body class="qim-outer" bgcolor="${bg}" style="margin:0;padding:0;background:${bg};background-color:${bg};color:${P.text};">
  <table role="presentation" class="qim-outer" width="100%" cellspacing="0" cellpadding="0" bgcolor="${bg}" style="background:${bg};background-color:${bg};padding:32px 14px;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="100%" style="max-width:600px;border-collapse:separate;border-spacing:0;">
          ${brandHeaderHtml(logoImgSrc, siteUrl)}
          <tr>
            <td class="qim-card" bgcolor="${card}" style="padding:30px 28px 32px;background:${card};border-left:1px solid ${P.border};border-right:1px solid ${P.border};border-bottom:1px solid ${P.borderSoft};">
              ${mainInnerHtml}
            </td>
          </tr>
          ${brandFooterHtml(siteUrl)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  esc,
  attrSafe,
  emailPalette,
  brandHeaderHtml,
  brandFooterHtml,
  emailShell
};
