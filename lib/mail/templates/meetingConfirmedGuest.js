/* ============================================================
   Email: meeting confirmed (guest) — after admin confirms
   ============================================================ */

const { esc, emailShell, emailPalette: P } = require('../emailBrand');
const { guestScheduleCardHtml, guestScheduleTextLines } = require('../guestScheduleEmail');

/**
 * @param {object} doc MeetingBooking fields
 * @param {{ labelCairo: string; labelViewer: string }} labels
 * @param {string} meetLink
 * @param {string} siteUrl
 * @param {string} logoImgSrc
 */
function meetingConfirmedGuestHtml(doc, labels, meetLink, siteUrl, logoImgSrc) {
  const safeHref = String(meetLink || '').replace(/"/g, '&quot;');

  const meetBlock = meetLink
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
  <tr><td style="padding:0 0 14px;">
    <a href="${safeHref}" class="qim-btn" style="display:inline-block;padding:15px 28px;background:${P.btnFrom};background:linear-gradient(135deg,${P.btnFrom},${P.btnTo});color:#ffffff !important;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;border:1px solid rgba(255,255,255,0.12);box-shadow:0 6px 20px rgba(59,91,255,0.35);">Join Google Meet</a>
  </td></tr>
  <tr><td style="font-size:13px;word-break:break-all;line-height:1.45;color:${P.textMuted};">
    <a href="${safeHref}" style="color:${P.link};text-decoration:underline;">${esc(meetLink)}</a>
  </td></tr>
</table>`
    : `<p style="margin:0 0 24px;padding:16px 18px;background:${P.insetBg};border-radius:12px;border:1px solid ${P.insetBorder};color:${P.textSecondary};font-size:14px;line-height:1.58;">Your meeting is confirmed. If a Meet link was not generated automatically, we will follow up with joining details.</p>`;

  const inner = `
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.28;color:${P.strong};font-weight:700;">Your meeting is confirmed</h1>
<p style="margin:0 0 22px;color:${P.textSecondary};font-size:15px;line-height:1.68;">
  Hi ${esc(doc.name)}, thank you for scheduling with Qimora. Here are your session details${meetLink ? ', including how to join' : ''}.
</p>
${guestScheduleCardHtml({
    labelViewer: labels.labelViewer,
    labelCairo: labels.labelCairo,
    viewerTimeZone: doc.viewerTimeZone
  })}
${meetBlock}
<p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${P.accent};">Agenda</p>
<p style="margin:0 0 22px;padding:18px 20px;background:${P.insetBg};border-radius:14px;border:1px solid ${P.insetBorder};color:${P.textSecondary};font-size:15px;line-height:1.65;white-space:pre-wrap;">${esc(doc.agenda)}</p>
${doc.company ? `<p style="margin:0 0 20px;color:${P.textSecondary};font-size:14px;line-height:1.55;"><strong style="color:${P.strong};">Company:</strong> ${esc(doc.company)}</p>` : ''}
<p style="margin:0;color:${P.textSubtle};font-size:13px;line-height:1.58;">Please join a few minutes early to check audio and video. To reschedule, reply to this email.</p>
<p style="margin:24px 0 0;font-size:14px;color:${P.textSecondary};">Best regards,<br /><strong style="color:${P.strong};">The Qimora team</strong></p>
`;
  return emailShell(inner, logoImgSrc, siteUrl);
}

function meetingConfirmedGuestText(doc, labels, meetLink) {
  const lines = [
    'Your meeting is confirmed — Qimora',
    '',
    `Hi ${doc.name},`,
    '',
    'Your session with Qimora is confirmed.',
    '',
    ...guestScheduleTextLines({
      labelViewer: labels.labelViewer,
      labelCairo: labels.labelCairo,
      viewerTimeZone: doc.viewerTimeZone
    }),
    ''
  ];
  if (meetLink) {
    lines.push('Google Meet:', meetLink, '');
  }
  lines.push('Agenda:', doc.agenda || '', '');
  if (doc.company) lines.push(`Company: ${doc.company}`, '');
  lines.push('Best regards,', 'The Qimora team');
  return lines.join('\n');
}

module.exports = { meetingConfirmedGuestHtml, meetingConfirmedGuestText };
