/* ============================================================
   Email: meeting confirmed (guest) — after admin confirms
   ============================================================ */

const { esc, emailShell } = require('../emailBrand');
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
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
  <tr><td style="padding:0 0 12px;">
    <a href="${safeHref}" style="display:inline-block;padding:14px 24px;background:linear-gradient(135deg,#3B5BFF,#6B8CFF);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Join Google Meet</a>
  </td></tr>
  <tr><td style="font-size:13px;word-break:break-all;">
    <a href="${safeHref}" style="color:#7eb8ff;text-decoration:underline;">${esc(meetLink)}</a>
  </td></tr>
</table>`
    : `<p style="margin:0 0 22px;padding:14px 16px;background:#1a2230;border-radius:10px;border:1px solid #2a3548;color:#b4c4dc;font-size:14px;line-height:1.55;">Your meeting is confirmed. If a Meet link was not generated automatically, we will follow up with joining details.</p>`;

  const inner = `
<h1 style="margin:0 0 12px;font-size:21px;line-height:1.3;color:#ffffff;font-weight:700;">Your meeting is confirmed</h1>
<p style="margin:0 0 20px;color:#b4c4dc;font-size:15px;line-height:1.65;">
  Hi ${esc(doc.name)}, thank you for scheduling with Qimora. Here are your session details${meetLink ? ', including how to join' : ''}.
</p>
${guestScheduleCardHtml({
    labelViewer: labels.labelViewer,
    labelCairo: labels.labelCairo,
    viewerTimeZone: doc.viewerTimeZone
  })}
${meetBlock}
<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#7eb8ff;">Agenda</p>
<p style="margin:0 0 20px;padding:16px 18px;background:#0f1419;border-radius:12px;border:1px solid #2a3548;color:#dce6f5;font-size:15px;line-height:1.6;white-space:pre-wrap;">${esc(doc.agenda)}</p>
${doc.company ? `<p style="margin:0 0 18px;color:#b4c4dc;font-size:14px;"><strong style="color:#fff;">Company:</strong> ${esc(doc.company)}</p>` : ''}
<p style="margin:0;color:#7a8ca8;font-size:13px;line-height:1.55;">Please join a few minutes early to check audio and video. To reschedule, reply to this email.</p>
<p style="margin:22px 0 0;font-size:14px;color:#c5d4ea;">Best regards,<br /><strong style="color:#fff;">The Qimora team</strong></p>
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
