/* ============================================================
   Email: booking request received (optional send on create)
   ============================================================ */

const { esc, emailShell, emailPalette: P } = require('../emailBrand');
const { guestScheduleCardHtml, guestScheduleTextLines } = require('../guestScheduleEmail');

/**
 * @param {{ name: string; email: string; labelCairo: string; labelViewer: string; viewerTimeZone?: string }} booking
 * @param {string} siteUrl
 * @param {string} logoImgSrc
 */
function meetingReceivedHtml(booking, siteUrl, logoImgSrc) {
  const inner = `
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.28;color:${P.strong};font-weight:700;">Meeting request received</h1>
<p style="margin:0 0 22px;color:${P.textSecondary};font-size:15px;line-height:1.68;">
  Hi ${esc(booking.name)}, thank you for choosing a time with Qimora. Your request is <strong style="color:${P.accentSoft};">pending confirmation</strong> from our side.
</p>
${guestScheduleCardHtml({
    labelViewer: booking.labelViewer,
    labelCairo: booking.labelCairo,
    viewerTimeZone: booking.viewerTimeZone
  })}
<p style="margin:0;color:${P.textSecondary};font-size:14px;line-height:1.68;">
  Once we confirm your slot, you’ll receive a follow-up email with a <strong style="color:${P.strong};">Google Meet</strong> link and final details. If anything changes, we’ll reach out at <strong style="color:${P.accentSoft};">${esc(booking.email)}</strong>.
</p>
<p style="margin:24px 0 0;font-size:14px;color:${P.textSecondary};">Best,<br /><strong style="color:${P.strong};">Qimora</strong></p>
`;
  return emailShell(inner, logoImgSrc, siteUrl);
}

function meetingReceivedText(booking) {
  return [
    'Meeting request received — Qimora',
    '',
    `Hi ${booking.name},`,
    '',
    'Thank you for choosing a time with Qimora. Your request is pending confirmation.',
    '',
    ...guestScheduleTextLines({
      labelViewer: booking.labelViewer,
      labelCairo: booking.labelCairo,
      viewerTimeZone: booking.viewerTimeZone
    }),
    '',
    'Once we confirm your slot, you will receive another email with a Google Meet link and final details.',
    '',
    'Best,',
    'Qimora'
  ].join('\n');
}

module.exports = { meetingReceivedHtml, meetingReceivedText };
