/* ============================================================
   Cairo (Africa/Cairo) slot grid + month availability for API
   ============================================================ */

const { DateTime } = require('luxon');

const CAIRO_ZONE = 'Africa/Cairo';
/** 1-hour meetings; last start 15:00 Cairo ends 16:00 Cairo */
const SLOT_START_HOURS = [9, 10, 11, 12, 13, 14, 15];

function safeTimeZone(tz) {
  if (!tz || typeof tz !== 'string') return CAIRO_ZONE;
  const trimmed = tz.trim();
  const probe = DateTime.now().setZone(trimmed);
  return probe.isValid ? trimmed : CAIRO_ZONE;
}

function formatInZone(isoOrDate, iana) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: iana,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

/**
 * @param {number} year
 * @param {number} month 1–12
 * @param {string} viewerTimeZone IANA
 * @param {import('mongoose').Model} MeetingBooking mongoose model
 */
async function getMonthAvailability(year, month, viewerTimeZone, MeetingBooking) {
  const tz = safeTimeZone(viewerTimeZone);

  const monthStart = DateTime.fromObject({ year, month, day: 1 }, { zone: CAIRO_ZONE }).startOf('day');
  const monthEnd = monthStart.endOf('month');

  const rangeStartUtc = monthStart.toUTC().toJSDate();
  const rangeEndUtc = monthEnd.endOf('day').toUTC().toJSDate();

  const bookings = await MeetingBooking.find({
    startsAt: { $gte: rangeStartUtc, $lte: rangeEndUtc },
    status: { $in: ['pending', 'confirmed'] }
  })
    .select('startsAt')
    .lean();

  const taken = new Set(bookings.map((b) => new Date(b.startsAt).getTime()));
  const nowCairo = DateTime.now().setZone(CAIRO_ZONE);

  const days = [];
  let cursor = monthStart;
  while (cursor <= monthEnd) {
    const isWeekend = cursor.weekday === 6 || cursor.weekday === 7;
    const dateStr = cursor.toISODate();
    const dayObj = { date: dateStr, isWeekend, slots: [] };

    if (!isWeekend) {
      const slots = [];
      for (const h of SLOT_START_HOURS) {
        const slotStart = cursor.set({ hour: h, minute: 0, second: 0, millisecond: 0 });
        const startsAtJs = slotStart.toUTC().toJSDate();
        const key = startsAtJs.getTime();
        const booked = taken.has(key);
        const isPast = slotStart <= nowCairo;
        const available = !booked && !isPast;
        slots.push({
          startsAt: startsAtJs.toISOString(),
          available,
          labelInViewerTz: formatInZone(startsAtJs, tz),
          labelCairo: formatInZone(startsAtJs, CAIRO_ZONE)
        });
      }
      const freeCount = slots.filter((s) => s.available).length;
      dayObj.fullyBooked = freeCount === 0;
      dayObj.partial = freeCount > 0 && freeCount < slots.length;
      dayObj.slots = slots;
    } else {
      dayObj.fullyBooked = false;
      dayObj.partial = false;
    }

    days.push(dayObj);
    cursor = cursor.plus({ days: 1 });
  }

  return { year, month, viewerTimeZone: tz, days };
}

/**
 * Validate that startsAt is exactly one allowed Cairo weekday slot and in the future.
 * @param {string|Date} startsAt
 * @returns {{ ok: true, date: Date } | { ok: false, error: string }}
 */
function validateBookableStartsAt(startsAt) {
  let d;
  if (startsAt instanceof Date) {
    d = startsAt;
  } else if (typeof startsAt === 'string') {
    const parsed = DateTime.fromISO(startsAt, { zone: 'utc' });
    if (!parsed.isValid) {
      return { ok: false, error: 'Invalid start time.' };
    }
    d = parsed.toJSDate();
  } else {
    return { ok: false, error: 'Start time is required.' };
  }

  const cairo = DateTime.fromJSDate(d, { zone: 'utc' }).setZone(CAIRO_ZONE);
  if (!cairo.isValid) {
    return { ok: false, error: 'Invalid start time.' };
  }

  if (cairo.minute !== 0 || cairo.second !== 0 || cairo.millisecond !== 0) {
    return { ok: false, error: 'Slot must align to a full hour in Cairo.' };
  }

  if (cairo.weekday === 6 || cairo.weekday === 7) {
    return { ok: false, error: 'Meetings are not available on weekends.' };
  }

  if (!SLOT_START_HOURS.includes(cairo.hour)) {
    return { ok: false, error: 'Outside bookable hours (9:00 AM – 4:00 PM Cairo).' };
  }

  const slotStartCairo = cairo;
  const nowCairo = DateTime.now().setZone(CAIRO_ZONE);
  if (slotStartCairo <= nowCairo) {
    return { ok: false, error: 'This time slot is no longer available.' };
  }

  return { ok: true, date: d };
}

module.exports = {
  CAIRO_ZONE,
  SLOT_START_HOURS,
  safeTimeZone,
  formatInZone,
  getMonthAvailability,
  validateBookableStartsAt
};
