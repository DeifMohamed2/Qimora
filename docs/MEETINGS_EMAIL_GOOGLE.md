# Meetings: email and Google Calendar / Meet

This app can (1) email guests when they book and when an admin confirms, and (2) create a Google Calendar event with a **Google Meet** link when an admin clicks **Confirm** on a pending meeting.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PUBLIC_SITE_URL` | Public site base URL **without** trailing slash (e.g. `https://qimora.com`). Used for **links**, **fallback logo URL**, and **Message-ID domain** when not overridden. |
| `MAIL_REPLY_TO` | Optional. Reply-To address for outbound mail (defaults to the email parsed from `MAIL_FROM`). |
| `MAIL_MESSAGE_ID_DOMAIN` | Optional. Domain for `Message-ID` headers (defaults to host from `PUBLIC_SITE_URL`, else domain from `MAIL_FROM`). |
| `SMTP_HOST` | SMTP server hostname. |
| `SMTP_PORT` | Port (usually `587` or `465`). |
| `SMTP_SECURE` | `true` / `1` for TLS on connect (often used with port `465`). |
| `SMTP_USER` | SMTP username (often same as sender). |
| `SMTP_PASS` | SMTP password or API key (provider-specific). |
| `MAIL_FROM` | From header, e.g. `"Qimora <hello@yourdomain.com>"`. |
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

Emails embed the logo as an **inline raster image** (CID) for maximum compatibility. **SVG is not used** — Gmail and others often break inline SVG.

Raster files are checked under `public/images/` in this order:

1. `qimora.png` (recommended)
2. `qimora-email.png`
3. `logo-email.png`

If none exist, the HTML uses `{PUBLIC_SITE_URL}/images/qimora.png` (that URL must return a real PNG/JPEG in production).

Optional env: `MAIL_REPLY_TO`, `MAIL_MESSAGE_ID_DOMAIN` (defaults from `PUBLIC_SITE_URL` / `MAIL_FROM`).

Footer links (website, “Visit website”) still use **`PUBLIC_SITE_URL`**, so keep it set to your live or ngrok base URL with **no** trailing slash.

### If mail lands in spam

DNS for your sending domain must pass **SPF**, **DKIM**, and **DMARC** (your host or Google Workspace admin panel). Google Postmaster Tools can show domain reputation. Transactional copy and a clear **Reply-To** matching your domain help; the app sets **Reply-To** from `MAIL_REPLY_TO` or the address in `MAIL_FROM`.
