/* ============================================================
   Shared email brand — header / footer (logo src = URL or cid:)
   Inline defaults = light theme (most clients only apply these).
   Dark theme applied via prefers-color-scheme + Outlook.com [data-ogsc].
   ============================================================ */

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

/**
 * @param {string} logoImgSrc absolute https URL or cid:...
 * @param {string} siteUrl no trailing slash
 */
function brandHeaderHtml(logoImgSrc, siteUrl) {
  const home = `${attrSafe(siteUrl)}/`;
  return `<tr>
  <td class="eb-header-wrap" style="padding:0;margin:0;background:linear-gradient(145deg,#eff6ff 0%,#dbeafe 42%,#ffffff 100%);border-radius:16px 16px 0 0;border:1px solid #cbd5e1;border-bottom:none;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:32px 22px 26px;">
          <a href="${home}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
            <img src="${attrSafe(logoImgSrc)}" width="168" height="52" alt="Qimora" role="img" style="display:block;margin:0 auto 14px;border:0;outline:none;line-height:0;font-size:0;max-width:168px;height:auto;-ms-interpolation-mode:bicubic;" />
          </a>
          <p class="eb-tagline" style="margin:0 0 8px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#475569;">Build once · Scale fast</p>
          <p style="margin:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;">
            <a href="${home}" class="eb-text-link" style="color:#2563eb;text-decoration:none;border-bottom:1px solid rgba(37,99,235,0.35);">qimora.io</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function brandFooterHtml(siteUrl) {
  return `<tr>
  <td class="eb-footer" style="padding:22px 24px 26px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center;">
    <p class="eb-footer-line" style="margin:0 0 8px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;line-height:1.55;">
      <a href="mailto:info@qimora.io" class="eb-footer-link" style="color:#2563eb;text-decoration:none;">info@qimora.io</a>
      <span class="eb-footer-sep" style="color:#94a3b8;"> &nbsp;·&nbsp; </span>
      <a href="https://wa.me/201156012078" class="eb-footer-link" style="color:#2563eb;text-decoration:none;">WhatsApp</a>
    </p>
    <p class="eb-footer-copy" style="margin:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#64748b;line-height:1.5;">
      <a href="${attrSafe(siteUrl)}/" class="eb-footer-muted" style="color:#475569;text-decoration:none;">Visit website</a>
      <span class="eb-footer-sep" style="color:#94a3b8;"> · </span>
      © ${new Date().getFullYear()} Qimora
    </p>
  </td>
</tr>`;
}

function emailStylesBlock() {
  return `<style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media (prefers-color-scheme: dark) {
      .eb-body { background-color: #020617 !important; }
      .eb-outer { background-color: #020617 !important; }
      .eb-header-wrap {
        background: linear-gradient(155deg, #1d4ed8 0%, #1e3a8a 42%, #0f172a 100%) !important;
        border-color: #334155 !important;
      }
      .eb-tagline { color: #cbd5e1 !important; }
      .eb-text-link { color: #93c5fd !important; border-bottom-color: rgba(147,197,253,0.45) !important; }
      .eb-card {
        background-color: #0f172a !important;
        border-left-color: #334155 !important;
        border-right-color: #334155 !important;
        border-bottom-color: #334155 !important;
      }
      .eb-card h1 { color: #f8fafc !important; }
      .eb-card p,
      .eb-card td { color: #cbd5e1 !important; }
      .eb-card strong { color: #f1f5f9 !important; }
      .eb-card a { color: #93c5fd !important; }
      .eb-card table[role="presentation"] { background-color: #020617 !important; border-color: #334155 !important; }
      .eb-accent-label { color: #7dd3fc !important; }
      .eb-footer {
        background-color: #020617 !important;
        border-color: #1e293b !important;
      }
      .eb-footer-line,
      .eb-footer-copy { color: #94a3b8 !important; }
      .eb-footer-link { color: #7dd3fc !important; }
      .eb-footer-muted { color: #94a3b8 !important; }
      .eb-footer-sep { color: #475569 !important; }
    }
    [data-ogsc] .eb-body,
    [data-ogsc] .eb-outer { background-color: #020617 !important; }
    [data-ogsc] .eb-header-wrap {
      background: linear-gradient(155deg, #1d4ed8 0%, #1e3a8a 42%, #0f172a 100%) !important;
      border-color: #334155 !important;
    }
    [data-ogsc] .eb-tagline { color: #cbd5e1 !important; }
    [data-ogsc] .eb-text-link { color: #93c5fd !important; border-bottom-color: rgba(147,197,253,0.45) !important; }
    [data-ogsc] .eb-card { background-color: #0f172a !important; }
    [data-ogsc] .eb-card h1 { color: #f8fafc !important; }
    [data-ogsc] .eb-card p,
    [data-ogsc] .eb-card td { color: #cbd5e1 !important; }
    [data-ogsc] .eb-card strong { color: #f1f5f9 !important; }
    [data-ogsc] .eb-card a { color: #93c5fd !important; }
    [data-ogsc] .eb-card table[role="presentation"] { background-color: #020617 !important; border-color: #334155 !important; }
    [data-ogsc] .eb-accent-label { color: #7dd3fc !important; }
    [data-ogsc] .eb-footer { background-color: #020617 !important; border-color: #1e293b !important; }
    [data-ogsc] .eb-footer-line,
    [data-ogsc] .eb-footer-copy { color: #94a3b8 !important; }
    [data-ogsc] .eb-footer-link { color: #7dd3fc !important; }
    [data-ogsc] .eb-footer-muted { color: #94a3b8 !important; }
    [data-ogsc] .eb-footer-sep { color: #475569 !important; }
  </style>`;
}

/**
 * @param {string} mainInnerHtml content inside the card body (above footer)
 */
function emailShell(mainInnerHtml, logoImgSrc, siteUrl) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Qimora</title>
  ${emailStylesBlock()}
</head>
<body class="eb-body" style="margin:0;padding:0;background-color:#f1f5f9;">
  <table role="presentation" class="eb-outer" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;border-collapse:collapse;">
          ${brandHeaderHtml(logoImgSrc, siteUrl)}
          <tr>
            <td class="eb-card" style="padding:28px 26px 28px;background-color:#ffffff;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
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

module.exports = { esc, attrSafe, brandHeaderHtml, brandFooterHtml, emailShell };
