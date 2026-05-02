/* ============================================================
   Guest-facing schedule copy — only the guest’s chosen timezone.
   Cairo equivalents stay in the admin dashboard only.
   ============================================================ */

const { esc, emailPalette: P } = require('./emailBrand');
const { safeTimeZone } = require('../bookingAvailability');

function humanizeZoneName(iana) {
  const z = safeTimeZone(iana);
  const tail = z.split('/').pop() || z;
  return tail.replace(/_/g, ' ');
}

/**
 * @param {{ labelViewer: string; labelCairo: string; viewerTimeZone?: string }} p
 * labelCairo kept for API compatibility with callers; not shown to guests.
 */
function guestScheduleCardHtml(p) {
  const zoneTitle = humanizeZoneName(p.viewerTimeZone);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;background:${P.insetBg};border-radius:14px;border:1px solid ${P.insetBorder};">
  <tr>
    <td colspan="2" style="padding:18px 20px 16px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${P.textMuted};">${esc(zoneTitle)}</p>
      <p style="margin:0;font-size:19px;font-weight:700;color:${P.text};line-height:1.35;">${esc(p.labelViewer)}</p>
      <p style="margin:10px 0 0;font-size:13px;color:${P.textSubtle};line-height:1.5;">Shown in the timezone you selected when booking.</p>
    </td>
  </tr>
</table>`;
}

/**
 * @param {{ labelViewer: string; labelCairo: string; viewerTimeZone?: string }} p
 * @returns {string[]}
 */
function guestScheduleTextLines(p) {
  const zoneTitle = humanizeZoneName(p.viewerTimeZone);
  return [`When: ${p.labelViewer} (${zoneTitle})`];
}

module.exports = {
  guestScheduleCardHtml,
  guestScheduleTextLines
};
