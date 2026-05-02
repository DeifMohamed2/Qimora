# Meetings: email and Google Calendar / Meet

This app can (1) email guests when they book and when an admin confirms, and (2) create a Google Calendar event with a **Google Meet** link when an admin clicks **Confirm** on a pending meeting.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PUBLIC_SITE_URL` | Public site base URL **without** trailing slash (e.g. `https://qimora.com`). Used for the **Qimora logo** in HTML emails (`/images/qimora.png`). |
| `SMTP_HOST` | SMTP server hostname. |
| `SMTP_PORT` | Port (usually `587` or `465`). |
| `SMTP_SECURE` | `true` / `1` for TLS on connect (often used with port `465`). |
| `SMTP_USER` | SMTP username (often same as sender). |
| `SMTP_PASS` | SMTP password or API key (provider-specific). |
| `MAIL_FROM` | From header, e.g. `"Qimora <hello@yourdomain.com>"`. Must match a domain your SMTP provider signs (DKIM) and authorizes (SPF). |
| `MAIL_REPLY_TO` | Optional. Replies go here (e.g. `info@qimora.io`). Recommended so confirmations are not “noreply-only,” which helps legitimacy. |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret. |
| `GOOGLE_REFRESH_TOKEN` | Long-lived refresh token for the calendar owner account (see below). |
| `GOOGLE_CALENDAR_ID` | Optional. Defaults to `primary` (primary calendar of the OAuth user). |
| `GOOGLE_REDIRECT_URI` | Must **exactly** match an authorized redirect URI on the OAuth client (used by `npm run google-auth`). |

Copy from [`.env.example`](../.env.example) into `.env` and fill values.

---

## SMTP credentials (transactional email)

Use a transactional provider for reliable delivery:

1. **SendGrid** — Create API key → use SMTP relay host `smtp.sendgrid.net`, user `apikey`, password = API key, port `587`.
2. **Mailgun** — Domain → SMTP credentials in control panel.
3. **Resend / Postmark / etc.** — Each documents SMTP host, port, and API key as password.

Verify your **sending domain** (SPF/DKIM) so messages are not marked as spam.

**If mail still lands in Spam:** Gmail’s “similar to past spam” message is usually **authentication or reputation**, not HTML wording alone.

1. In your DNS for the domain in `MAIL_FROM`: **SPF** includes your SMTP provider; **DKIM** is enabled in the provider dashboard and matches the sending domain; **DMARC** exists (start with `p=none` and monitor).
2. Send a test from production and open **Show original** in Gmail — look for **SPF/DKIM = PASS** (and DMARC aligned).
3. Use a **transactional provider** (SendGrid, Mailgun, Postmark, Resend, etc.) instead of a generic SMTP forwarder when possible.
4. Keep `PUBLIC_SITE_URL` as your real **https** site so logo fallbacks use a valid URL if inline CID fails.

**Local testing:** Leave `SMTP_HOST` empty → no email is sent; booking and confirm flows still work (admin flash will note when SMTP is off).

---

## Google Workspace: Calendar API and Meet

### One-time Google Cloud setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) → select or create a project.
2. **APIs & Services** → **Library** → enable **Google Calendar API**.
3. **OAuth consent screen** — For Workspace-only use, choose **Internal** (same organization). Add scope: `https://www.googleapis.com/auth/calendar.events`.
4. **Credentials** → **Create credentials** → **OAuth client ID**.
   - Type **Web application** (recommended): add **Authorized redirect URIs** matching `GOOGLE_REDIRECT_URI` (e.g. `http://localhost:3000` for local token generation).
   - Or **Desktop** if you prefer Google’s desktop redirect flow; the redirect in `.env` must still match what is registered.

### Get a refresh token

1. Put `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `.env` (redirect must match the OAuth client).
2. Run:

   ```bash
   npm run google-auth
   ```

3. Open the printed URL, sign in as the **Workspace user** that should own calendar events (e.g. `calendar@company.com`).
4. Approve scopes; paste the authorization code into the terminal.
5. Add the printed `GOOGLE_REFRESH_TOKEN` to `.env`.

If you do not get a `refresh_token`, revoke the app under [Google Account → Third-party access](https://myaccount.google.com/permissions) and run `google-auth` again so Google issues a new refresh token with `prompt=consent`.

### Runtime behavior

- **Admin Confirm (pending only):** If Google env is complete, the app creates a **1-hour** event with **Meet** and stores `googleEventId` and `meetLink` on the booking. If SMTP is configured, a **branded confirmation email** is sent (with Meet link). If the email send fails, the calendar event is removed and the meeting stays **pending**.
- If Google env is **not** set, confirm still works: no Meet link; SMTP email (if configured) uses the template without a Meet button.
- **Cancel / Delete:** If `googleEventId` exists, the app attempts to delete the Google event so the slot and Meet link are freed.

---

## Local testing checklist

- [ ] Booking without SMTP: request succeeds; no “received” email.
- [ ] Booking with SMTP: guest receives “We received your meeting request”.
- [ ] Confirm without Google: meeting becomes confirmed; flash mentions no Meet; email still sends if SMTP on (no Meet link in body).
- [ ] Confirm with Google + SMTP: Meet link in DB and in email; Google Calendar shows the event.
- [ ] Cancel after confirm: Google event removed (check Calendar).

---

## Logo in emails

Emails use an **inline attached logo** (CID) when a raster file exists under `public/images/`, in this order:

1. `qimora.png` (best compatibility in Gmail and Outlook)
2. `qimora.jpg` / `qimora.jpeg`

SVG is **not** embedded — many clients block remote SVG in `<img>`. If no raster file exists, the template falls back to `{PUBLIC_SITE_URL}/images/qimora.png` (must be a real, reachable **https** URL).

Footer links (website, “Visit website”) still use **`PUBLIC_SITE_URL`**, so keep it set to your live or ngrok base URL with **no** trailing slash.
