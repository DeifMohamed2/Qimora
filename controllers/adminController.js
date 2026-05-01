/* ============================================================
   Admin dashboard — auth & project CRUD
   ============================================================ */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');

const Admin = require('../models/Admin');
const Project = require('../models/Project');
const Contact = require('../models/Contact');
const MeetingBooking = require('../models/MeetingBooking');
const TeamMember = require('../models/TeamMember');
const Client = require('../models/Client');
const AccessEntry = require('../models/AccessEntry');
const Payment = require('../models/Payment');
const { normalizePaymentCurrency } = require('../lib/paymentCurrency');
const { paymentLineTitle } = require('../lib/paymentLineTitle');
const { takeFlash } = require('../lib/flash');
const MaintenanceLog = require('../models/MaintenanceLog');
const { TEAM_THEME_PRESETS, THEME_COUNT } = require('../lib/teamThemes');
const { clampTheme, normalizeSocialUrl } = require('../lib/teamMemberView');
const { formatInZone, CAIRO_ZONE } = require('../lib/bookingAvailability');
const { DateTime } = require('luxon');
const { sendMailSafe, isSmtpConfigured, getPublicSiteUrl, getBrandedLogoEmailParts } = require('../lib/mail/mailer');
const {
  meetingConfirmedGuestHtml,
  meetingConfirmedGuestText
} = require('../lib/mail/templates/meetingConfirmedGuest');
const {
  isGoogleCalendarConfigured,
  createMeetEventFromBooking,
  deleteCalendarEventIfExists
} = require('../lib/googleCalendar');
const adminFormOptions = require('../lib/adminFormOptions');
const { TECHNOLOGY_OPTIONS } = require('../lib/technologyOptions');

const ACCESS_CATEGORIES = AccessEntry.ACCESS_CATEGORIES;

function projectFormViewData(locals) {
  return {
    projectCategories: adminFormOptions.PROJECT_CATEGORIES,
    lucideIconOptions: adminFormOptions.LUCIDE_ICON_OPTIONS,
    technologyOptions: TECHNOLOGY_OPTIONS,
    durationOptions: adminFormOptions.DURATION_OPTIONS,
    teamSizeOptions: adminFormOptions.TEAM_SIZE_OPTIONS,
    ...locals
  };
}

async function getInboxNavCounts() {
  try {
    const [unreadMessageCount, upcomingMeetingCount, teamMemberCount, clientCount] = await Promise.all([
      Contact.countDocuments({ read: { $ne: true } }),
      MeetingBooking.countDocuments({
        startsAt: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      }),
      TeamMember.countDocuments(),
      Client.countDocuments()
    ]);
    return { unreadMessageCount, upcomingMeetingCount, teamMemberCount, clientCount };
  } catch (err) {
    console.error('Nav counts:', err.message);
    return { unreadMessageCount: 0, upcomingMeetingCount: 0, teamMemberCount: 0, clientCount: 0 };
  }
}

function escapeRegex(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redirectInbox(res, basePath, returnQuery) {
  const q = String(returnQuery || '').trim();
  res.redirect(q ? `${basePath}?${q}` : basePath);
}

function escapeHtmlAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function buildMeetingMongoFilter(req) {
  const parts = [];
  const statusFilter = String(req.query.status || 'all').trim();
  const q = String(req.query.q || '').trim();
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();

  if (statusFilter === 'upcoming') {
    parts.push({ startsAt: { $gte: new Date() } });
    parts.push({ status: { $in: ['pending', 'confirmed'] } });
  } else if (statusFilter === 'past') {
    parts.push({ startsAt: { $lt: new Date() } });
  } else if (['pending', 'confirmed', 'completed', 'cancelled'].includes(statusFilter)) {
    parts.push({ status: statusFilter });
  }

  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    parts.push({
      startsAt: {
        $gte: DateTime.fromISO(from, { zone: CAIRO_ZONE }).startOf('day').toUTC().toJSDate()
      }
    });
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    parts.push({
      startsAt: {
        $lte: DateTime.fromISO(to, { zone: CAIRO_ZONE }).endOf('day').toUTC().toJSDate()
      }
    });
  }

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    parts.push({
      $or: [{ name: rx }, { email: rx }, { agenda: rx }, { company: rx }, { whatsappPhone: rx }]
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

function buildMessageMongoFilter(req) {
  const parts = [];
  const readFilter = String(req.query.read || 'all').trim();
  const q = String(req.query.q || '').trim();
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();

  if (readFilter === 'unread') parts.push({ read: { $ne: true } });
  else if (readFilter === 'read') parts.push({ read: true });

  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    parts.push({
      createdAt: {
        $gte: DateTime.fromISO(from, { zone: CAIRO_ZONE }).startOf('day').toUTC().toJSDate()
      }
    });
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    parts.push({
      createdAt: {
        $lte: DateTime.fromISO(to, { zone: CAIRO_ZONE }).endOf('day').toUTC().toJSDate()
      }
    });
  }

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    parts.push({
      $or: [
        { name: rx },
        { email: rx },
        { message: rx },
        { company: rx },
        { subject: rx },
        { customSubject: rx },
        { whatsappPhone: rx }
      ]
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

function groupMeetingsByCairoDay(items) {
  const groups = new Map();
  for (const m of items) {
    const iso = DateTime.fromJSDate(new Date(m.startsAt), { zone: 'utc' })
      .setZone(CAIRO_ZONE)
      .toISODate();
    if (!groups.has(iso)) groups.set(iso, []);
    groups.get(iso).push(m);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([isoDate, meetings]) => {
      const d = DateTime.fromISO(isoDate, { zone: CAIRO_ZONE });
      return {
        isoDate,
        headline: d.toFormat('cccc, d LLLL yyyy'),
        meetings: meetings.sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        )
      };
    });
}

function groupContactsByCairoDay(items) {
  const groups = new Map();
  for (const c of items) {
    const iso = DateTime.fromJSDate(new Date(c.createdAt), { zone: 'utc' })
      .setZone(CAIRO_ZONE)
      .toISODate();
    if (!groups.has(iso)) groups.set(iso, []);
    groups.get(iso).push(c);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([isoDate, contacts]) => {
      const d = DateTime.fromISO(isoDate, { zone: CAIRO_ZONE });
      return {
        isoDate,
        headline: d.toFormat('cccc, d LLLL yyyy'),
        contacts: contacts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      };
    });
}

const UPLOAD_REL = '/uploads/projects';
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'projects');

function ensureUploadDir() {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error('Upload dir:', e.message);
  }
}

ensureUploadDir();

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').slice(0, 12) || '.bin';
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = /^image\//.test(file.mimetype || '');
    if (!ok) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

const uploadFields = upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'screenshots', maxCount: 10 },
  { name: 'extraWebImages', maxCount: 12 }
]);

const TEAM_UPLOAD_REL = '/uploads/team';
const TEAM_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'team');

function ensureTeamUploadDir() {
  try {
    fs.mkdirSync(TEAM_UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error('Team upload dir:', e.message);
  }
}

const teamStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureTeamUploadDir();
    cb(null, TEAM_UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').slice(0, 12) || '.bin';
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  }
});

const teamUpload = multer({
  storage: teamStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = /^image\//.test(file.mimetype || '');
    if (!ok) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  }
});

const teamPhotoMiddleware = teamUpload.single('photo');

const PAYMENT_UPLOAD_REL = '/uploads/payments';
const PAYMENT_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'payments');

function ensurePaymentUploadDir() {
  try {
    fs.mkdirSync(PAYMENT_UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.error('Payment upload dir:', e.message);
  }
}

const paymentStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensurePaymentUploadDir();
    cb(null, PAYMENT_UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').slice(0, 12) || '.bin';
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  }
});

const paymentUpload = multer({
  storage: paymentStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = /^image\//.test(file.mimetype || '');
    if (!ok) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  }
});

const paymentPhotosMiddleware = paymentUpload.array('photos', 12);

function maybeUnlinkPaymentPhoto(imagePath) {
  if (!imagePath || !String(imagePath).startsWith(PAYMENT_UPLOAD_REL)) return;
  const rel = String(imagePath).replace(/^\/+/, '');
  const full = path.join(__dirname, '..', 'public', rel);
  fs.unlink(full, () => {});
}

function buildPaymentPayload(req, existingPhotos) {
  const b = req.body;
  const date = new Date(String(b.date || '').trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid payment date.');
  }
  let photos = Array.isArray(existingPhotos) ? [...existingPhotos] : [];
  if (req.files && req.files.length) {
    for (const f of req.files) {
      photos.push(`${PAYMENT_UPLOAD_REL}/${f.filename}`);
    }
  }
  return {
    date,
    description: String(b.description || '').trim(),
    title: String(b.title != null && String(b.title).trim() !== '' ? b.title : b.phase || '').trim(),
    amount: Number.parseFloat(String(b.amount)) || 0,
    currency: normalizePaymentCurrency(b.currency),
    status: String(b.status || 'paid') === 'pending' ? 'pending' : 'paid',
    photos
  };
}

function buildTeamMemberPayload(req) {
  const b = req.body;
  let image = String(b.image || '').trim();
  if (req.file) {
    image = `${TEAM_UPLOAD_REL}/${req.file.filename}`;
  } else if (image && !/^https?:\/\//i.test(image) && !image.startsWith('/')) {
    image = `/${image.replace(/^\/+/, '')}`;
  }
  return {
    name: String(b.name || '').trim(),
    role: String(b.role || '').trim(),
    specialty: String(b.specialty || '').trim(),
    years: Math.min(99, Math.max(0, Number.parseInt(String(b.years), 10) || 0)),
    description: String(b.description || '').trim(),
    image,
    theme: clampTheme(b.theme),
    socialGithub: normalizeSocialUrl(b.socialGithub),
    socialLinkedin: normalizeSocialUrl(b.socialLinkedin),
    order: Number.parseInt(b.order, 10) || 0,
    isPublished: parseBool(b.isPublished)
  };
}

function teamFormLocals(extra) {
  return {
    teamThemes: TEAM_THEME_PRESETS.map((preset, i) => ({
      id: i + 1,
      label: `Theme ${i + 1}`,
      accent: preset.accent,
      bgGradient: preset.bgGradient
    })),
    themeCount: THEME_COUNT,
    ...extra
  };
}

function maybeUnlinkTeamImage(imagePath) {
  if (!imagePath || !String(imagePath).startsWith(TEAM_UPLOAD_REL)) return;
  const rel = String(imagePath).replace(/^\/+/, '');
  const full = path.join(__dirname, '..', 'public', rel);
  fs.unlink(full, () => {});
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function safeJsonParse(s, fallback) {
  try {
    if (s === undefined || s === null || s === '') return fallback;
    if (typeof s === 'object') return s;
    return JSON.parse(String(s));
  } catch {
    return fallback;
  }
}

function parseBool(v) {
  const x = Array.isArray(v) ? v[v.length - 1] : v;
  return x === true || x === 'true' || x === '1' || x === 'on';
}

function normalizeTechList(items) {
  const seen = new Set();
  const out = [];
  for (const t of items) {
    const v = String(t || '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function parseTechnologies(body) {
  const raw = body.technologies;
  let fromPrimary = [];
  if (raw !== undefined && raw !== null && raw !== '') {
    if (Array.isArray(raw)) {
      fromPrimary = raw.flatMap((x) =>
        String(x)
          .split(/[,|\n]/)
          .map((t) => t.trim())
          .filter(Boolean)
      );
    } else {
      fromPrimary = String(raw)
        .split(/[,|\n]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }
  const extra = String(body.technologiesOther || '')
    .split(/[,|\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
  return normalizeTechList([...fromPrimary, ...extra]);
}

function mergeScreenshots(body, files) {
  const existing = safeJsonParse(body.mobileScreenshotsJson, []);
  const list = Array.isArray(existing) ? existing : [];
  const cleaned = list
    .filter((x) => x && x.url)
    .map((x) => ({ url: String(x.url).trim(), caption: String(x.caption || '').trim() }));

  const shotFiles = (files && files.screenshots) || [];

  let capLines = [];
  const rawCap = body.mobileNewCaptions;
  if (Array.isArray(rawCap)) {
    capLines = rawCap.map((s) => String(s || '').trim());
  } else if (rawCap != null && rawCap !== '') {
    capLines = [String(rawCap).trim()];
  } else {
    capLines = String(body.screenshotCaptionsNew || '')
      .split(/\r?\n/)
      .map((s) => s.trim());
  }

  shotFiles.forEach((f, i) => {
    cleaned.push({
      url: `${UPLOAD_REL}/${f.filename}`,
      caption: capLines[i] || `Screenshot ${cleaned.length + 1}`
    });
  });

  return cleaned;
}

function mergeExtraImages(body, files) {
  const existing = safeJsonParse(body.extraImagesJson, []);
  const urls = Array.isArray(existing)
    ? existing.map((u) => String(u || '').trim()).filter(Boolean)
    : [];

  const imgs = (files && files.extraWebImages) || [];
  imgs.forEach((f) => {
    urls.push(`${UPLOAD_REL}/${f.filename}`);
  });
  return urls;
}

function testimonialFromBody(body) {
  return {
    quote: String(body.testimonialQuote || '').trim(),
    name: String(body.testimonialName || '').trim(),
    role: String(body.testimonialRole || '').trim(),
    avatar: String(body.testimonialAvatar || '').trim()
  };
}

async function buildProjectPayload(req) {
  const b = req.body;
  const files = req.files || {};

  let slug = String(b.slug || '').trim().toLowerCase();
  if (!slug) slug = slugify(b.title);
  if (!slug) throw new Error('Title or slug is required');

  let image = String(b.image || '').trim();
  if (files.poster && files.poster[0]) {
    image = `${UPLOAD_REL}/${files.poster[0].filename}`;
  } else if (image && !/^https?:\/\//i.test(image) && !image.startsWith('/')) {
    image = `/${image.replace(/^\/+/, '')}`;
  }

  const fullFeaturesRaw = safeJsonParse(b.fullFeaturesJson, []);
  const fullFeatures = (Array.isArray(fullFeaturesRaw) ? fullFeaturesRaw : [])
    .filter((f) => f && typeof f === 'object')
    .map((f) => ({
      icon: String(f.icon || 'star').trim(),
      title: String(f.title || '').trim(),
      desc: String(f.desc || '').trim()
    }));

  const subProjectsRaw = safeJsonParse(b.subProjectsJson, []);
  const subProjects = (Array.isArray(subProjectsRaw) ? subProjectsRaw : [])
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      name: String(s.name || '').trim(),
      icon: String(s.icon || 'layers').trim(),
      desc: String(s.desc || '').trim(),
      fullDesc: String(s.fullDesc || s.desc || '').trim(),
      features: Array.isArray(s.features) ? s.features.map(String) : []
    }));

  const statsRaw = safeJsonParse(b.statsJson, []);
  const stats = (Array.isArray(statsRaw) ? statsRaw : [])
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      label: String(s.label || '').trim(),
      value: String(s.value || '').trim()
    }));

  const resultsRaw = safeJsonParse(b.resultsJson, []);
  const results = (Array.isArray(resultsRaw) ? resultsRaw : [])
    .filter((r) => r && typeof r === 'object')
    .map((r) => ({
      value: String(r.value || '').trim(),
      label: String(r.label || '').trim(),
      desc: String(r.desc || '').trim()
    }));

  const payload = {
    slug,
    title: String(b.title || '').trim(),
    category: String(b.category || '').trim(),
    description: String(b.description || '').trim(),
    image,
    color: String(b.color || '#3B5BFF').trim(),
    icon: String(b.icon || 'layers').trim(),
    industry: String(b.industry || '').trim(),
    duration: String(b.duration || '').trim(),
    teamSize: String(b.teamSize || '').trim(),
    platforms: String(b.platforms || '').trim(),
    cardYear: String(b.cardYear || new Date().getFullYear()).trim(),
    technologies: parseTechnologies(b),

    hasWebsite: parseBool(b.hasWebsite),
    websiteUrl: String(b.websiteUrl || '').trim(),
    hasMobileApp: parseBool(b.hasMobileApp),
    appStoreUrl: String(b.appStoreUrl || '').trim(),
    playStoreUrl: String(b.playStoreUrl || '').trim(),
    hasAI: parseBool(b.hasAI),

    isEcosystem: parseBool(b.isEcosystem),

    ecosystemSectionLabel: String(b.ecosystemSectionLabel || '').trim(),
    ecosystemTitle: String(b.ecosystemTitle || '').trim(),
    ecosystemSubtitle: String(b.ecosystemSubtitle || '').trim(),

    overview: String(b.overview || '').trim(),
    challenge: String(b.challenge || '').trim(),
    techRationale: String(b.techRationale || '').trim(),

    features: safeJsonParse(b.featuresJson, []).filter(Boolean).map(String),
    fullFeatures,
    subProjects,

    stats,
    results,

    mobileScreenshots: mergeScreenshots(b, files),
    testimonial: testimonialFromBody(b),

    extraImages: mergeExtraImages(b, files),

    isPublished: parseBool(b.isPublished),
    order: Number.parseInt(b.order, 10) || 0
  };

  return payload;
}

// ---------- Auth ----------

exports.getLogin = (req, res) => {
  let redirectTo = '/admin';
  const raw = req.query.redirect;
  if (raw && typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
    redirectTo = raw;
  }
  res.render('admin/login', {
    layout: false,
    title: 'Admin — Sign in',
    error: null,
    redirectTo,
    email: ''
  });
};

exports.postLogin = async (req, res) => {
  let redirectTo = '/admin';
  const raw = req.body.redirect;
  if (raw && typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
    redirectTo = raw;
  }
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  try {
    const admin = await Admin.findOne({ email }).select('+passwordHash');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).render('admin/login', {
        layout: false,
        title: 'Admin — Sign in',
        error: 'Invalid email or password.',
        redirectTo,
        email
      });
    }
    req.session.adminId = admin._id.toString();
    req.session.adminEmail = admin.email;
    /* Persist session before redirect — required with async stores (MongoStore) */
    return req.session.save((saveErr) => {
      if (saveErr) {
        console.error('Session save failed:', saveErr);
        return res.status(500).render('admin/login', {
          layout: false,
          title: 'Admin — Sign in',
          error: 'Could not start session. Check MongoDB and try again.',
          redirectTo,
          email
        });
      }
      return res.redirect(redirectTo);
    });
  } catch (err) {
    console.error(err);
    return res.status(500).render('admin/login', {
      layout: false,
      title: 'Admin — Sign in',
      error: 'Server error. Try again.',
      redirectTo,
      email
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy:', err);
    res.clearCookie('qimora.sid', { path: '/' });
    res.redirect('/admin/login');
  });
};

// ---------- Dashboard ----------

exports.dashboard = async (req, res) => {
  try {
    const [projects, inboxNav, recentMessages, upcomingMeetings] = await Promise.all([
      Project.find().sort({ order: 1, title: 1 }).lean(),
      getInboxNavCounts(),
      Contact.find().sort({ createdAt: -1 }).limit(5).lean(),
      MeetingBooking.find({ startsAt: { $gte: new Date() }, status: { $in: ['pending', 'confirmed'] } })
        .sort({ startsAt: 1 })
        .limit(5)
        .lean()
    ]);
    const projectCount = projects.length;
    const recentMessagesFmt = recentMessages.map((c) => ({
      ...c,
      preview: String(c.message || '').slice(0, 120)
    }));
    const upcomingMeetingsFmt = upcomingMeetings.map((m) => ({
      ...m,
      labelCairo: formatInZone(m.startsAt, CAIRO_ZONE),
      labelViewer: formatInZone(m.startsAt, m.viewerTimeZone || CAIRO_ZONE)
    }));
    const flash = takeFlash(req);
    res.render('admin/dashboard', {
      layout: false,
      title: 'Projects — Admin',
      projects,
      projectCount,
      recentMessages: recentMessagesFmt,
      upcomingMeetings: upcomingMeetingsFmt,
      flash,
      adminEmail: req.session.adminEmail,
      currentPage: 'projects',
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load projects');
  }
};

exports.newProject = async (req, res) => {
  const projectCount = await Project.countDocuments();
  const inboxNav = await getInboxNavCounts();
  const blank = {
    slug: '',
    title: '',
    category: '',
    description: '',
    image: '',
    extraImages: [],
    color: '#3B5BFF',
    icon: 'layers',
    industry: '',
    duration: '',
    teamSize: '',
    platforms: '',
    cardYear: String(new Date().getFullYear()),
    technologies: [],
    hasWebsite: false,
    websiteUrl: '',
    hasMobileApp: false,
    appStoreUrl: '',
    playStoreUrl: '',
    hasAI: false,
    isEcosystem: false,
    ecosystemSectionLabel: '',
    ecosystemTitle: '',
    ecosystemSubtitle: '',
    overview: '',
    challenge: '',
    techRationale: '',
    features: [],
    fullFeatures: [],
    subProjects: [],
    stats: [],
    results: [],
    mobileScreenshots: [],
    testimonial: { quote: '', name: '', role: '', avatar: '' },
    isPublished: true,
    order: projectCount
  };
  res.render(
    'admin/project-form',
    projectFormViewData({
      layout: false,
      title: 'New Project',
      project: blank,
      isEdit: false,
      error: null,
      projectCount,
      adminEmail: req.session.adminEmail,
      ...inboxNav
    })
  );
};

exports.editProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Not found');
    }
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).send('Not found');
    const projectCount = await Project.countDocuments();
    const inboxNav = await getInboxNavCounts();
    res.render(
      'admin/project-form',
      projectFormViewData({
        layout: false,
        title: `Edit — ${project.title}`,
        project,
        isEdit: true,
        error: null,
        projectCount,
        adminEmail: req.session.adminEmail,
        ...inboxNav
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.createProject = async (req, res) => {
  try {
    const payload = await buildProjectPayload(req);
    await Project.create(payload);
    req.session.flash = { type: 'ok', msg: 'Project created.' };
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    let count = 0;
    try {
      count = await Project.countDocuments();
    } catch (e) {
      /* ignore */
    }
    const blank = {
      slug: req.body.slug,
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      image: req.body.image,
      extraImages: safeJsonParse(req.body.extraImagesJson, []),
      color: req.body.color || '#3B5BFF',
      icon: req.body.icon,
      industry: req.body.industry,
      duration: req.body.duration,
      teamSize: req.body.teamSize,
      platforms: req.body.platforms,
      cardYear: req.body.cardYear,
      technologies: parseTechnologies(req.body),
      hasWebsite: parseBool(req.body.hasWebsite),
      websiteUrl: req.body.websiteUrl,
      hasMobileApp: parseBool(req.body.hasMobileApp),
      appStoreUrl: req.body.appStoreUrl,
      playStoreUrl: req.body.playStoreUrl,
      hasAI: parseBool(req.body.hasAI),
      isEcosystem: parseBool(req.body.isEcosystem),
      ecosystemSectionLabel: req.body.ecosystemSectionLabel,
      ecosystemTitle: req.body.ecosystemTitle,
      ecosystemSubtitle: req.body.ecosystemSubtitle,
      overview: req.body.overview,
      challenge: req.body.challenge,
      techRationale: req.body.techRationale,
      features: safeJsonParse(req.body.featuresJson, []),
      fullFeatures: safeJsonParse(req.body.fullFeaturesJson, []),
      subProjects: safeJsonParse(req.body.subProjectsJson, []),
      stats: safeJsonParse(req.body.statsJson, []),
      results: safeJsonParse(req.body.resultsJson, []),
      mobileScreenshots: safeJsonParse(req.body.mobileScreenshotsJson, []),
      testimonial: testimonialFromBody(req.body),
      isPublished: parseBool(req.body.isPublished),
      order: Number.parseInt(req.body.order, 10) || count
    };
    const inboxNav = await getInboxNavCounts();
    res.status(400).render(
      'admin/project-form',
      projectFormViewData({
        layout: false,
        title: 'New Project',
        project: blank,
        isEdit: false,
        error: err.code === 11000 ? 'That slug is already in use.' : err.message || 'Could not save',
        projectCount: count,
        adminEmail: req.session.adminEmail,
        ...inboxNav
      })
    );
  }
};

exports.updateProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Not found');
    }

    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).send('Not found');

    const files = req.files || {};
    const payload = await buildProjectPayload(req);
    const noNewPoster = !(files.poster && files.poster[0]);
    if (noNewPoster && (!payload.image || !String(payload.image).trim())) {
      payload.image = existing.image || '';
    }
    Object.assign(existing, payload);
    await existing.save();

    req.session.flash = { type: 'ok', msg: 'Project updated.' };
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    let project = null;
    let projectCount = 0;
    try {
      project = await Project.findById(req.params.id).lean();
      projectCount = await Project.countDocuments();
    } catch (e) {
      /* ignore */
    }
    const inboxNav = await getInboxNavCounts();
    res.status(400).render(
      'admin/project-form',
      projectFormViewData({
        layout: false,
        title: 'Edit Project',
        project: project || {},
        isEdit: true,
        error: err.message || 'Could not save',
        projectCount,
        adminEmail: req.session.adminEmail,
        ...inboxNav
      })
    );
  }
};

exports.deleteProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Not found');
    }
    await Project.findByIdAndDelete(req.params.id);
    req.session.flash = { type: 'ok', msg: 'Project deleted.' };
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Delete failed.' };
    res.redirect('/admin');
  }
};

exports.togglePublish = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Not found');
    }
    const proj = await Project.findById(req.params.id);
    if (!proj) return res.status(404).send('Not found');
    proj.isPublished = !proj.isPublished;
    await proj.save();
    req.session.flash = { type: 'ok', msg: proj.isPublished ? 'Published.' : 'Unpublished.' };
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
};

exports.listMessages = async (req, res) => {
  try {
    const filter = buildMessageMongoFilter(req);
    const filterQuery = new URLSearchParams(req.query).toString();
    const [contacts, inboxNav, projectCount] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
      getInboxNavCounts(),
      Project.countDocuments()
    ]);
    const messageDays = groupContactsByCairoDay(contacts);
    const flash = takeFlash(req);
    res.render('admin/messages', {
      layout: false,
      title: 'Messages — Admin',
      contacts,
      messageDays,
      filters: {
        q: String(req.query.q || ''),
        read: String(req.query.read || 'all'),
        from: String(req.query.from || ''),
        to: String(req.query.to || '')
      },
      filterQuery,
      filterQueryEscaped: escapeHtmlAttr(filterQuery || ''),
      currentPage: 'messages',
      projectCount,
      adminEmail: req.session.adminEmail,
      flash,
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load messages');
  }
};

exports.markMessageRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return redirectInbox(res, '/admin/messages', req.body.returnQuery);
    }
    await Contact.findByIdAndUpdate(req.params.id, { $set: { read: true } });
    req.session.flash = { type: 'ok', msg: 'Marked as read.' };
    redirectInbox(res, '/admin/messages', req.body.returnQuery);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Could not update message.' };
    redirectInbox(res, '/admin/messages', req.body.returnQuery);
  }
};

exports.messageDelete = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return redirectInbox(res, '/admin/messages', req.body.returnQuery);
    }
    await Contact.findByIdAndDelete(req.params.id);
    req.session.flash = { type: 'ok', msg: 'Message deleted.' };
    redirectInbox(res, '/admin/messages', req.body.returnQuery);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Could not delete message.' };
    redirectInbox(res, '/admin/messages', req.body.returnQuery);
  }
};

exports.messagesBulk = async (req, res) => {
  const returnQuery = String(req.body.returnQuery || '').trim();
  const action = String(req.body.bulkAction || '').trim();
  const ids = parseBulkMeetingIds(req.body);
  try {
    if (!['read', 'delete'].includes(action)) {
      req.session.flash = { type: 'err', msg: 'Unknown bulk action.' };
      return redirectInbox(res, '/admin/messages', returnQuery);
    }
    if (!ids.length) {
      req.session.flash = { type: 'err', msg: 'Select at least one message.' };
      return redirectInbox(res, '/admin/messages', returnQuery);
    }
    const oidList = ids.map((id) => new mongoose.Types.ObjectId(id));
    if (action === 'delete') {
      const r = await Contact.deleteMany({ _id: { $in: oidList } });
      req.session.flash = {
        type: 'ok',
        msg: r.deletedCount === 1 ? '1 message deleted.' : `${r.deletedCount} messages deleted.`
      };
    } else {
      const r = await Contact.updateMany({ _id: { $in: oidList } }, { $set: { read: true } });
      if (r.modifiedCount === 0) {
        req.session.flash = {
          type: 'ok',
          msg: 'No changes — selected message(s) were already marked read.'
        };
      } else {
        req.session.flash = {
          type: 'ok',
          msg:
            r.modifiedCount === 1
              ? '1 message marked as read.'
              : `${r.modifiedCount} messages marked as read.`
        };
      }
    }
    redirectInbox(res, '/admin/messages', returnQuery);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Bulk action failed.' };
    redirectInbox(res, '/admin/messages', returnQuery);
  }
};

exports.listMeetings = async (req, res) => {
  try {
    const filter = buildMeetingMongoFilter(req);
    const filterQuery = new URLSearchParams(req.query).toString();
    const [meetings, inboxNav, projectCount] = await Promise.all([
      MeetingBooking.find(filter).sort({ startsAt: -1 }).limit(250).lean(),
      getInboxNavCounts(),
      Project.countDocuments()
    ]);
    const nowMs = Date.now();
    const meetingsFmt = meetings.map((m) => ({
      ...m,
      labelCairo: formatInZone(m.startsAt, CAIRO_ZONE),
      labelViewer: formatInZone(m.startsAt, m.viewerTimeZone || CAIRO_ZONE),
      isPast: new Date(m.startsAt).getTime() < nowMs,
      isTerminal: m.status === 'cancelled' || m.status === 'completed'
    }));
    const meetingDays = groupMeetingsByCairoDay(meetingsFmt);
    const flash = takeFlash(req);
    res.render('admin/meetings', {
      layout: false,
      title: 'Meetings — Admin',
      meetings: meetingsFmt,
      meetingDays,
      filters: {
        q: String(req.query.q || ''),
        status: String(req.query.status || 'all'),
        from: String(req.query.from || ''),
        to: String(req.query.to || '')
      },
      filterQuery,
      filterQueryEscaped: escapeHtmlAttr(filterQuery || ''),
      currentPage: 'meetings',
      projectCount,
      adminEmail: req.session.adminEmail,
      flash,
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load meetings');
  }
};

async function meetingActionRedirect(req, res, fn) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      req.session.flash = { type: 'err', msg: 'Invalid meeting.' };
      return redirectInbox(res, '/admin/meetings', req.body.returnQuery);
    }
    const doc = await MeetingBooking.findById(req.params.id);
    if (!doc) {
      req.session.flash = { type: 'err', msg: 'Meeting not found.' };
      return redirectInbox(res, '/admin/meetings', req.body.returnQuery);
    }
    const flash = await fn(doc);
    if (flash) req.session.flash = flash;
    redirectInbox(res, '/admin/meetings', req.body.returnQuery);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Action failed.' };
    redirectInbox(res, '/admin/meetings', req.body.returnQuery);
  }
}

function parseBulkMeetingIds(body) {
  let raw = body.ids;
  if (raw == null) return [];
  if (!Array.isArray(raw)) raw = [raw];
  const out = [];
  const seen = new Set();
  for (const id of raw) {
    const s = String(id || '').trim();
    if (!mongoose.isValidObjectId(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function flashFromBulkResults(okVerb, okCount, errors) {
  if (okCount === 0 && errors.length === 0) {
    return { type: 'err', msg: 'Nothing was updated.' };
  }
  if (errors.length === 0) {
    return { type: 'ok', msg: `${okCount} meeting(s) ${okVerb}.` };
  }
  if (okCount === 0) {
    const sample = errors.slice(0, 5).join(' · ');
    const more = errors.length > 5 ? ` (+${errors.length - 5} more)` : '';
    return { type: 'err', msg: `No meetings ${okVerb}. ${sample}${more}` };
  }
  const sample = errors.slice(0, 4).join(' · ');
  const more = errors.length > 4 ? ` (+${errors.length - 4} more)` : '';
  return {
    type: 'err',
    msg: `${okCount} ${okVerb}; ${errors.length} skipped. ${sample}${more}`
  };
}

/** @returns {Promise<{ type: 'ok'|'err'; msg: string }>} */
async function performMeetingConfirm(doc) {
  if (doc.status !== 'pending') {
    return { type: 'err', msg: 'Only pending meetings can be confirmed.' };
  }

  let meetLink = '';
  let googleEventId = '';

  if (isGoogleCalendarConfigured()) {
    try {
      const created = await createMeetEventFromBooking(doc);
      meetLink = created.meetLink || '';
      googleEventId = created.eventId || '';
      if (!googleEventId) {
        return {
          type: 'err',
          msg: 'Google Calendar did not return an event ID. Meeting was not confirmed.'
        };
      }
    } catch (err) {
      console.error(err);
      const msg = err && err.message ? err.message : 'Unknown error';
      return {
        type: 'err',
        msg: `Could not create Google Calendar / Meet event: ${msg}. Meeting was not confirmed.`
      };
    }
  }

  const siteUrl = getPublicSiteUrl();
  const labels = {
    labelCairo: formatInZone(doc.startsAt, CAIRO_ZONE),
    labelViewer: formatInZone(doc.startsAt, doc.viewerTimeZone || CAIRO_ZONE)
  };
  const logo = getBrandedLogoEmailParts(siteUrl);

  if (isSmtpConfigured()) {
    const mail = await sendMailSafe({
      to: doc.email,
      subject: 'Your Qimora meeting is confirmed',
      html: meetingConfirmedGuestHtml(doc, labels, meetLink, siteUrl, logo.logoImgSrc),
      text: meetingConfirmedGuestText(doc, labels, meetLink),
      attachments: logo.attachments
    });
    if (!mail.sent) {
      if (googleEventId) {
        await deleteCalendarEventIfExists(googleEventId);
      }
      return {
        type: 'err',
        msg: 'Confirmation email failed to send. Meeting was not confirmed. Check SMTP settings.'
      };
    }
  }

  doc.status = 'confirmed';
  if (meetLink) doc.meetLink = meetLink;
  if (googleEventId) doc.googleEventId = googleEventId;
  doc.guestNotifiedAt = new Date();
  await doc.save();

  const parts = [];
  if (isSmtpConfigured()) {
    parts.push('Meeting confirmed. The guest was notified by email.');
  } else {
    parts.push('Meeting confirmed. SMTP not configured — guest was not emailed.');
  }
  if (!isGoogleCalendarConfigured()) parts.push('Google Calendar not configured (no Meet link).');
  return { type: 'ok', msg: parts.join(' ') };
}

/** @returns {Promise<{ type: 'ok'|'err'; msg: string }>} */
async function performMeetingCancel(doc) {
  if (doc.status === 'completed') {
    return { type: 'err', msg: 'Ended meetings cannot be cancelled here.' };
  }
  if (doc.status === 'cancelled') {
    return { type: 'err', msg: 'Meeting is already cancelled.' };
  }
  if (doc.googleEventId) {
    await deleteCalendarEventIfExists(doc.googleEventId);
    doc.googleEventId = undefined;
    doc.meetLink = undefined;
  }
  doc.status = 'cancelled';
  await doc.save();
  return { type: 'ok', msg: 'Meeting cancelled. The slot is available for new bookings.' };
}

/** @returns {Promise<{ type: 'ok'|'err'; msg: string }>} */
async function performMeetingDelete(doc) {
  if (doc.googleEventId) {
    await deleteCalendarEventIfExists(doc.googleEventId);
  }
  await doc.deleteOne();
  return { type: 'ok', msg: 'Meeting removed permanently.' };
}

exports.meetingBulk = async (req, res) => {
  const returnQuery = String(req.body.returnQuery || '').trim();
  const action = String(req.body.bulkAction || '').trim();
  const ids = parseBulkMeetingIds(req.body);

  try {
    if (!['confirm', 'cancel', 'delete'].includes(action)) {
      req.session.flash = { type: 'err', msg: 'Unknown bulk action.' };
      return redirectInbox(res, '/admin/meetings', returnQuery);
    }
    if (!ids.length) {
      req.session.flash = { type: 'err', msg: 'Select at least one meeting.' };
      return redirectInbox(res, '/admin/meetings', returnQuery);
    }

    let ok = 0;
    const errors = [];

    for (const id of ids) {
      const doc = await MeetingBooking.findById(id);
      if (!doc) {
        errors.push(`ID ${id}: not found`);
        continue;
      }
      const label = doc.name || doc.email || String(id);
      let r;
      if (action === 'confirm') {
        r = await performMeetingConfirm(doc);
      } else if (action === 'cancel') {
        r = await performMeetingCancel(doc);
      } else {
        r = await performMeetingDelete(doc);
      }
      if (r.type === 'ok') ok += 1;
      else errors.push(`${label}: ${r.msg}`);
    }

    const verb =
      action === 'confirm'
        ? 'confirmed'
        : action === 'cancel'
          ? 'cancelled'
          : 'deleted';
    req.session.flash = flashFromBulkResults(verb, ok, errors);
    redirectInbox(res, '/admin/meetings', returnQuery);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Bulk action failed.' };
    redirectInbox(res, '/admin/meetings', returnQuery);
  }
};

exports.meetingConfirm = async (req, res) => {
  await meetingActionRedirect(req, res, performMeetingConfirm);
};

exports.meetingComplete = async (req, res) => {
  await meetingActionRedirect(req, res, async (doc) => {
    if (doc.status === 'completed') {
      return { type: 'err', msg: 'This meeting is already marked as ended.' };
    }
    if (doc.status === 'cancelled') {
      return { type: 'err', msg: 'Cancelled meetings cannot be marked as ended.' };
    }
    if (doc.status !== 'confirmed') {
      return { type: 'err', msg: 'Confirm the meeting first, then mark it as ended after it takes place.' };
    }
    doc.status = 'completed';
    await doc.save();
    return { type: 'ok', msg: 'Meeting marked as ended. Thank you for closing the loop.' };
  });
};

exports.meetingCancel = async (req, res) => {
  await meetingActionRedirect(req, res, performMeetingCancel);
};

exports.meetingDelete = async (req, res) => {
  await meetingActionRedirect(req, res, performMeetingDelete);
};

// ---------- Team members (Meet Our Team) ----------

exports.listTeam = async (req, res) => {
  try {
    const [members, inboxNav] = await Promise.all([
      TeamMember.find().sort({ order: 1, name: 1 }).lean(),
      getInboxNavCounts()
    ]);
    const flash = takeFlash(req);
    res.render('admin/team-list', {
      layout: false,
      title: 'Team — Admin',
      members,
      teamThemes: TEAM_THEME_PRESETS,
      flash,
      adminEmail: req.session.adminEmail,
      currentPage: 'team',
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load team');
  }
};

exports.newTeamMember = async (req, res) => {
  try {
    const count = await TeamMember.countDocuments();
    const inboxNav = await getInboxNavCounts();
    const blank = {
      name: '',
      role: '',
      specialty: '',
      years: 5,
      description: '',
      image: '',
      theme: 1,
      socialGithub: '',
      socialLinkedin: '',
      order: count,
      isPublished: true
    };
    res.render(
      'admin/team-form',
      teamFormLocals({
        layout: false,
        title: 'New team member',
        member: blank,
        isEdit: false,
        error: null,
        adminEmail: req.session.adminEmail,
        ...inboxNav
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.createTeamMember = async (req, res) => {
  const inboxNav = await getInboxNavCounts();
  const count = await TeamMember.countDocuments();
  try {
    const payload = buildTeamMemberPayload(req);
    if (!payload.name || !payload.specialty) {
      throw new Error('Name and specialty are required.');
    }
    if (!payload.image) {
      throw new Error('Add a photo (upload or paste an image URL).');
    }
    await TeamMember.create(payload);
    req.session.flash = { type: 'ok', msg: 'Team member created.' };
    res.redirect('/admin/team');
  } catch (err) {
    console.error(err);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    const blank = {
      name: String(req.body.name || '').trim(),
      role: String(req.body.role || '').trim(),
      specialty: String(req.body.specialty || '').trim(),
      years: Math.min(99, Math.max(0, Number.parseInt(String(req.body.years), 10) || 0)),
      description: String(req.body.description || '').trim(),
      image: String(req.body.image || '').trim(),
      theme: clampTheme(req.body.theme),
      socialGithub: String(req.body.socialGithub || '').trim(),
      socialLinkedin: String(req.body.socialLinkedin || '').trim(),
      order: Number.parseInt(req.body.order, 10) || count,
      isPublished: parseBool(req.body.isPublished)
    };
    res.status(400).render(
      'admin/team-form',
      teamFormLocals({
        layout: false,
        title: 'New team member',
        member: blank,
        isEdit: false,
        error: err.message || 'Could not save',
        adminEmail: req.session.adminEmail,
        ...inboxNav
      })
    );
  }
};

exports.editTeamMember = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Not found');
    }
    const member = await TeamMember.findById(req.params.id).lean();
    if (!member) return res.status(404).send('Not found');
    const inboxNav = await getInboxNavCounts();
    res.render(
      'admin/team-form',
      teamFormLocals({
        layout: false,
        title: `Edit — ${member.name}`,
        member,
        isEdit: true,
        error: null,
        adminEmail: req.session.adminEmail,
        ...inboxNav
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.updateTeamMember = async (req, res) => {
  const inboxNav = await getInboxNavCounts();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Not found');
    }
    const doc = await TeamMember.findById(req.params.id);
    if (!doc) return res.status(404).send('Not found');
    const payload = buildTeamMemberPayload(req);
    if (!payload.name || !payload.specialty) {
      throw new Error('Name and specialty are required.');
    }
    if (!payload.image) {
      throw new Error('Keep the current photo or upload a new one (or paste an image URL).');
    }
    const oldImage = doc.image;
    if (req.file && oldImage && oldImage !== payload.image && String(oldImage).startsWith(TEAM_UPLOAD_REL)) {
      maybeUnlinkTeamImage(oldImage);
    }
    Object.assign(doc, payload);
    await doc.save();
    req.session.flash = { type: 'ok', msg: 'Team member updated.' };
    res.redirect('/admin/team');
  } catch (err) {
    console.error(err);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    const member = await TeamMember.findById(req.params.id).lean();
    if (!member) return res.status(404).send('Not found');
    const merged = { ...member, ...buildTeamMemberPayload(req) };
    res.status(400).render(
      'admin/team-form',
      teamFormLocals({
        layout: false,
        title: `Edit — ${member.name}`,
        member: merged,
        isEdit: true,
        error: err.message || 'Could not save',
        adminEmail: req.session.adminEmail,
        ...inboxNav
      })
    );
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Not found');
    }
    const doc = await TeamMember.findById(req.params.id);
    if (!doc) {
      req.session.flash = { type: 'err', msg: 'Member not found.' };
      return res.redirect('/admin/team');
    }
    maybeUnlinkTeamImage(doc.image);
    await TeamMember.deleteOne({ _id: doc._id });
    req.session.flash = { type: 'ok', msg: 'Team member removed.' };
    res.redirect('/admin/team');
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Delete failed.' };
    res.redirect('/admin/team');
  }
};

exports.toggleTeamPublish = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).send('Not found');
    }
    const doc = await TeamMember.findById(req.params.id);
    if (!doc) return res.status(404).send('Not found');
    doc.isPublished = !doc.isPublished;
    await doc.save();
    req.session.flash = {
      type: 'ok',
      msg: doc.isPublished ? 'Member is now published on the site.' : 'Member hidden from the site.'
    };
    res.redirect('/admin/team');
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Could not update publish state.' };
    res.redirect('/admin/team');
  }
};

// ---------- Client portal (admin) ----------

exports.listClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 }).lean();
    const inboxNav = await getInboxNavCounts();
    const flash = takeFlash(req);
    res.render('admin/clients', {
      layout: false,
      title: 'Clients — Admin',
      clients,
      flash,
      adminEmail: req.session.adminEmail,
      currentPage: 'clients',
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to load clients');
  }
};

exports.newClient = async (req, res) => {
  const inboxNav = await getInboxNavCounts();
  res.render('admin/client-form', {
    layout: false,
    title: 'New client — Admin',
      clientRecord: { username: '', name: '', email: '', company: '', activeSinceDateStr: '' },
    isEdit: false,
    error: null,
    adminEmail: req.session.adminEmail,
    currentPage: 'clients',
    ...inboxNav
  });
};

exports.createClient = async (req, res) => {
  const inboxNav = await getInboxNavCounts();
  try {
    const username = String(req.body.username || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const company = String(req.body.company || '').trim();
    const activeSinceRaw = String(req.body.activeSince || '').trim();
    let activeSince = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(activeSinceRaw)) {
      activeSince = new Date(`${activeSinceRaw}T12:00:00.000Z`);
      if (Number.isNaN(activeSince.getTime())) activeSince = null;
    }
    if (!username || !password) throw new Error('Username and password are required.');
    const exists = await Client.findOne({ username });
    if (exists) throw new Error('That username is already taken.');
    await Client.create({
      username,
      passwordHash: Client.hashPassword(password),
      name,
      email,
      company,
      activeSince
    });
    req.session.flash = { type: 'ok', msg: 'Client account created.' };
    res.redirect('/admin/clients');
  } catch (err) {
    console.error(err);
    res.status(400).render('admin/client-form', {
      layout: false,
      title: 'New client — Admin',
      clientRecord: {
        username: String(req.body.username || '').trim().toLowerCase(),
        name: String(req.body.name || '').trim(),
        email: String(req.body.email || '').trim(),
        company: String(req.body.company || '').trim(),
        activeSinceDateStr: String(req.body.activeSince || '').trim()
      },
      isEdit: false,
      error: err.message || 'Could not create client',
      adminEmail: req.session.adminEmail,
      currentPage: 'clients',
      ...inboxNav
    });
  }
};

exports.editClient = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('Not found');
    const client = await Client.findById(req.params.id).lean();
    if (!client) return res.status(404).send('Not found');
    const inboxNav = await getInboxNavCounts();
    res.render('admin/client-form', {
      layout: false,
      title: `Edit client — ${client.username}`,
      clientRecord: client,
      isEdit: true,
      error: null,
      adminEmail: req.session.adminEmail,
      currentPage: 'clients',
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.updateClient = async (req, res) => {
  const inboxNav = await getInboxNavCounts();
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('Not found');
    const doc = await Client.findById(req.params.id).select('+passwordHash');
    if (!doc) return res.status(404).send('Not found');
    const username = String(req.body.username || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const company = String(req.body.company || '').trim();
    const activeSinceRaw = String(req.body.activeSince || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(activeSinceRaw)) {
      const d = new Date(`${activeSinceRaw}T12:00:00.000Z`);
      doc.activeSince = Number.isNaN(d.getTime()) ? null : d;
    } else {
      doc.activeSince = null;
    }
    if (!username) throw new Error('Username is required.');
    const dup = await Client.findOne({ username, _id: { $ne: doc._id } });
    if (dup) throw new Error('That username is already taken.');
    doc.username = username;
    doc.name = name;
    doc.email = email;
    doc.company = company;
    if (password) {
      doc.passwordHash = Client.hashPassword(password);
    }
    await doc.save();
    req.session.flash = { type: 'ok', msg: 'Client updated.' };
    res.redirect('/admin/clients');
  } catch (err) {
    console.error(err);
    const client = await Client.findById(req.params.id).lean();
    if (!client) return res.status(404).send('Not found');
    res.status(400).render('admin/client-form', {
      layout: false,
      title: `Edit client — ${client.username}`,
      clientRecord: {
        ...client,
        username: String(req.body.username || '').trim().toLowerCase(),
        name: String(req.body.name || '').trim(),
        email: String(req.body.email || '').trim(),
        company: String(req.body.company || '').trim(),
        activeSinceDateStr: String(req.body.activeSince || '').trim()
      },
      isEdit: true,
      error: err.message || 'Could not update',
      adminEmail: req.session.adminEmail,
      currentPage: 'clients',
      ...inboxNav
    });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('Not found');
    const cid = req.params.id;
    const doc = await Client.findById(cid);
    if (!doc) {
      req.session.flash = { type: 'err', msg: 'Client not found.' };
      return res.redirect('/admin/clients');
    }
    const payments = await Payment.find({ clientId: cid }).lean();
    for (const p of payments) {
      for (const ph of p.photos || []) {
        maybeUnlinkPaymentPhoto(ph);
      }
    }
    await AccessEntry.deleteMany({ clientId: cid });
    await Payment.deleteMany({ clientId: cid });
    await MaintenanceLog.deleteMany({ clientId: cid });
    await Client.deleteOne({ _id: cid });
    req.session.flash = { type: 'ok', msg: `Deleted client «${doc.username}» and related data.` };
    res.redirect('/admin/clients');
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Delete failed.' };
    res.redirect('/admin/clients');
  }
};

exports.manageClientAccess = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('Not found');
    const client = await Client.findById(req.params.id).lean();
    if (!client) return res.status(404).send('Not found');
    const entries = await AccessEntry.find({ clientId: client._id }).sort({ order: 1, label: 1 }).lean();
    const inboxNav = await getInboxNavCounts();
    const flash = takeFlash(req);
    res.render('admin/client-access', {
      layout: false,
      title: `Access — ${client.username}`,
      clientRecord: client,
      entries,
      categories: ACCESS_CATEGORIES,
      flash,
      adminEmail: req.session.adminEmail,
      currentPage: 'clients',
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.createAccessEntry = async (req, res) => {
  try {
    const cid = req.params.id;
    if (!mongoose.isValidObjectId(cid)) return res.status(404).send('Not found');
    const client = await Client.findById(cid);
    if (!client) return res.status(404).send('Not found');
    const b = req.body;
    const category = ACCESS_CATEGORIES.includes(b.category) ? b.category : 'service';
    const label = String(b.label || '').trim();
    if (!label) throw new Error('Label is required.');
    await AccessEntry.create({
      clientId: client._id,
      category,
      label,
      host: String(b.host || '').trim(),
      port: String(b.port || '').trim(),
      username: String(b.username || '').trim(),
      password: String(b.password || '').trim(),
      notes: String(b.notes || '').trim(),
      order: Number.parseInt(b.order, 10) || 0
    });
    req.session.flash = { type: 'ok', msg: 'Access entry added.' };
    res.redirect(`/admin/clients/${cid}/access`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: err.message || 'Could not add entry.' };
    res.redirect(`/admin/clients/${req.params.id}/access`);
  }
};

exports.updateAccessEntry = async (req, res) => {
  try {
    const cid = req.params.id;
    const eid = req.params.entryId;
    if (!mongoose.isValidObjectId(cid) || !mongoose.isValidObjectId(eid)) {
      return res.status(404).send('Not found');
    }
    const entry = await AccessEntry.findOne({ _id: eid, clientId: cid });
    if (!entry) return res.status(404).send('Not found');
    const b = req.body;
    const category = ACCESS_CATEGORIES.includes(b.category) ? b.category : entry.category;
    entry.category = category;
    entry.label = String(b.label || '').trim() || entry.label;
    entry.host = String(b.host || '').trim();
    entry.port = String(b.port || '').trim();
    entry.username = String(b.username || '').trim();
    entry.password = String(b.password || '').trim();
    entry.notes = String(b.notes || '').trim();
    entry.order = Number.parseInt(b.order, 10) || 0;
    await entry.save();
    req.session.flash = { type: 'ok', msg: 'Access entry saved.' };
    res.redirect(`/admin/clients/${cid}/access`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Update failed.' };
    res.redirect(`/admin/clients/${req.params.id}/access`);
  }
};

exports.deleteAccessEntry = async (req, res) => {
  try {
    const cid = req.params.id;
    const eid = req.params.entryId;
    if (!mongoose.isValidObjectId(cid) || !mongoose.isValidObjectId(eid)) {
      return res.status(404).send('Not found');
    }
    await AccessEntry.deleteOne({ _id: eid, clientId: cid });
    req.session.flash = { type: 'ok', msg: 'Entry removed.' };
    res.redirect(`/admin/clients/${cid}/access`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Delete failed.' };
    res.redirect(`/admin/clients/${req.params.id}/access`);
  }
};

exports.manageClientPayments = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('Not found');
    const client = await Client.findById(req.params.id).lean();
    if (!client) return res.status(404).send('Not found');
    const paymentsRaw = await Payment.find({ clientId: client._id }).sort({ date: -1 }).lean();
    const payments = paymentsRaw.map((p) => ({
      ...p,
      lineTitle: paymentLineTitle(p)
    }));
    const inboxNav = await getInboxNavCounts();
    const flash = takeFlash(req);
    res.render('admin/client-payments', {
      layout: false,
      title: `Payments — ${client.username}`,
      clientRecord: client,
      payments,
      flash,
      adminEmail: req.session.adminEmail,
      currentPage: 'clients',
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.createPayment = async (req, res) => {
  try {
    const cid = req.params.id;
    if (!mongoose.isValidObjectId(cid)) return res.status(404).send('Not found');
    const client = await Client.findById(cid);
    if (!client) return res.status(404).send('Not found');
    const payload = buildPaymentPayload(req, []);
    await Payment.create({
      clientId: client._id,
      ...payload
    });
    req.session.flash = { type: 'ok', msg: 'Payment added.' };
    res.redirect(`/admin/clients/${cid}/payments`);
  } catch (err) {
    console.error(err);
    if (req.files && req.files.length) {
      for (const f of req.files) fs.unlink(f.path, () => {});
    }
    req.session.flash = { type: 'err', msg: err.message || 'Could not add payment.' };
    res.redirect(`/admin/clients/${req.params.id}/payments`);
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const cid = req.params.id;
    const pid = req.params.paymentId;
    if (!mongoose.isValidObjectId(cid) || !mongoose.isValidObjectId(pid)) {
      return res.status(404).send('Not found');
    }
    const doc = await Payment.findOne({ _id: pid, clientId: cid });
    if (!doc) return res.status(404).send('Not found');
    const payload = buildPaymentPayload(req, doc.photos || []);
    Object.assign(doc, payload);
    await doc.save();
    req.session.flash = { type: 'ok', msg: 'Payment updated.' };
    res.redirect(`/admin/clients/${cid}/payments`);
  } catch (err) {
    console.error(err);
    if (req.files && req.files.length) {
      for (const f of req.files) fs.unlink(f.path, () => {});
    }
    req.session.flash = { type: 'err', msg: err.message || 'Update failed.' };
    res.redirect(`/admin/clients/${req.params.id}/payments`);
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const cid = req.params.id;
    const pid = req.params.paymentId;
    if (!mongoose.isValidObjectId(cid) || !mongoose.isValidObjectId(pid)) {
      return res.status(404).send('Not found');
    }
    const doc = await Payment.findOne({ _id: pid, clientId: cid });
    if (!doc) {
      req.session.flash = { type: 'err', msg: 'Not found.' };
      return res.redirect(`/admin/clients/${cid}/payments`);
    }
    for (const ph of doc.photos || []) {
      maybeUnlinkPaymentPhoto(ph);
    }
    await Payment.deleteOne({ _id: doc._id });
    req.session.flash = { type: 'ok', msg: 'Payment deleted.' };
    res.redirect(`/admin/clients/${cid}/payments`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Delete failed.' };
    res.redirect(`/admin/clients/${req.params.id}/payments`);
  }
};

exports.deletePaymentPhoto = async (req, res) => {
  try {
    const cid = req.params.id;
    const pid = req.params.paymentId;
    const idx = Number.parseInt(String(req.body.photoIndex), 10);
    if (!mongoose.isValidObjectId(cid) || !mongoose.isValidObjectId(pid) || Number.isNaN(idx)) {
      return res.status(404).send('Not found');
    }
    const doc = await Payment.findOne({ _id: pid, clientId: cid });
    if (!doc || !doc.photos || !doc.photos[idx]) {
      req.session.flash = { type: 'err', msg: 'Photo not found.' };
      return res.redirect(`/admin/clients/${cid}/payments`);
    }
    const removed = doc.photos.splice(idx, 1)[0];
    maybeUnlinkPaymentPhoto(removed);
    await doc.save();
    req.session.flash = { type: 'ok', msg: 'Photo removed.' };
    res.redirect(`/admin/clients/${cid}/payments`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Could not remove photo.' };
    res.redirect(`/admin/clients/${req.params.id}/payments`);
  }
};

exports.manageClientMaintenance = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('Not found');
    const client = await Client.findById(req.params.id).lean();
    if (!client) return res.status(404).send('Not found');
    const logs = await MaintenanceLog.find({ clientId: client._id }).sort({ year: -1, month: -1 }).lean();
    const inboxNav = await getInboxNavCounts();
    const flash = takeFlash(req);
    res.render('admin/client-maintenance', {
      layout: false,
      title: `Maintenance — ${client.username}`,
      clientRecord: client,
      logs,
      flash,
      adminEmail: req.session.adminEmail,
      currentPage: 'clients',
      ...inboxNav
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.createMaintenanceLog = async (req, res) => {
  try {
    const cid = req.params.id;
    if (!mongoose.isValidObjectId(cid)) return res.status(404).send('Not found');
    const client = await Client.findById(cid);
    if (!client) return res.status(404).send('Not found');
    const b = req.body;
    let month;
    let year;
    const my = String(b.monthYear || '').trim();
    if (/^\d{4}-\d{2}$/.test(my)) {
      year = Number.parseInt(my.slice(0, 4), 10);
      month = Number.parseInt(my.slice(5, 7), 10);
    } else {
      month = Number.parseInt(String(b.month), 10);
      year = Number.parseInt(String(b.year), 10);
    }
    const level = Number.parseInt(String(b.level), 10);
    const title = String(b.title || '').trim();
    if (!title) throw new Error('Title is required.');
    if (month < 1 || month > 12) throw new Error('Invalid month.');
    if (!year || year < 2000) throw new Error('Invalid year.');
    if (level < 1 || level > 4) throw new Error('Level must be 1–4.');
    await MaintenanceLog.create({
      clientId: client._id,
      month,
      year,
      title,
      level,
      cost: Number.parseFloat(String(b.cost)) || 0,
      currency: normalizePaymentCurrency(b.currency),
      summary: String(b.summary || '').trim(),
      details: String(b.details || '').trim(),
      publishedAt: b.publishedAt ? new Date(b.publishedAt) : new Date()
    });
    req.session.flash = { type: 'ok', msg: 'Maintenance log added.' };
    res.redirect(`/admin/clients/${cid}/maintenance`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: err.message || 'Could not add log.' };
    res.redirect(`/admin/clients/${req.params.id}/maintenance`);
  }
};

exports.updateMaintenanceLog = async (req, res) => {
  try {
    const cid = req.params.id;
    const lid = req.params.logId;
    if (!mongoose.isValidObjectId(cid) || !mongoose.isValidObjectId(lid)) {
      return res.status(404).send('Not found');
    }
    const doc = await MaintenanceLog.findOne({ _id: lid, clientId: cid });
    if (!doc) return res.status(404).send('Not found');
    const b = req.body;
    const month = Number.parseInt(String(b.month), 10);
    const year = Number.parseInt(String(b.year), 10);
    const level = Number.parseInt(String(b.level), 10);
    doc.month = month >= 1 && month <= 12 ? month : doc.month;
    doc.year = year >= 2000 ? year : doc.year;
    doc.title = String(b.title || '').trim() || doc.title;
    doc.level = level >= 1 && level <= 4 ? level : doc.level;
    doc.cost = Number.parseFloat(String(b.cost)) || 0;
    doc.currency = normalizePaymentCurrency(b.currency);
    doc.summary = String(b.summary || '').trim();
    doc.details = String(b.details || '').trim();
    if (b.publishedAt) {
      const d = new Date(b.publishedAt);
      if (!Number.isNaN(d.getTime())) doc.publishedAt = d;
    }
    await doc.save();
    req.session.flash = { type: 'ok', msg: 'Maintenance log updated.' };
    res.redirect(`/admin/clients/${cid}/maintenance`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Update failed.' };
    res.redirect(`/admin/clients/${req.params.id}/maintenance`);
  }
};

exports.deleteMaintenanceLog = async (req, res) => {
  try {
    const cid = req.params.id;
    const lid = req.params.logId;
    if (!mongoose.isValidObjectId(cid) || !mongoose.isValidObjectId(lid)) {
      return res.status(404).send('Not found');
    }
    await MaintenanceLog.deleteOne({ _id: lid, clientId: cid });
    req.session.flash = { type: 'ok', msg: 'Log removed.' };
    res.redirect(`/admin/clients/${cid}/maintenance`);
  } catch (err) {
    console.error(err);
    req.session.flash = { type: 'err', msg: 'Delete failed.' };
    res.redirect(`/admin/clients/${req.params.id}/maintenance`);
  }
};

exports.paymentPhotosMiddleware = paymentPhotosMiddleware;

exports.teamPhotoMiddleware = teamPhotoMiddleware;

exports.uploadMiddleware = uploadFields;
