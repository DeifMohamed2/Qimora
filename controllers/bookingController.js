/* ============================================================
   Public booking API
   ============================================================ */

const MeetingBooking = require('../models/MeetingBooking');
const {
  getMonthAvailability,
  validateBookableStartsAt,
  safeTimeZone,
  CAIRO_ZONE,
  formatInZone
} = require('../lib/bookingAvailability');
const { sendMailSafe, isSmtpConfigured, getPublicSiteUrl, getBrandedLogoEmailParts } = require('../lib/mail/mailer');
const { meetingReceivedHtml, meetingReceivedText } = require('../lib/mail/templates/meetingReceived');

function parseYearMonth(req) {
  const year = Number.parseInt(req.query.year, 10);
  const month = Number.parseInt(req.query.month, 10);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return { error: 'Invalid year.' };
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return { error: 'Invalid month (use 1–12).' };
  }
  return { year, month };
}

exports.getAvailability = async (req, res) => {
  try {
    const ym = parseYearMonth(req);
    if (ym.error) {
      return res.status(400).json({ success: false, message: ym.error });
    }
    const viewerTimeZone = safeTimeZone(req.query.timeZone || CAIRO_ZONE);
    const payload = await getMonthAvailability(ym.year, ym.month, viewerTimeZone, MeetingBooking);
    res.json({ success: true, ...payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

/** GET /api/booking/check-email — active meeting for this email? */
exports.checkEmail = async (req, res) => {
  try {
    const email = String(req.query.email || '')
      .trim()
      .toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email required.' });
    }
    const tz = safeTimeZone(req.query.timeZone || CAIRO_ZONE);
    const doc = await MeetingBooking.findOne({
      email,
      status: { $in: ['pending', 'confirmed'] }
    })
      .select('startsAt')
      .lean();
    if (!doc) {
      return res.json({ success: true, hasActive: false });
    }
    const startsAt = doc.startsAt;
    return res.json({
      success: true,
      hasActive: true,
      existing: {
        startsAt: new Date(startsAt).toISOString(),
        labelCairo: formatInZone(startsAt, CAIRO_ZONE),
        labelViewer: formatInZone(startsAt, tz)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

function buildBookingDoc(body) {
  const {
    startsAt,
    viewerTimeZone,
    name,
    email,
    agenda,
    company,
    whatsappPhone
  } = body || {};
  const v = validateBookableStartsAt(startsAt);
  if (!v.ok) {
    return { error: v.error };
  }
  const tz = safeTimeZone(viewerTimeZone);
  const doc = {
    name: String(name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    agenda: String(agenda || '').trim(),
    company: company != null ? String(company).trim() : '',
    whatsappPhone: whatsappPhone != null ? String(whatsappPhone).trim() : '',
    viewerTimeZone: tz,
    startsAt: v.date,
    status: 'pending'
  };
  if (!doc.name) {
    return { error: 'Name is required.' };
  }
  if (!doc.email || !/^\S+@\S+\.\S+$/.test(doc.email)) {
    return { error: 'Valid email is required.' };
  }
  if (!doc.agenda) {
    return { error: 'Meeting agenda is required.' };
  }
  return { doc, date: v.date, tz };
}

exports.createBooking = async (req, res) => {
  try {
    const built = buildBookingDoc(req.body);
    if (built.error) {
      return res.status(400).json({ success: false, message: built.error });
    }
    const { doc, date, tz } = built;

    const sameEmailActive = await MeetingBooking.findOne({
      email: doc.email,
      status: { $in: ['pending', 'confirmed'] }
    })
      .select('startsAt')
      .lean();
    if (sameEmailActive) {
      const existingMs = new Date(sameEmailActive.startsAt).getTime();
      if (existingMs === date.getTime()) {
        return res.status(200).json({
          success: true,
          message: 'You already have this time booked.',
          already: true,
          booking: {
            startsAt: date.toISOString(),
            labelInViewerTz: formatInZone(date, tz),
            labelCairo: formatInZone(date, CAIRO_ZONE)
          }
        });
      }
      return res.status(409).json({
        success: false,
        code: 'EMAIL_HAS_ACTIVE_BOOKING',
        message:
          'This email already has an active meeting. Reschedule to a new time, or use a different email address.',
        existing: {
          startsAt: new Date(sameEmailActive.startsAt).toISOString(),
          labelCairo: formatInZone(sameEmailActive.startsAt, CAIRO_ZONE),
          labelViewer: formatInZone(sameEmailActive.startsAt, tz)
        }
      });
    }

    const activeClash = await MeetingBooking.findOne({
      startsAt: date,
      status: { $in: ['pending', 'confirmed'] }
    })
      .select('_id')
      .lean();
    if (activeClash) {
      return res.status(409).json({
        success: false,
        message: 'That time slot was just taken. Please choose another.'
      });
    }

    await MeetingBooking.create(doc);

    if (isSmtpConfigured()) {
      const siteUrl = getPublicSiteUrl();
      const logo = getBrandedLogoEmailParts(siteUrl);
      const booking = {
        name: doc.name,
        email: doc.email,
        labelCairo: formatInZone(date, CAIRO_ZONE),
        labelViewer: formatInZone(date, tz),
        viewerTimeZone: doc.viewerTimeZone || tz
      };
      sendMailSafe({
        to: doc.email,
        subject: 'Meeting request received — Qimora',
        html: meetingReceivedHtml(booking, siteUrl, logo.logoImgSrc),
        text: meetingReceivedText(booking),
        attachments: logo.attachments
      }).catch((err) => console.error('[booking] meeting received email:', err && err.message));
    }

    res.status(201).json({
      success: true,
      message: 'Your meeting is booked.',
      booking: {
        startsAt: date.toISOString(),
        labelInViewerTz: formatInZone(date, tz),
        labelCairo: formatInZone(date, CAIRO_ZONE)
      }
    });
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message || 'Validation failed' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

/** POST /api/booking/reschedule — move active booking to a new slot (requires previousStartsAt proof) */
exports.rescheduleBooking = async (req, res) => {
  try {
    const built = buildBookingDoc(req.body);
    if (built.error) {
      return res.status(400).json({ success: false, message: built.error });
    }
    const { doc, date, tz } = built;

    const previousStartsAt = req.body && req.body.previousStartsAt;
    if (!previousStartsAt || typeof previousStartsAt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing previous appointment reference. Please check your email again.'
      });
    }
    let prevMs;
    try {
      prevMs = new Date(previousStartsAt).getTime();
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid previous appointment time.' });
    }
    if (Number.isNaN(prevMs)) {
      return res.status(400).json({ success: false, message: 'Invalid previous appointment time.' });
    }

    const existing = await MeetingBooking.findOne({
      email: doc.email,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'No active meeting found for this email. You can make a new booking instead.'
      });
    }
    const existingMs = new Date(existing.startsAt).getTime();
    if (existingMs !== prevMs) {
      return res.status(409).json({
        success: false,
        code: 'STALE_BOOKING_REFERENCE',
        message:
          'Your meeting may have changed. Re-enter your email to refresh, then choose a new time.'
      });
    }

    if (existingMs === date.getTime()) {
      existing.name = doc.name;
      existing.agenda = doc.agenda;
      existing.company = doc.company;
      existing.whatsappPhone = doc.whatsappPhone;
      existing.viewerTimeZone = tz;
      await existing.save();
      return res.json({
        success: true,
        message: 'Your appointment details were updated.',
        rescheduled: false,
        booking: {
          startsAt: date.toISOString(),
          labelInViewerTz: formatInZone(date, tz),
          labelCairo: formatInZone(date, CAIRO_ZONE)
        }
      });
    }

    const slotTaken = await MeetingBooking.findOne({
      startsAt: date,
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: existing._id }
    })
      .select('_id')
      .lean();
    if (slotTaken) {
      return res.status(409).json({
        success: false,
        message: 'That new time slot is no longer available. Please pick another.'
      });
    }

    existing.startsAt = date;
    existing.name = doc.name;
    existing.agenda = doc.agenda;
    existing.company = doc.company;
    existing.whatsappPhone = doc.whatsappPhone;
    existing.viewerTimeZone = tz;
    existing.status = 'pending';
    existing.googleEventId = undefined;
    existing.meetLink = undefined;
    existing.guestNotifiedAt = undefined;
    await existing.save();

    res.json({
      success: true,
      message: 'Your meeting was moved to the new time.',
      rescheduled: true,
      booking: {
        startsAt: date.toISOString(),
        labelInViewerTz: formatInZone(date, tz),
        labelCairo: formatInZone(date, CAIRO_ZONE)
      }
    });
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message || 'Validation failed' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
