/* ============================================================
   Client portal — auth & read-only views
   ============================================================ */

const mongoose = require('mongoose');
const Client = require('../models/Client');
const AccessEntry = require('../models/AccessEntry');
const Payment = require('../models/Payment');
const MaintenanceLog = require('../models/MaintenanceLog');
const { normalizePaymentCurrency } = require('../lib/paymentCurrency');
const { paymentLineTitle } = require('../lib/paymentLineTitle');
const { takeFlash } = require('../lib/flash');

async function loadClientSession(req) {
  if (!req.session || !req.session.clientId) return null;
  if (!mongoose.isValidObjectId(req.session.clientId)) return null;
  const client = await Client.findById(req.session.clientId).lean();
  return client || null;
}

function formatMoney(amount, currency) {
  const n = Number(amount) || 0;
  const c = normalizePaymentCurrency(currency);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n);
  } catch {
    return `${n.toLocaleString('en-US')} ${c}`;
  }
}

/** Merge grouped totals into USD/EGP buckets */
function sumBuckets(rows, pickCurrencyFromRow) {
  const merged = { USD: 0, EGP: 0 };
  for (const row of rows) {
    const cur = normalizePaymentCurrency(pickCurrencyFromRow(row));
    const t = Number(row.total) || 0;
    merged[cur] = (merged[cur] || 0) + t;
  }
  return merged;
}

function buildTotalLines(merged) {
  const lines = [];
  for (const code of ['USD', 'EGP']) {
    const n = merged[code] || 0;
    if (n > 0) {
      lines.push({ currency: code, amountFmt: formatMoney(n, code) });
    }
  }
  if (lines.length === 0) {
    lines.push({ currency: 'USD', amountFmt: formatMoney(0, 'USD') });
  }
  return lines;
}

/** Non-zero currency lines only (for compact summaries). */
function buildCurrencyLinesPositive(merged) {
  const lines = [];
  for (const code of ['USD', 'EGP']) {
    const n = merged[code] || 0;
    if (n > 0) lines.push({ currency: code, amountFmt: formatMoney(n, code) });
  }
  return lines;
}

function parsePeriodYM(s) {
  if (!s || typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return { year, month };
}

function maintPeriodIndex(y, mo) {
  return y * 12 + (mo - 1);
}

function parseMaintPeriodQuery(req) {
  let fromP = parsePeriodYM(String(req.query.periodFrom || ''));
  let toP = parsePeriodYM(String(req.query.periodTo || ''));
  if (
    fromP &&
    toP &&
    maintPeriodIndex(fromP.year, fromP.month) > maintPeriodIndex(toP.year, toP.month)
  ) {
    const t = fromP;
    fromP = toP;
    toP = t;
  }
  const active = Boolean(fromP || toP);
  const periodFromInput = fromP ? `${fromP.year}-${String(fromP.month).padStart(2, '0')}` : '';
  const periodToInput = toP ? `${toP.year}-${String(toP.month).padStart(2, '0')}` : '';
  return { fromP, toP, active, periodFromInput, periodToInput };
}

function maintenanceLogInPeriod(log, fromP, toP) {
  if (!fromP && !toP) return true;
  const idx = maintPeriodIndex(log.year, log.month);
  if (fromP && idx < maintPeriodIndex(fromP.year, fromP.month)) return false;
  if (toP && idx > maintPeriodIndex(toP.year, toP.month)) return false;
  return true;
}

function sumMergedCostsFromLogs(logs) {
  const merged = { USD: 0, EGP: 0 };
  for (const log of logs) {
    const cur = normalizePaymentCurrency(log.currency);
    merged[cur] = (merged[cur] || 0) + (Number(log.cost) || 0);
  }
  return merged;
}

/** Parse ?from=YYYY-MM-DD&to=YYYY-MM-DD for financials filter */
function parseFinancialsDateQuery(req) {
  const fromRaw = String(req.query.from || '').trim();
  const toRaw = String(req.query.to || '').trim();
  let from = null;
  let to = null;
  let fromInput = /^\d{4}-\d{2}-\d{2}$/.test(fromRaw) ? fromRaw : '';
  let toInput = /^\d{4}-\d{2}-\d{2}$/.test(toRaw) ? toRaw : '';
  if (fromInput) {
    from = new Date(`${fromInput}T00:00:00.000Z`);
  }
  if (toInput) {
    to = new Date(`${toInput}T23:59:59.999Z`);
  }
  if (
    from &&
    to &&
    !Number.isNaN(from.getTime()) &&
    !Number.isNaN(to.getTime()) &&
    from > to
  ) {
    const td = from;
    from = to;
    to = td;
    const ts = fromInput;
    fromInput = toInput;
    toInput = ts;
  }
  const active = Boolean(
    (from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))
  );
  return {
    from,
    to,
    fromInput,
    toInput,
    active
  };
}

exports.getLogin = (req, res) => {
  if (req.session && req.session.clientId) {
    return res.redirect('/client');
  }
  const redirect = String(req.query.redirect || '').trim();
  const flash = takeFlash(req);
  res.render('client/login', {
    layout: false,
    title: 'Client login — Qimora',
    error: null,
    redirect: redirect && redirect.startsWith('/client') ? redirect : '',
    flash
  });
};

exports.postLogin = async (req, res) => {
  const username = String(req.body.username || '')
    .trim()
    .toLowerCase();
  const password = String(req.body.password || '');
  const redirect = String(req.body.redirect || req.query.redirect || '').trim();
  const safeRedirect =
    redirect && (redirect.startsWith('/client') || redirect === '/client') ? redirect : '/client';

  try {
    const user = await Client.findOne({ username }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).render('client/login', {
        layout: false,
        title: 'Client login — Qimora',
        error: 'Invalid username or password.',
        redirect: safeRedirect === '/client' ? '' : safeRedirect,
        flash: null
      });
    }
    req.session.clientId = user._id.toString();
    req.session.clientName = user.name || user.username;
    req.session.flash = { type: 'ok', msg: 'Welcome back.' };
    res.redirect(safeRedirect);
  } catch (err) {
    console.error(err);
    res.status(500).render('client/login', {
      layout: false,
      title: 'Client login — Qimora',
      error: 'Could not sign in. Try again later.',
      redirect: '',
      flash: null
    });
  }
};

exports.logout = (req, res) => {
  delete req.session.clientId;
  delete req.session.clientName;
  req.session.flash = { type: 'ok', msg: 'You have been signed out.' };
  res.redirect('/client/login');
};

exports.dashboard = async (req, res) => {
  const client = await loadClientSession(req);
  if (!client) return res.redirect('/client/login');

  const cid = client._id;
  const [
    accessCount,
    paidAgg,
    pendingAgg,
    maintCostAgg,
    firstPayment,
    recentPaymentsRaw,
    recentMaintRaw
  ] = await Promise.all([
    AccessEntry.countDocuments({ clientId: cid }),
    Payment.aggregate([
      { $match: { clientId: cid, status: 'paid' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } }
    ]),
    Payment.aggregate([
      { $match: { clientId: cid, status: 'pending' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } }
    ]),
    MaintenanceLog.aggregate([
      { $match: { clientId: cid } },
      { $group: { _id: '$currency', total: { $sum: '$cost' } } }
    ]),
    Payment.findOne({ clientId: cid }).sort({ date: 1 }).lean(),
    Payment.find({ clientId: cid }).sort({ date: -1 }).limit(6).lean(),
    MaintenanceLog.find({ clientId: cid }).sort({ year: -1, month: -1 }).limit(6).lean()
  ]);

  const paidMerged = sumBuckets(paidAgg, (row) => row._id);
  const maintCostMerged = sumBuckets(maintCostAgg, (row) => row._id);
  const paidMergedCombined = {
    USD: (paidMerged.USD || 0) + (maintCostMerged.USD || 0),
    EGP: (paidMerged.EGP || 0) + (maintCostMerged.EGP || 0)
  };
  const paidTotalLines = buildTotalLines(paidMergedCombined);
  const pendingMerged = sumBuckets(pendingAgg, (row) => row._id);
  const pendingTotalLines = buildTotalLines(pendingMerged);

  const adminActiveSince = client.activeSince ? new Date(client.activeSince) : null;
  const fallbackPaymentStart =
    firstPayment && firstPayment.date ? new Date(firstPayment.date) : null;

  let startDate = null;
  let uptimeSource = null;
  if (adminActiveSince && !Number.isNaN(adminActiveSince.getTime())) {
    startDate = adminActiveSince;
    uptimeSource = 'admin';
  } else if (fallbackPaymentStart && !Number.isNaN(fallbackPaymentStart.getTime())) {
    startDate = fallbackPaymentStart;
    uptimeSource = 'payment';
  }

  let uptimeTotalSecs = null;
  let uptimeDays = null;
  let uptimeHours = null;
  let uptimeMins = null;
  let uptimeSecsRem = null;
  let startDateFmt = null;

  if (startDate) {
    const diff = Date.now() - startDate.getTime();
    uptimeTotalSecs = Math.max(0, Math.floor(diff / 1000));
    uptimeDays = Math.floor(uptimeTotalSecs / 86400);
    uptimeHours = Math.floor((uptimeTotalSecs % 86400) / 3600);
    uptimeMins = Math.floor((uptimeTotalSecs % 3600) / 60);
    uptimeSecsRem = uptimeTotalSecs % 60;
    startDateFmt = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const recentPayments = recentPaymentsRaw.map((p) => ({
    id: p._id.toString(),
    dateFmt: new Date(p.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    amountFmt: formatMoney(p.amount, p.currency),
    status: p.status,
    title: paymentLineTitle(p)
  }));

  const MOABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const recentMaintenance = recentMaintRaw.map((m) => ({
    id: m._id.toString(),
    title: m.title,
    periodShort: `${MOABBREV[m.month - 1]} ${m.year}`,
    level: m.level,
    costFmt: formatMoney(m.cost, m.currency)
  }));

  const displayCompany = String(client.company || '').trim();

  const flash = takeFlash(req);
  res.render('client/dashboard', {
    layout: false,
    title: 'Dashboard — Client portal',
    currentPage: 'dashboard',
    clientName: client.name || client.username,
    displayCompany,
    flash,
    accessCount,
    paidTotalLines,
    pendingTotalLines,
    startDate,
    uptimeSource,
    uptimeTotalSecs,
    uptimeDays,
    uptimeHours,
    uptimeMins,
    uptimeSecsRem,
    startDateFmt,
    recentPayments,
    recentMaintenance
  });
};

exports.access = async (req, res) => {
  const client = await loadClientSession(req);
  if (!client) return res.redirect('/client/login');

  const entries = await AccessEntry.find({ clientId: client._id }).sort({ order: 1, label: 1 }).lean();
  const groups = { server: [], database: [], service: [] };
  for (const e of entries) {
    const k = groups[e.category] ? e.category : 'service';
    groups[k].push(e);
  }

  const flash = takeFlash(req);
  res.render('client/access', {
    layout: false,
    title: 'Access data — Client portal',
    currentPage: 'access',
    clientName: client.name || client.username,
    flash,
    groups,
    groupLabels: { server: 'Servers & hosting', database: 'Databases', service: 'Services & APIs' }
  });
};

exports.financials = async (req, res) => {
  const client = await loadClientSession(req);
  if (!client) return res.redirect('/client/login');

  const { from, to, fromInput, toInput, active: filterActive } = parseFinancialsDateQuery(req);

  const mongoQuery = { clientId: client._id };
  const dateRange = {};
  if (from && !Number.isNaN(from.getTime())) dateRange.$gte = from;
  if (to && !Number.isNaN(to.getTime())) dateRange.$lte = to;
  if (Object.keys(dateRange).length) mongoQuery.date = dateRange;

  const payments = await Payment.find(mongoQuery).sort({ date: -1 }).lean();

  const paidMerged = { USD: 0, EGP: 0 };
  const pendingMerged = { USD: 0, EGP: 0 };
  const rows = payments.map((p) => {
    const cur = normalizePaymentCurrency(p.currency);
    if (p.status === 'pending') pendingMerged[cur] += Number(p.amount) || 0;
    else paidMerged[cur] += Number(p.amount) || 0;
    const desc = String(p.description || '').trim();
    return {
      ...p,
      title: paymentLineTitle(p),
      dateFmt: new Date(p.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      }),
      amountFmt: formatMoney(p.amount, p.currency),
      currencyCode: normalizePaymentCurrency(p.currency),
      hasDetails: Boolean(desc),
      detailText: desc
    };
  });

  const paidTotalLines = buildTotalLines(paidMerged);
  const pendingTotalLines = buildTotalLines(pendingMerged);

  const flash = takeFlash(req);
  res.render('client/financials', {
    layout: false,
    title: 'Financials — Client portal',
    currentPage: 'financials',
    clientName: client.name || client.username,
    flash,
    rows,
    paidTotalLines,
    pendingTotalLines,
    formatMoney,
    filterFrom: fromInput,
    filterTo: toInput,
    filterActive,
    hasPaymentsOverall: (await Payment.countDocuments({ clientId: client._id })) > 0
  });
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.maintenance = async (req, res) => {
  const client = await loadClientSession(req);
  if (!client) return res.redirect('/client/login');

  const pq = parseMaintPeriodQuery(req);

  const logsRaw = await MaintenanceLog.find({ clientId: client._id })
    .sort({ year: -1, month: -1 })
    .lean();

  const logsFiltered = logsRaw.filter((log) =>
    maintenanceLogInPeriod(log, pq.fromP, pq.toP)
  );

  const cards = logsFiltered.map((log) => {
    const updatedAt = log.updatedAt ? new Date(log.updatedAt) : null;
    const publishedAt = log.publishedAt ? new Date(log.publishedAt) : null;
    const loggedRef = updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : publishedAt;
    return {
      ...log,
      id: log._id.toString(),
      periodLabel: `${MONTHS[log.month - 1]} ${log.year}`,
      shortMonth: MONTHS_SHORT[log.month - 1],
      refCode: `MAINT-${log.year}-${String(log.month).padStart(2, '0')}`,
      costFmt: formatMoney(log.cost, log.currency),
      summaryShort: String(log.summary || '').slice(0, 220),
      loggedAtFmt:
        loggedRef && !Number.isNaN(loggedRef.getTime())
          ? loggedRef.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          : '—',
      paletteIdx: Math.abs(Number(log.year)) % 3
    };
  });

  const byYear = {};
  for (const c of cards) {
    if (!byYear[c.year]) byYear[c.year] = [];
    byYear[c.year].push(c);
  }
  const maintYears = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)
    .map((year) => {
      const yearCards = byYear[year];
      const ymMerged = sumMergedCostsFromLogs(yearCards);
      return {
        year,
        count: yearCards.length,
        cards: yearCards,
        yearTotalLines: buildCurrencyLinesPositive(ymMerged)
      };
    });

  const flash = takeFlash(req);
  res.render('client/maintenance', {
    layout: false,
    title: 'Maintenance & updates — Client portal',
    currentPage: 'maintenance',
    clientName: client.name || client.username,
    flash,
    cards,
    maintYears,
    filterPeriodActive: pq.active,
    filterPeriodFrom: pq.periodFromInput,
    filterPeriodTo: pq.periodToInput,
    hasLogsOverall: logsRaw.length > 0
  });
};
