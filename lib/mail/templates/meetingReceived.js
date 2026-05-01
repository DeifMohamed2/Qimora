/* ============================================================
   Email: booking request received (optional send on create)
   ============================================================ */

const { esc, emailShell } = require('../emailBrand');
const { guestScheduleCardHtml, guestScheduleTextLines } = require('../guestScheduleEmail');

/**
 * @param {{ name: string; email: string; labelCairo: string; labelViewer: string; viewerTimeZone?: string }} booking
 * @param {string} siteUrl
 * @param {string} logoImgSrc
 */
function meetingReceivedHtml(booking, siteUrl, logoImgSrc) {
  const inner = `
<h1 style="margin:0 0 12px;font-size:21px;line-height:1.3;color:#ffffff;font-weight:700;">Meeting request received</h1>
<p style="margin:0 0 20px;color:#b4c4dc;font-size:15px;line-height:1.65;">
  Hi ${esc(booking.name)}, thank you for choosing a time with Qimora. Your request is <strong style="color:#e8f0ff;">pending confirmation</strong> from our side.
</p>
${guestScheduleCardHtml({
    labelViewer: booking.labelViewer,
    labelCairo: booking.labelCairo,
    viewerTimeZone: booking.viewerTimeZone
  })}
<p style="margin:0;color:#b4c4dc;font-size:14px;line-height:1.65;">
  Once we confirm your slot, you’ll receive a follow-up email with a <strong style="color:#fff;">Google Meet</strong> link and final details. If anything changes, we’ll reach out at <strong style="color:#e8f0ff;">${esc(booking.email)}</strong>.
</p>
<p style="margin:22px 0 0;font-size:14px;color:#c5d4ea;">Best,<br /><strong style="color:#fff;">Qimora</strong></p>
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
