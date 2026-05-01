#!/usr/bin/env node
/**
 * One-time: print GOOGLE_REFRESH_TOKEN for .env
 * Prerequisites: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env
 * Google Cloud Console → OAuth client (Web or Desktop) → Authorized redirect URI must match GOOGLE_REDIRECT_URI
 *
 *   node scripts/google-auth.js
 */
require('dotenv').config();
const readline = require('readline');
const { google } = require('googleapis');

const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const redirect = (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000').trim();

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES
});

console.log('Sign in as the Workspace user that should own calendar events.\n');
console.log('Open:\n\n' + url + '\n');
console.log(
  'After you approve, Google will send you to your redirect URL.\n' +
    'Paste either the long `code` value only, or the **full address bar URL** (with ?code=...).\n'
);

/** Accept raw code or full redirect URL from browser */
function extractAuthCode(raw) {
  const s = String(raw || '').trim();
  if (!s) return s;
  try {
    const u = new URL(s);
    const c = u.searchParams.get('code');
    if (c) return c;
  } catch {
    /* not a valid absolute URL */
  }
  const m = s.match(/[?&]code=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  return s;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste code or full redirect URL: ', async (input) => {
  rl.close();
  const code = extractAuthCode(input);
  if (!code) {
    console.error('Empty input.');
    process.exit(1);
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (tokens.refresh_token) {
      console.log('\nAdd to .env:\nGOOGLE_REFRESH_TOKEN=' + tokens.refresh_token + '\n');
    } else {
      console.log(
        '\nNo refresh_token returned. Revoke app access at https://myaccount.google.com/permissions then run again, or use prompt=consent (already set).\n'
      );
      if (tokens.access_token) console.log('You got an access_token only — try again after revoking.\n');
    }
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
});
