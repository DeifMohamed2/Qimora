/* ============================================================
   Qimora — Application Entry Point (app.js)
   ============================================================ */

require('dotenv').config();

const express    = require('express');
const path       = require('path');
const session    = require('express-session');
const MongoStoreModule = require('connect-mongo');
const MongoStore = MongoStoreModule.default || MongoStoreModule.MongoStore;
const morgan     = require('morgan');
const helmet     = require('helmet');
const compression = require('compression');
const ejsLayouts = require('express-ejs-layouts');
const connectDB  = require('./config/db');

const app = express();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qimora';

/* Behind reverse proxy (HTTPS) — so Secure cookies work when NODE_ENV=production */
if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

/* ---------- View locals (global EJS helpers) ---------- */
const { resolveTechStack } = require('./lib/techStackIcons');
app.locals.resolveTechStack = resolveTechStack;

/* ---------- Connect to MongoDB ---------- */
connectDB();

/* ---------- Security & Performance Middleware ---------- */
app.use(helmet({
  contentSecurityPolicy: false,   // Allow inline styles/scripts for landing page
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

/* ---------- Logging ---------- */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ---------- Body Parsers ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Session (admin) ---------- */
const sessionCookieSecure =
  process.env.SESSION_COOKIE_SECURE === 'true'
  || (process.env.NODE_ENV === 'production' && process.env.SESSION_COOKIE_SECURE !== 'false');

app.use(
  session({
    name: 'qimora.sid',
    secret: process.env.SESSION_SECRET || 'qimora-dev-change-me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoUri }),
    cookie: {
      secure: sessionCookieSecure,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 60 * 60 * 1000
    }
  })
);

/* ---------- Static Files ---------- */
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- View Engine (EJS) ---------- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');

/* ---------- Routes ---------- */
app.use('/', require('./routes/index'));
app.use('/api/contact', require('./routes/api/contact'));
app.use('/api/booking', require('./routes/api/booking'));
app.use('/admin', require('./routes/admin'));

/* ---------- 404 Handler ---------- */
app.use((req, res) => {
  res.status(404).render('404', { title: '404 — Page Not Found' });
});

/* ---------- Global Error Handler ---------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error' });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✦  Qimora server running → http://localhost:${PORT}  (${process.env.NODE_ENV || 'production'})`);
});
