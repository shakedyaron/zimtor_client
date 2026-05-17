import { useRef } from "react"
import { Link } from "react-router-dom"
import { motion, useScroll, useTransform } from "framer-motion"
import { Bell, TrendingUp, Link2, Scissors, Calendar, Clock, Smartphone } from "lucide-react"

const fakeApts = [
  { initials: "ד", name: "דני כהן", service: "תספורת גברים", time: "14:00", status: "confirmed", color: "#3b82f6" },
  { initials: "מ", name: "מיכל לוי", service: "גילוח זקן", time: "15:30", status: "pending", color: "#8b5cf6" },
  { initials: "א", name: "אורי פרץ", service: "תספורת + גילוח", time: "16:00", status: "pending", color: "#06b6d4" },
  { initials: "ש", name: "שרה מזרחי", service: "תספורת נשים", time: "17:00", status: "confirmed", color: "#10b981" },
]

const weekBars = [35, 58, 42, 75, 55, 88, 70]
const weekDays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]

const glass = "rounded-2xl border border-white/10 bg-white/7 backdrop-blur-xl"

function FloatCard1() {
  return (
    <div className={`${glass} p-4 shadow-2xl shadow-black/30`}>
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/25">
          <Bell className="h-3.5 w-3.5 text-green-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">תור חדש!</p>
          <p className="text-[10px] text-slate-500">לפני דקה</p>
        </div>
      </div>
      <div
        className="flex items-center gap-2 rounded-xl p-2"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: "rgba(59,130,246,0.25)", border: "1px solid rgba(59,130,246,0.4)" }}
        >
          ד
        </div>
        <div>
          <p className="text-xs font-medium text-white">דני כהן</p>
          <p className="text-[10px] text-slate-400">14:00 · תספורת גברים</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        <span className="text-[10px] text-green-400">ממתין לאישור</span>
      </div>
    </div>
  )
}

function FloatCard2() {
  return (
    <div className={`${glass} p-4 shadow-2xl shadow-black/30`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
          <p className="text-xs text-slate-400">תורים השבוע</p>
        </div>
        <span className="text-[10px] font-semibold text-green-400">↑ 12%</span>
      </div>
      <p className="mb-2.5 text-2xl font-bold text-white">24</p>
      <div className="flex h-8 items-end gap-0.5">
        {[4, 6, 5, 8, 6, 9, 7].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h * 3}px`,
              background:
                i === 5 ? "linear-gradient(to top, #3b82f6, #06b6d4)" : "rgba(59,130,246,0.22)",
              minHeight: "3px",
            }}
          />
        ))}
      </div>
    </div>
  )
}

function FloatCard3() {
  return (
    <div className={`${glass} p-4 shadow-2xl shadow-black/30`}>
      <div className="mb-2 flex items-center gap-1.5">
        <Link2 className="h-3.5 w-3.5 text-purple-400" />
        <p className="text-xs text-slate-400">קישור לעסק</p>
      </div>
      <div
        className="mb-2.5 rounded-xl px-3 py-2"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="font-mono text-xs font-medium text-blue-300" dir="ltr">
          zimtor.app/my-salon
        </p>
      </div>
      <div className="flex items-center justify-between">
        <button
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/25 transition hover:bg-blue-500/20"
          style={{ background: "rgba(59,130,246,0.12)" }}
        >
          העתק קישור
        </button>
        <span className="text-[10px] text-slate-500">47 ביקורים</span>
      </div>
    </div>
  )
}

function FloatCard4() {
  return (
    <div className={`${glass} p-4 shadow-2xl shadow-black/30`}>
      <div className="mb-2.5 flex items-center gap-1.5">
        <Scissors className="h-3.5 w-3.5 text-cyan-400" />
        <p className="text-xs text-slate-400">שירותים פעילים</p>
      </div>
      <div className="space-y-1.5">
        {[
          { name: "תספורת גברים", price: "₪80", color: "#06b6d4" },
          { name: "גילוח זקן", price: "₪50", color: "#3b82f6" },
          { name: "שניהם", price: "₪120", color: "#8b5cf6" },
        ].map(({ name, price, color }) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-lg px-2 py-1.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              <span className="text-xs text-slate-200">{name}</span>
            </div>
            <span className="text-xs font-bold" style={{ color }}>
              {price}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(8,17,31,0.92)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 0 80px rgba(59,130,246,0.16), 0 40px 80px rgba(0,0,0,0.45)",
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
        <div
          className="mx-auto flex items-center gap-2 rounded-md px-4 py-1"
          dir="ltr"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-green-400/80" />
          <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            zimtor.app/dashboard
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5" dir="rtl">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500">שלום 👋</p>
            <p className="text-sm font-bold text-white">ספרות דוד</p>
          </div>
          <div
            className="rounded-lg px-2.5 py-1 text-[10px] font-semibold text-green-400"
            style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.18)" }}
          >
            ● פעיל
          </div>
        </div>

        {/* Stats */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { val: "24", label: "תורים", sub: "+3 היום", color: "blue" },
            { val: "₪3.2K", label: "הכנסה", sub: "החודש", color: "cyan" },
            { val: "8", label: "שירותים", sub: "פעילים", color: "slate" },
          ].map(({ val, label, sub, color }) => (
            <div
              key={label}
              className="rounded-xl p-2.5 text-center"
              style={{
                background:
                  color === "blue"
                    ? "rgba(59,130,246,0.10)"
                    : color === "cyan"
                      ? "rgba(6,182,212,0.10)"
                      : "rgba(255,255,255,0.04)",
                border:
                  color === "blue"
                    ? "1px solid rgba(59,130,246,0.20)"
                    : color === "cyan"
                      ? "1px solid rgba(6,182,212,0.20)"
                      : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                className={`text-lg font-bold sm:text-xl ${
                  color === "blue"
                    ? "text-blue-300"
                    : color === "cyan"
                      ? "text-cyan-300"
                      : "text-white"
                }`}
              >
                {val}
              </p>
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-[9px] text-green-400/70">{sub}</p>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div
          className="mb-3 rounded-xl p-3"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400">ביצועים השבוע</span>
            <span className="text-[10px] font-semibold text-green-400">↑ 12%</span>
          </div>
          <div className="flex items-end gap-1">
            {weekBars.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: `${Math.round((h / 100) * 28)}px`,
                    background:
                      i === 5
                        ? "linear-gradient(to top, rgba(59,130,246,0.9), rgba(6,182,212,0.6))"
                        : "rgba(59,130,246,0.22)",
                    minHeight: "3px",
                  }}
                />
                <span className="text-[8px] text-slate-600">{weekDays[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments header */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            תורים היום
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-blue-400"
            style={{ background: "rgba(59,130,246,0.12)" }}
          >
            4 תורים
          </span>
        </div>

        {/* Appointment rows */}
        <div className="space-y-1.5">
          {fakeApts.map((apt) => (
            <div
              key={apt.name}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{
                  background: apt.color + "30",
                  border: `1px solid ${apt.color}55`,
                }}
              >
                {apt.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{apt.name}</p>
                <p className="truncate text-[10px] text-slate-500">{apt.service}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-mono text-[11px] text-slate-300" dir="ltr">
                  {apt.time}
                </span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{
                    background:
                      apt.status === "confirmed"
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(251,191,36,0.12)",
                    color: apt.status === "confirmed" ? "#4ade80" : "#fbbf24",
                    border:
                      apt.status === "confirmed"
                        ? "1px solid rgba(34,197,94,0.25)"
                        : "1px solid rgba(251,191,36,0.2)",
                  }}
                >
                  {apt.status === "confirmed" ? "מאושר" : "ממתין"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    icon: Calendar,
    color: "blue",
    title: "הזמנות אונליין 24/7",
    desc: "לקוחות קובעים תורים בכל שעה דרך דף ההזמנה האישי שלך — בלי טלפונים, בלי בלגן.",
  },
  {
    icon: Clock,
    color: "cyan",
    title: "ניהול תורים בקליק",
    desc: "רואים את כל התורים, מאשרים, מבטלים ומנהלים שירותים ממסך אחד פשוט.",
  },
  {
    icon: Smartphone,
    color: "purple",
    title: "מותאם לנייד",
    desc: "הלקוחות מזמינים מהטלפון, אתם מנהלים מהטלפון. הכל עובד מושלם בכל מכשיר.",
  },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -70])
  const mockupScale = useTransform(scrollYProgress, [0, 1], [1, 1.05])

  const f1X = useTransform(scrollYProgress, [0, 1], [0, 55])
  const f1Y = useTransform(scrollYProgress, [0, 1], [0, -35])
  const f2X = useTransform(scrollYProgress, [0, 1], [0, -50])
  const f2Y = useTransform(scrollYProgress, [0, 1], [0, -25])
  const f3X = useTransform(scrollYProgress, [0, 1], [0, 65])
  const f3Y = useTransform(scrollYProgress, [0, 1], [0, 30])
  const f4X = useTransform(scrollYProgress, [0, 1], [0, -55])
  const f4Y = useTransform(scrollYProgress, [0, 1], [0, 40])

  const glow1X = useTransform(scrollYProgress, [0, 1], [0, -40])
  const glow2X = useTransform(scrollYProgress, [0, 1], [0, 40])

  return (
    <div dir="rtl" style={{ background: "#050816", minHeight: "100vh" }}>
      {/* ── HERO ─────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-x-hidden"
        style={{ minHeight: "100vh" }}
      >
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -right-60 -top-40 h-150 w-150 rounded-full"
            style={{
              x: glow1X,
              filter: "blur(140px)",
              opacity: 0.09,
              background: "radial-gradient(circle, #3b82f6, transparent 70%)",
            }}
          />
          <motion.div
            className="absolute -left-40 top-20 h-125 w-125 rounded-full"
            style={{
              x: glow2X,
              filter: "blur(120px)",
              opacity: 0.06,
              background: "radial-gradient(circle, #06b6d4, transparent 70%)",
            }}
          />
          {/* Third subtle glow */}
          <div
            className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full"
            style={{
              filter: "blur(100px)",
              opacity: 0.045,
              background: "radial-gradient(circle, #6366f1, transparent 70%)",
            }}
          />
          {/* Grid — very soft */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.011) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.011) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
          {/* Vignette over grid so it fades near center */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 20%, transparent 20%, rgba(5,8,22,0.65) 80%)",
            }}
          />
        </div>

        {/* Nav */}
        <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-heading bg-linear-to-r from-white to-slate-300 bg-clip-text text-2xl font-extrabold text-transparent">
            zimtor
          </span>
          <Link to="/auth">
            <button className="rounded-xl border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10">
              כניסה / הרשמה
            </button>
          </Link>
        </nav>

        {/* Hero text */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/9 px-4 py-1.5 text-xs font-medium text-blue-300"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            ניהול תורים חכם לעסקים קטנים
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="font-heading mb-6 text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            הדרך החכמה
            <br />
            לקבוע תורים
            <br />
            <span className="bg-linear-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              בלי כאב ראש
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            Zimtor עוזרת לעסקים קטנים לקבל תורים אונליין, לנהל שירותים, ולראות את כל
            ההזמנות במקום אחד.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/auth">
              <button className="w-full rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition hover:opacity-90 hover:shadow-blue-500/50 sm:w-auto">
                התחילו בחינם
              </button>
            </Link>
            <Link to="/auth">
              <button className="w-full rounded-xl border border-white/12 bg-white/6 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto">
                צפו בדוגמה
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Dashboard preview */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-32">
          {/* XL: 3-column layout with floating side cards */}
          <div className="hidden xl:grid xl:grid-cols-[220px_1fr_220px] xl:items-start xl:gap-6">
            {/* Left floating cards */}
            <div className="mt-14 flex flex-col gap-4">
              <motion.div style={{ x: f2X, y: f2Y }}>
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <FloatCard2 />
                </motion.div>
              </motion.div>
              <motion.div style={{ x: f4X, y: f4Y }}>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
                >
                  <FloatCard4 />
                </motion.div>
              </motion.div>
            </div>

            {/* Center — initial fade-in, then scroll transform on inner */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <motion.div style={{ y: mockupY, scale: mockupScale }}>
                <DashboardMockup />
              </motion.div>
            </motion.div>

            {/* Right floating cards */}
            <div className="mt-4 flex flex-col gap-4">
              <motion.div style={{ x: f1X, y: f1Y }}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                >
                  <FloatCard1 />
                </motion.div>
              </motion.div>
              <motion.div style={{ x: f3X, y: f3Y }}>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.3, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                >
                  <FloatCard3 />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Mobile / tablet */}
          <div className="xl:hidden">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ y: mockupY }}
            >
              <DashboardMockup />
            </motion.div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.65 }}
              >
                <FloatCard1 />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.75 }}
              >
                <FloatCard2 />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
          style={{ background: "linear-gradient(to bottom, transparent, #08111f)" }}
        />
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section style={{ background: "#08111f" }} className="px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="font-heading mb-3 text-3xl font-extrabold text-white sm:text-4xl">
              ניהול תורים מעולם לא היה קל יותר
            </h2>
            <p className="mx-auto max-w-md text-slate-400">
              כל מה שצריך כדי לנהל את התורים של העסק שלך — במקום אחד, בפשטות.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`${glass} p-6 transition-colors duration-300 hover:bg-white/10`}
                style={{
                  boxShadow:
                    f.color === "blue"
                      ? "0 0 0 1px rgba(59,130,246,0.15), 0 8px 32px rgba(59,130,246,0.06)"
                      : f.color === "cyan"
                        ? "0 0 0 1px rgba(6,182,212,0.15), 0 8px 32px rgba(6,182,212,0.06)"
                        : "0 0 0 1px rgba(168,85,247,0.15), 0 8px 32px rgba(168,85,247,0.06)",
                }}
              >
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background:
                      f.color === "blue"
                        ? "rgba(59,130,246,0.15)"
                        : f.color === "cyan"
                          ? "rgba(6,182,212,0.15)"
                          : "rgba(168,85,247,0.15)",
                    border:
                      f.color === "blue"
                        ? "1px solid rgba(59,130,246,0.25)"
                        : f.color === "cyan"
                          ? "1px solid rgba(6,182,212,0.25)"
                          : "1px solid rgba(168,85,247,0.25)",
                  }}
                >
                  <f.icon
                    className={`h-5 w-5 ${
                      f.color === "blue"
                        ? "text-blue-400"
                        : f.color === "cyan"
                          ? "text-cyan-400"
                          : "text-purple-400"
                    }`}
                  />
                </div>
                <h3 className="font-heading mb-2 text-lg font-bold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0d1f3f 0%, #050816 100%)",
          borderTop: "1px solid rgba(59,130,246,0.15)",
        }}
        className="px-6 py-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className="font-heading mb-3 text-3xl font-extrabold text-white sm:text-4xl">
            מוכנים להתחיל?
          </h2>
          <p className="mb-8 text-slate-400">
            הצטרפו לעסקים שכבר מנהלים את התורים שלהם עם zimtor. בחינם, בלי כרטיס אשראי.
          </p>
          <Link to="/auth">
            <button className="rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 px-10 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-90 hover:shadow-blue-500/45">
              התחילו בחינם עכשיו
            </button>
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer
        style={{ background: "#050816", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        className="px-6 py-8 text-center"
      >
        <span className="font-heading bg-linear-to-r from-white to-slate-400 bg-clip-text text-lg font-extrabold text-transparent">
          zimtor
        </span>
        <span className="mx-3 text-white/10">·</span>
        <span className="text-xs text-slate-600">© 2026 · ניהול תורים לעסקים</span>
      </footer>
    </div>
  )
}
