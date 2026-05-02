/* ============================================================
   Email: contact form — professional confirmation to the submitter
   ============================================================ */

const { esc, emailShell } = require('../emailBrand');

/**
 * @param {{ name: string; email: string; company?: string; subjectLine: string; message: string }} data
 * @param {string} siteUrl no trailing slash
 * @param {string} logoImgSrc absolute URL or cid:...
 */
function contactReceivedHtml(data, siteUrl, logoImgSrc) {
  const companyRows =
    data.company && String(data.company).trim()
      ? `<tr>
  <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;width:132px;vertical-align:top;">Company</td>
  <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:15px;line-height:1.45;">${esc(String(data.company).trim())}</td>
</tr>`
      : '';

  const inner = `
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;letter-spacing:-0.02em;">Thank you for reaching out</h1>
<p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.65;">
  Hi ${esc(data.name)},<br /><br />
  We’ve received your message and added it to our inbox. A member of the team will review it and reply as soon as possible — typically within <strong style="color:#0f172a;">one business day</strong> (often much sooner during business hours).
</p>
<p class="eb-accent-label" style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2563eb;">Your submission</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
  <tr>
    <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;width:132px;vertical-align:top;">Topic</td>
    <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:15px;line-height:1.45;">${esc(data.subjectLine)}</td>
  </tr>
  ${companyRows}
  <tr>
    <td colspan="2" style="padding:16px 16px 14px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Message</td>
  </tr>
  <tr>
    <td colspan="2" style="padding:0 16px 18px;color:#334155;font-size:15px;line-height:1.65;white-space:pre-wrap;">${esc(data.message)}</td>
  </tr>
</table>
<p style="margin:0 0 14px;color:#475569;font-size:14px;line-height:1.65;">
  <strong style="color:#0f172a;">What you can do next</strong><br />
  You can simply reply to this email to add context, or reach us on <a href="https://wa.me/201156012078" style="color:#2563eb;text-decoration:none;">WhatsApp</a> if your request is urgent.
</p>
<p style="margin:0;color:#64748b;font-size:13px;line-height:1.55;">
  If our reply lands in Promotions or another folder, moving it to your primary inbox helps future messages arrive in one place.
</p>
<p style="margin:22px 0 0;font-size:14px;color:#475569;">Warm regards,<br /><strong style="color:#0f172a;">The Qimora team</strong></p>
`;

  return emailShell(inner, logoImgSrc, siteUrl);
}

function contactReceivedText(data) {
  return [
    'Thank you for reaching out — Qimora',
    '',
    `Hi ${data.name},`,
    '',
    "We've received your message and will review it shortly. You can expect a response within one business day (often sooner during business hours).",
    '',
    '--- Your submission ---',
    `Topic: ${data.subjectLine}`,
    data.company ? `Company: ${data.company}` : '',
    '',
    'Message:',
    data.message || '',
    '',
    'Reply to this email to add details, or WhatsApp: https://wa.me/201156012078',
    '',
    'Warm regards,',
    'The Qimora team'
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = { contactReceivedHtml, contactReceivedText };
