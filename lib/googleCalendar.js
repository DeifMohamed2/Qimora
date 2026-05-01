/* ============================================================
   Google Calendar — create event with Meet (OAuth refresh token)
   ============================================================ */

const { google } = require('googleapis');

function isGoogleCalendarConfigured() {
  const id = process.env.GOOGLE_CLIENT_ID && String(process.env.GOOGLE_CLIENT_ID).trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET && String(process.env.GOOGLE_CLIENT_SECRET).trim();
  const rt = process.env.GOOGLE_REFRESH_TOKEN && String(process.env.GOOGLE_REFRESH_TOKEN).trim();
  return !!(id && secret && rt);
}

function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID.trim(),
    process.env.GOOGLE_CLIENT_SECRET.trim(),
    (process.env.GOOGLE_REDIRECT_URI || 'http://localhost').trim()
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN.trim()
  });
  return oauth2Client;
}

function buildDescription(doc) {
  const parts = [
    `Guest: ${doc.name}`,
    `Email: ${doc.email}`,
    doc.company ? `Company: ${doc.company}` : null,
    doc.whatsappPhone ? `WhatsApp: ${doc.whatsappPhone}` : null,
    '',
    'Agenda:',
    doc.agenda || ''
  ].filter(Boolean);
  return parts.join('\n');
}

/**
 * @param {import('mongoose').Document | object} doc MeetingBooking
 * @returns {Promise<{ eventId: string; meetLink: string; htmlLink?: string }>}
 */
async function createMeetEventFromBooking(doc) {
  if (!isGoogleCalendarConfigured()) {
    throw new Error('Google Calendar is not configured');
  }
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const start = doc.startsAt instanceof Date ? doc.startsAt : new Date(doc.startsAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const calendarId = (process.env.GOOGLE_CALENDAR_ID || 'primary').trim();

  const guestName = String(doc.name || '').trim();
  const event = {
    summary: `Meeting with ${guestName} — Qimora`,
    description: buildDescription(doc),
    start: { dateTime: start.toISOString(), timeZone: 'Africa/Cairo' },
    end: { dateTime: end.toISOString(), timeZone: 'Africa/Cairo' },
    /* No attendees: we send our own confirmation email; adding the guest as
       an attendee causes Google to deliver its own ICS invite / cancellation
       from an "unknown sender" (the OAuth account), which confuses guests. */
    conferenceData: {
      createRequest: {
        requestId: `qimora-${String(doc._id)}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const res = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: 'none',
    requestBody: event
  });

  const data = res.data;
  let meetLink = data.hangoutLink || '';
  if (!meetLink && data.conferenceData && Array.isArray(data.conferenceData.entryPoints)) {
    const video = data.conferenceData.entryPoints.find((e) => e.entryPointType === 'video');
    if (video && video.uri) meetLink = video.uri;
  }

  return {
    eventId: data.id || '',
    meetLink: meetLink || '',
    htmlLink: data.htmlLink || ''
  };
}

/**
 * @param {string} eventId
 */
async function deleteCalendarEventIfExists(eventId) {
  if (!eventId || !isGoogleCalendarConfigured()) return;
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = (process.env.GOOGLE_CALENDAR_ID || 'primary').trim();
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'none'
    });
  } catch (err) {
    console.error('[googleCalendar] delete failed:', err && err.message ? err.message : err);
  }
}

module.exports = {
  isGoogleCalendarConfigured,
  createMeetEventFromBooking,
  deleteCalendarEventIfExists
};
