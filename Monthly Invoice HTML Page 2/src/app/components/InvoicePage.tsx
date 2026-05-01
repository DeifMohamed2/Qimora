import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  Printer,
  TrendingUp,
  Zap,
  Receipt,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const START_DATE = new Date("2024-10-05T00:00:00");
const MONTHLY_RATE = 400;
const CURRENCY = "EGP";
const CURRENCY_SYMBOL = "EGP";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMonthlyInvoices() {
  const invoices = [];
  const current = new Date("2026-04-26");
  let date = new Date(START_DATE);
  let num = 1;

  while (
    date.getFullYear() < current.getFullYear() ||
    (date.getFullYear() === current.getFullYear() &&
      date.getMonth() <= current.getMonth())
  ) {
    const month = date.toLocaleString("en-US", { month: "long" });
    const shortMonth = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    const dueDate = new Date(date.getFullYear(), date.getMonth(), 5);
    const dueDateStr = dueDate.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    invoices.push({
      id: num,
      invoiceNo: `INV-${String(num).padStart(3, "0")}`,
      period: `${month} ${year}`,
      shortMonth,
      month,
      year,
      dueDate: dueDateStr,
      amount: MONTHLY_RATE,
    });
    num++;
    date = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  }
  return invoices;
}

function useUptime() {
  const [elapsed, setElapsed] = useState(Date.now() - START_DATE.getTime());
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Date.now() - START_DATE.getTime()), 1000);
    return () => clearInterval(iv);
  }, []);
  const total = Math.floor(elapsed / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function useAnimatedCounter(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return { value, ref };
}

// year accent colors — maps each year to a palette
const YEAR_PALETTES: Record<number, { bg: string; text: string; badge: string; dot: string }> = {
  2024: { bg: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)", text: "#ffffff", badge: "rgba(255,255,255,0.18)", dot: "#c4b5fd" },
  2025: { bg: "linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)", text: "#ffffff", badge: "rgba(255,255,255,0.18)", dot: "#bae6fd" },
  2026: { bg: "linear-gradient(135deg,#10b981 0%,#0ea5e9 100%)", text: "#ffffff", badge: "rgba(255,255,255,0.18)", dot: "#a7f3d0" },
};

// ─── Animated Number ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const { value: displayed, ref } = useAnimatedCounter(value);
  return <span ref={ref}>{prefix}{displayed.toLocaleString("en-EG")}{suffix}</span>;
}

// ─── Uptime Block ─────────────────────────────────────────────────────────────
function UptimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.06, y: -4 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
      style={{
        background: "rgba(255,255,255,0.12)",
        border: "1.5px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(12px)",
        borderRadius: "14px",
        padding: "16px 22px",
        textAlign: "center",
        minWidth: "86px",
        cursor: "default",
      }}
    >
      <div style={{ fontSize: "34px", fontWeight: 900, color: "#ffffff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {String(value).padStart(2, "0")}
      </div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "6px", fontWeight: 700 }}>
        {label}
      </div>
    </motion.div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, gradient, delay = 0, prefix = "", suffix = "", raw = false,
}: {
  icon: React.ElementType; label: string; value: number | string; sub: string;
  gradient: string; delay?: number; prefix?: string; suffix?: string; raw?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -7, boxShadow: "0 20px 48px rgba(0,0,0,0.18)" }}
      style={{
        background: gradient,
        borderRadius: "20px",
        padding: "26px",
        cursor: "default",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
      }}
    >
      {/* decorative circle */}
      <div style={{
        position: "absolute", top: "-24px", right: "-24px",
        width: "100px", height: "100px", borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
      }} />
      <div style={{
        position: "absolute", bottom: "-32px", right: "16px",
        width: "70px", height: "70px", borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
      }} />

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
            {label}
          </span>
          <div style={{
            width: "38px", height: "38px", borderRadius: "12px",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={17} color="rgba(255,255,255,0.9)" />
          </div>
        </div>
        <div style={{ fontSize: "36px", fontWeight: 900, lineHeight: 1.1, color: "#fff" }}>
          {raw ? value : <AnimatedNumber value={value as number} prefix={prefix} suffix={suffix} />}
        </div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "6px", fontWeight: 500 }}>
          {sub}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Invoice Card ─────────────────────────────────────────────────────────────
function InvoiceCard({ inv, index }: { inv: ReturnType<typeof getMonthlyInvoices>[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const palette = YEAR_PALETTES[inv.year] ?? YEAR_PALETTES[2025];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.04 + index * 0.045, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -8, boxShadow: "0 24px 52px rgba(0,0,0,0.14)" }}
      style={{
        background: "#ffffff",
        border: hovered ? "1.5px solid transparent" : "1.5px solid #f1f5f9",
        borderRadius: "18px",
        overflow: "hidden",
        cursor: "default",
        boxShadow: hovered ? "0 24px 52px rgba(0,0,0,0.14)" : "0 2px 12px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        position: "relative",
      }}
    >
      {/* Gradient top strip */}
      <div style={{
        background: palette.bg,
        padding: "20px 20px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
        <div style={{ position: "absolute", bottom: "-30px", left: "40px", width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>
              {inv.invoiceNo}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", lineHeight: 1.1 }}>
              {inv.shortMonth}
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
              {inv.year}
            </div>
          </div>

          <motion.div
            animate={hovered ? { rotate: 10, scale: 1.1 } : { rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Receipt size={19} color="#ffffff" />
          </motion.div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "18px 20px" }}>
        {/* Amount */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
              Amount
            </div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a" }}>
              400 {CURRENCY_SYMBOL}
            </div>
          </div>
          <motion.div
            animate={hovered ? { scale: 1.08 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              background: "#dcfce7", color: "#15803d",
              fontSize: "11px", fontWeight: 800,
              padding: "6px 13px", borderRadius: "999px",
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}
          >
            <CheckCircle2 size={12} /> Paid
          </motion.div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#f1f5f9", margin: "0 0 14px" }} />

        {/* Meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Billing Period</span>
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: 700 }}>{inv.period}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Due Date</span>
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: 700 }}>{inv.dueDate}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Service</span>
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: 700 }}>E-Learning Platform</span>
          </div>
        </div>

        {/* Progress bar (always full = paid) */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Payment</span>
            <span style={{ fontSize: "10px", color: "#15803d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>100%</span>
          </div>
          <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.1 + index * 0.045, duration: 0.7, ease: "easeOut" }}
              style={{ height: "100%", background: palette.bg, borderRadius: "999px" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Year Section ─────────────────────────────────────────────────────────────
function YearSection({ year, invoices }: { year: number; invoices: ReturnType<typeof getMonthlyInvoices> }) {
  const palette = YEAR_PALETTES[year] ?? YEAR_PALETTES[2025];
  const yearTotal = invoices.length * MONTHLY_RATE;

  return (
    <div style={{ marginBottom: "40px" }}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}
      >
        <div style={{
          padding: "6px 18px", borderRadius: "999px",
          background: palette.bg,
          fontSize: "13px", fontWeight: 800, color: "#fff",
          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        }}>
          {year}
        </div>
        <div style={{ flex: 1, height: "1.5px", background: "linear-gradient(to right,#e2e8f0,transparent)" }} />
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>
          {invoices.length} months · <span style={{ color: "#0f172a" }}>{yearTotal.toLocaleString()} {CURRENCY_SYMBOL}</span>
        </div>
      </motion.div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
        gap: "18px",
      }}>
        {invoices.map((inv, idx) => (
          <InvoiceCard key={inv.id} inv={inv} index={idx} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function InvoicePage() {
  const invoices = getMonthlyInvoices();
  const totalPaid = invoices.length * MONTHLY_RATE;
  const { days, hours, minutes, seconds } = useUptime();

  const byYear: Record<number, typeof invoices> = {};
  invoices.forEach((inv) => {
    if (!byYear[inv.year]) byYear[inv.year] = [];
    byYear[inv.year].push(inv);
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#312e81 100%)",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* BG decorative shapes */}
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "260px", height: "260px", borderRadius: "50%", background: "rgba(99,102,241,0.12)" }} />
        <div style={{ position: "absolute", bottom: "-40px", left: "30%", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(139,92,246,0.08)" }} />

        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "32px 32px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              <motion.div
                whileHover={{ rotate: 8, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                style={{
                  width: "56px", height: "56px", borderRadius: "16px",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.40)",
                }}
              >
                <FileText size={24} color="#ffffff" />
              </motion.div>
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "4px", fontWeight: 700 }}>
                  Invoice Management
                </div>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.5px" }}>
                  Dr. Mostafa Ibrahim
                </h1>
                <a
                  href="https://drmostafaibrahim.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#a5b4fc", fontSize: "13px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px", fontWeight: 500 }}
                >
                  <Globe size={12} /> drmostafaibrahim.com <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <motion.button
                onClick={() => window.print()}
                whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.18)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)",
                  color: "#fff", padding: "10px 20px", borderRadius: "12px",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  backdropFilter: "blur(8px)", transition: "background 0.2s",
                }}
              >
                <Printer size={14} /> Print / Export
              </motion.button>
            </div>
          </div>

          {/* Info pills */}
          <div style={{ marginTop: "24px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              { icon: Calendar, text: "Started: Oct 5, 2024" },
              { icon: DollarSign, text: `${MONTHLY_RATE} ${CURRENCY_SYMBOL} / month` },
              { icon: TrendingUp, text: "E-Learning Platform" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "7px",
                background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "999px", padding: "6px 14px",
                fontSize: "12px", color: "rgba(255,255,255,0.75)", fontWeight: 600,
              }}>
                <Icon size={12} color="rgba(255,255,255,0.5)" /> {text}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Body ── */}
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "36px 32px" }}>

        {/* ── Uptime Timer ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#312e81 100%)",
            borderRadius: "20px",
            padding: "28px 32px",
            marginBottom: "28px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(15,23,42,0.22)",
          }}
        >
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(99,102,241,0.10)" }} />
          <div style={{ position: "absolute", bottom: "-50px", left: "20%", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(139,92,246,0.07)" }} />

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 0 3px rgba(74,222,128,0.25)" }}
              />
              <Zap size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.5)" }}>
                System Live · Uptime Counter
              </span>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <UptimeBlock value={days} label="Days" />
              <UptimeBlock value={hours} label="Hours" />
              <UptimeBlock value={minutes} label="Minutes" />
              <UptimeBlock value={seconds} label="Seconds" />
              <div style={{ marginLeft: "8px" }}>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500, lineHeight: 1.8 }}>
                  Active since <strong style={{ color: "#a5b4fc" }}>Oct 5, 2024</strong>
                </div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                  as of <strong style={{ color: "#a5b4fc" }}>Apr 26, 2026</strong>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "18px", marginBottom: "40px" }}>
          <StatCard
            icon={Clock} label="Months Active" value={invoices.length}
            sub="Oct 2024 → Apr 2026"
            gradient="linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)"
            delay={0.2}
          />
          <StatCard
            icon={DollarSign} label="Monthly Rate" value={MONTHLY_RATE}
            sub={`Flat rate · ${CURRENCY}`} suffix={` ${CURRENCY_SYMBOL}`}
            gradient="linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)"
            delay={0.28}
          />
          <StatCard
            icon={TrendingUp} label="Total Paid" value={totalPaid}
            sub={`${invoices.length} invoices settled`} suffix={` ${CURRENCY_SYMBOL}`}
            gradient="linear-gradient(135deg,#10b981 0%,#0ea5e9 100%)"
            delay={0.36}
          />
          <StatCard
            icon={CheckCircle2} label="Cleared" value="100%" sub="All payments on time"
            gradient="linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)"
            delay={0.44} raw
          />
        </div>

        {/* ── Section title ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>
              Monthly Invoice Cards
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8" }}>
              {invoices.length} invoices · Total {totalPaid.toLocaleString()} {CURRENCY_SYMBOL} · All Paid
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {Object.entries(YEAR_PALETTES).map(([yr, pal]) => (
              <div key={yr} style={{
                padding: "5px 14px", borderRadius: "999px",
                background: pal.bg,
                fontSize: "12px", fontWeight: 700, color: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              }}>
                {yr}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Invoices by Year ── */}
        {Object.entries(byYear)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([year, yearInvoices]) => (
            <YearSection key={year} year={Number(year)} invoices={yearInvoices} />
          ))}

        {/* ── Grand Total Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.55 }}
          style={{
            background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#312e81 100%)",
            borderRadius: "20px",
            padding: "28px 36px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            boxShadow: "0 8px 32px rgba(15,23,42,0.20)",
            marginBottom: "28px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: "-30px", right: "60px", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(99,102,241,0.12)" }} />

          <div style={{ position: "relative" }}>
            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.45)", fontWeight: 700, marginBottom: "6px" }}>
              Grand Total Paid — {invoices.length} Months
            </div>
            <div style={{ fontSize: "42px", fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "-1px" }}>
              {totalPaid.toLocaleString()}<span style={{ fontSize: "18px", color: "rgba(255,255,255,0.7)", marginLeft: "6px" }}>{CURRENCY_SYMBOL}</span>
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "6px" }}>
              October 2024 → April 2026 · E-Learning Platform
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                Payment Status
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "rgba(74,222,128,0.15)", border: "1.5px solid rgba(74,222,128,0.3)",
                color: "#4ade80", padding: "10px 22px", borderRadius: "12px",
                fontSize: "15px", fontWeight: 800,
              }}>
                <CheckCircle2 size={17} /> All Invoices Settled
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}
        >
          <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
            Generated on <strong style={{ color: "#94a3b8" }}>April 26, 2026</strong> · Invoice Management System
          </div>
          <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
            <a href="https://drmostafaibrahim.com/" target="_blank" rel="noopener noreferrer"
              style={{ color: "#6366f1", textDecoration: "none", fontWeight: 700 }}>
              drmostafaibrahim.com
            </a>
            {" "}· All amounts in {CURRENCY} · Confidential
          </div>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @media print {
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}