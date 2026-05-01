/* ============================================================
   Shared email brand — header / footer (logo src = URL or cid:)
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
  return `<tr>
  <td style="padding:0;margin:0;background:linear-gradient(145deg,#2a3f7a 0%,#1e2d52 38%,#161d27 100%);border-radius:16px 16px 0 0;border:1px solid #33486e;border-bottom:none;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding:32px 22px 24px;">
          <a href="${attrSafe(siteUrl)}/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
            <img src="${attrSafe(logoImgSrc)}" width="168" height="52" alt="Qimora" role="presentation" style="display:block;margin:0 auto 12px;border:0;outline:none;line-height:0;font-size:0;max-width:168px;max-height:52px;width:auto;height:auto;-ms-interpolation-mode:bicubic;" />
          </a>
          <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#b8cff5;">Build once · Scale fast</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function brandFooterHtml(siteUrl) {
  return `<tr>
  <td style="padding:20px 24px 26px;background:#121820;border:1px solid #2d3f5c;border-top:none;border-radius:0 0 16px 16px;text-align:center;">
    <p style="margin:0 0 8px;font-size:12px;color:#7a8ca8;line-height:1.5;">
      <a href="mailto:info@qimora.io" style="color:#8eb4ff;text-decoration:none;">info@qimora.io</a>
      <span style="color:#4a5a72;"> &nbsp;·&nbsp; </span>
      <a href="https://wa.me/201156012078" style="color:#8eb4ff;text-decoration:none;">WhatsApp</a>
    </p>
    <p style="margin:0;font-size:11px;color:#5c6b82;">
      <a href="${attrSafe(siteUrl)}/" style="color:#6b86c4;text-decoration:none;">Visit website</a>
      <span style="color:#4a5a72;"> · </span>
      © ${new Date().getFullYear()} Qimora
    </p>
  </td>
</tr>`;
}

/**
 * @param {string} mainInnerHtml content inside the white card body (above footer)
 */
function emailShell(mainInnerHtml, logoImgSrc, siteUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Qimora</title>
</head>
<body style="margin:0;padding:0;background:#0a0e14;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0e14;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;border-collapse:collapse;">
          ${brandHeaderHtml(logoImgSrc, siteUrl)}
          <tr>
            <td style="padding:28px 26px 28px;background:#161d27;border-left:1px solid #2d3f5c;border-right:1px solid #2d3f5c;border-bottom:1px solid #2d3f5c;">
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
