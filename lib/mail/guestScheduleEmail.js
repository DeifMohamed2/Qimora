/* ============================================================
   Guest-facing schedule copy — only the guest’s chosen timezone.
   Cairo equivalents stay in the admin dashboard only.
   ============================================================ */

const { esc } = require('./emailBrand');
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
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
  <tr>
    <td colspan="2" style="padding:16px 18px 14px;">
      <p class="eb-accent-label" style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2563eb;">${esc(zoneTitle)}</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;line-height:1.35;">${esc(p.labelViewer)}</p>
      <p style="margin:8px 0 0;font-size:12px;color:#64748b;line-height:1.45;">Shown in the timezone you selected when booking.</p>
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
