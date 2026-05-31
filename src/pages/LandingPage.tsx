import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion"
import { Link2, Scissors, Calendar, Clock, Smartphone } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"

const previewAppointments = [
  {
    name: "\u05d3\u05e0\u05d9 \u05db\u05d4\u05df",
    service:
      "\u05ea\u05e1\u05e4\u05d5\u05e8\u05ea \u05d2\u05d1\u05e8\u05d9\u05dd",
    phone: "050-123-4567",
    date: "\u05d4\u05d9\u05d5\u05dd",
    time: "14:00",
    color: "#6366f1",
  },
  {
    name: "\u05de\u05d9\u05db\u05dc \u05dc\u05d5\u05d9",
    service: "\u05d2\u05d9\u05dc\u05d5\u05d7 \u05d6\u05e7\u05df",
    phone: "052-765-4321",
    date: "\u05de\u05d7\u05e8",
    time: "15:30",
    color: "#a78bfa",
  },
  {
    name: "\u05d0\u05d5\u05e8\u05d9 \u05e4\u05e8\u05e5",
    service: "\u05ea\u05e1\u05e4\u05d5\u05e8\u05ea + \u05d6\u05e7\u05df",
    phone: "054-111-2233",
    date: "\u05de\u05d7\u05e8",
    time: "16:00",
    color: "#38bdf8",
  },
]

const previewServices = [
  {
    name: "\u05ea\u05e1\u05e4\u05d5\u05e8\u05ea \u05d2\u05d1\u05e8\u05d9\u05dd",
    duration: "30 \u05d3\u05e7\u05d5\u05ea",
    price: "\u20aa80",
  },
  {
    name: "\u05d2\u05d9\u05dc\u05d5\u05d7 \u05d6\u05e7\u05df",
    duration: "20 \u05d3\u05e7\u05d5\u05ea",
    price: "\u20aa50",
  },
  {
    name: "\u05ea\u05e1\u05e4\u05d5\u05e8\u05ea + \u05d6\u05e7\u05df",
    duration: "45 \u05d3\u05e7\u05d5\u05ea",
    price: "\u20aa120",
  },
]
const glass =
  "rounded-2xl border border-white/10 bg-white/7 backdrop-blur-md sm:backdrop-blur-xl"

function FloatCard1() {
  return (
    <div className={`${glass} p-4 shadow-2xl shadow-black/30`}>
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/12 ring-1 ring-indigo-500/20">
          <Calendar className="h-3.5 w-3.5 text-indigo-300" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">
            {"\u05ea\u05d5\u05e8 \u05e7\u05e8\u05d5\u05d1"}
          </p>
          <p className="text-[10px] text-slate-500">
            {"\u05d4\u05d9\u05d5\u05dd \u05d1\u05e9\u05e2\u05d4 14:00"}
          </p>
        </div>
      </div>
      <div
        className="flex items-center gap-2 rounded-xl p-2"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{
            background: "rgba(99,102,241,0.22)",
            border: "1px solid rgba(99,102,241,0.35)",
          }}
        >
          ד
        </div>
        <div>
          <p className="text-xs font-medium text-white">דני כהן</p>
          <p className="text-[10px] text-slate-400">14:00 · תספורת גברים</p>
        </div>
      </div>
    </div>
  )
}

function FloatCard2() {
  return (
    <div className={`${glass} p-4 shadow-2xl shadow-black/30`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
          <p className="text-xs text-slate-400">
            {
              "\u05ea\u05d5\u05e8\u05d9\u05dd \u05e7\u05e8\u05d5\u05d1\u05d9\u05dd"
            }
          </p>
        </div>
        <span className="rounded-full bg-indigo-500/12 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
          3
        </span>
      </div>
      <p className="bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text font-heading text-3xl leading-none font-bold text-transparent">
        3
      </p>
      <div className="mt-2 rounded-xl border border-indigo-300/10 bg-slate-950/35 px-3 py-2">
        <p className="text-[10px] font-medium text-slate-300">
          {"\u05d3\u05e0\u05d9 \u05db\u05d4\u05df"}
        </p>
        <p className="text-[10px] text-slate-500" dir="ltr">
          14:00 · 050-123-4567
        </p>
      </div>
    </div>
  )
}

function FloatCard3() {
  return (
    <div className={`${glass} p-4 shadow-2xl shadow-black/30`}>
      <div className="mb-2 flex items-center gap-1.5">
        <Link2 className="h-3.5 w-3.5 text-violet-400" />
        <p className="text-xs text-slate-400">קישור לעסק</p>
      </div>
      <div
        className="mb-2.5 rounded-xl px-3 py-2"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p className="font-mono text-xs font-medium text-indigo-300" dir="ltr">
          zimtor.co/my-salon
        </p>
      </div>
      <div className="flex items-center justify-between">
        <button
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition hover:bg-indigo-500/15"
          style={{ background: "rgba(99,102,241,0.10)" }}
        >
          העתק קישור
        </button>
        <span className="text-[10px] text-slate-500">
          {"\u05d3\u05e3 \u05e4\u05e2\u05d9\u05dc"}
        </span>
      </div>
    </div>
  )
}

function FloatCard4() {
  return (
    <div className={`${glass} p-4 shadow-2xl shadow-black/30`}>
      <div className="mb-2.5 flex items-center gap-1.5">
        <Scissors className="h-3.5 w-3.5 text-sky-400" />
        <p className="text-xs text-slate-400">שירותים פעילים</p>
      </div>
      <div className="space-y-1.5">
        {[
          { name: "תספורת גברים", price: "₪80", color: "#38bdf8" },
          { name: "גילוח זקן", price: "₪50", color: "#6366f1" },
          { name: "שניהם", price: "₪120", color: "#a78bfa" },
        ].map(({ name, price, color }) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-lg px-2 py-1.5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: color }}
              />
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
        boxShadow:
          "0 0 60px rgba(99,102,241,0.10), 0 40px 80px rgba(0,0,0,0.50)",
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
          <span
            className="font-mono text-xs"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            zimtor.co/dashboard
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
            style={{
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.18)",
            }}
          >
            ● פעיל
          </div>
        </div>

        {/* Stats */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            {
              val: "3",
              label: "\u05ea\u05d5\u05e8\u05d9\u05dd",
              sub: "\u05e7\u05e8\u05d5\u05d1\u05d9\u05dd",
              color: "blue",
            },
            {
              val: "3",
              label: "\u05e9\u05d9\u05e8\u05d5\u05ea\u05d9\u05dd",
              sub: "\u05e4\u05e2\u05d9\u05dc\u05d9\u05dd",
              color: "cyan",
            },
            {
              val: "1",
              label: "\u05e7\u05d9\u05e9\u05d5\u05e8",
              sub: "\u05dc\u05d4\u05d6\u05de\u05e0\u05d5\u05ea",
              color: "slate",
            },
          ].map(({ val, label, sub, color }) => (
            <div
              key={label}
              className="rounded-xl p-2.5 text-center"
              style={{
                background:
                  color === "blue"
                    ? "rgba(99,102,241,0.08)"
                    : color === "cyan"
                      ? "rgba(56,189,248,0.08)"
                      : "rgba(255,255,255,0.04)",
                border:
                  color === "blue"
                    ? "1px solid rgba(99,102,241,0.16)"
                    : color === "cyan"
                      ? "1px solid rgba(56,189,248,0.16)"
                      : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                className={`text-lg font-bold sm:text-xl ${
                  color === "blue"
                    ? "text-indigo-300"
                    : color === "cyan"
                      ? "text-sky-300"
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

        {/* Services panel */}
        <div
          className="mb-3 overflow-hidden rounded-xl"
          style={{
            background: "rgba(7,12,29,0.90)",
            border: "1px solid rgba(99,102,241,0.10)",
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2.5"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}
          >
            <p className="font-heading text-[11px] font-bold text-slate-50">
              {"\u05e9\u05d9\u05e8\u05d5\u05ea\u05d9\u05dd"}
            </p>
            <span className="rounded-full bg-indigo-500/12 px-2 py-0.5 text-[9px] font-semibold text-indigo-300">
              3
            </span>
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "rgba(99,102,241,0.08)" }}
          >
            {previewServices.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-50">
                    {service.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{service.duration}</span>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-sky-300">
                  {service.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking link */}
        <div
          className="mb-3 rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(7,12,29,0.90)",
            border: "1px solid rgba(99,102,241,0.18)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-0.5 text-[10px] font-medium text-slate-400">
                {
                  "\u05e7\u05d9\u05e9\u05d5\u05e8 \u05dc\u05d3\u05e3 \u05d4\u05d4\u05d6\u05de\u05e0\u05d5\u05ea"
                }
              </p>
              <p
                className="truncate font-mono text-[11px] font-semibold text-sky-300"
                dir="ltr"
              >
                zimtor.co/davidbarber
              </p>
            </div>
            <Link2 className="h-3.5 w-3.5 shrink-0 text-indigo-300" />
          </div>
        </div>

        {/* Appointments header */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
            {
              "\u05ea\u05d5\u05e8\u05d9\u05dd \u05e7\u05e8\u05d5\u05d1\u05d9\u05dd"
            }
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-indigo-400"
            style={{ background: "rgba(99,102,241,0.10)" }}
          >
            3
          </span>
        </div>

        {/* Appointment rows */}
        <div className="space-y-1.5">
          {previewAppointments.map((apt) => (
            <div
              key={apt.name}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5"
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
                {apt.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {apt.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                  <span className="font-medium text-slate-400">
                    {apt.service}
                  </span>
                  <span dir="ltr">{apt.phone}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className="font-mono text-[11px] text-slate-300"
                  dir="ltr"
                >
                  {apt.time}
                </span>
                <span className="text-[9px] font-medium text-slate-500">
                  {apt.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const BUSINESS_TYPES = [
  "ספר / ספרית",
  "מכון יופי",
  "מניקיור / פדיקיור",
  "קוסמטיקאי/ת",
  "מאמן/ת אישי/ת",
  "מרפאה קטנה",
  "אחר",
]

const fieldStyle: React.CSSProperties = {
  fontSize: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  color: "white",
  padding: "12px 16px",
  width: "100%",
  outline: "none",
}

function LeadModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [bizName, setBizName] = useState("")
  const [bizType, setBizType] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanPhone = phone.replace(/[-\s]/g, "")
    if (!cleanPhone) {
      setError("יש להזין מספר טלפון.")
      return
    }
    if (!/^\d+$/.test(cleanPhone)) {
      setError("מספר טלפון חייב להכיל ספרות בלבד.")
      return
    }
    if (!/^05\d{8}$/.test(cleanPhone)) {
      setError(
        "מספר טלפון לא תקין. יש להזין מספר נייד ישראלי (10 ספרות, מתחיל ב-05)."
      )
      return
    }

    setSubmitting(true)
    const payload = {
      full_name: name.trim(),
      phone: cleanPhone,
      business_name: bizName.trim(),
      business_type: bizType || null,
      note: note.trim() || null,
    }
    console.log("[leads] insert payload:", payload)
    const { error: insertError } = await supabase.from("leads").insert(payload)
    setSubmitting(false)

    if (insertError) {
      console.error("[leads] insert error:", insertError)
      setError("שגיאה בשליחת הפרטים. נסה שוב מאוחר יותר.")
      return
    }
    setSuccess(true)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      dir="rtl"
    >
      <motion.div
        className="w-full max-w-md overflow-hidden"
        style={{
          borderRadius: "20px",
          background: "rgba(8,13,30,0.98)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(30px)",
          boxShadow:
            "0 0 60px rgba(99,102,241,0.15), 0 30px 70px rgba(0,0,0,0.65)",
        }}
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2 className="font-heading text-lg font-bold text-white">
            קבלו הדגמה
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-slate-400 transition hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            סגור
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 text-center"
            >
              <div
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.30)",
                }}
              >
                <svg
                  className="h-6 w-6 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-heading text-xl font-bold text-white">תודה!</p>
              <p className="mt-2 text-sm text-slate-400">
                קיבלנו את הפרטים, נחזור אליך בקרוב.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  שם מלא
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  טלפון
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0501234567"
                  dir="ltr"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  שם העסק
                </label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder='ספרות דוד'
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  סוג העסק
                </label>
                <select
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value)}
                  style={{ ...fieldStyle, appearance: "none" as const }}
                >
                  <option value="" style={{ background: "#0d1224" }}>
                    בחר סוג עסק
                  </option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t} style={{ background: "#0d1224" }}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  הערה (אופציונלי)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ספר לנו קצת על העסק שלך..."
                  rows={2}
                  style={{ ...fieldStyle, resize: "none" as const }}
                />
              </div>

              {error && (
                <p
                  className="rounded-xl px-3 py-2.5 text-sm text-red-400"
                  style={{ background: "rgba(239,68,68,0.10)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 py-3 text-base font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "שולח..." : "שלח פרטים"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
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
    desc: "רואים תורים קרובים, פרטי לקוחות ושירותים פעילים ממסך אחד פשוט.",
  },
  {
    icon: Smartphone,
    color: "purple",
    title: "מותאם לנייד",
    desc: "הלקוחות מזמינים מהטלפון, אתם מנהלים מהטלפון. הכל עובד מושלם בכל מכשיר.",
  },
]

export default function LandingPage() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)

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
            className="absolute -top-40 -right-60 hidden h-150 w-150 rounded-full sm:block"
            style={{
              x: glow1X,
              filter: "blur(160px)",
              opacity: 0.07,
              background: "radial-gradient(circle, #6366f1, transparent 70%)",
            }}
          />
          <motion.div
            className="absolute top-20 -left-40 hidden h-125 w-125 rounded-full sm:block"
            style={{
              x: glow2X,
              filter: "blur(140px)",
              opacity: 0.05,
              background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
            }}
          />
          {/* Third subtle glow */}
          <div
            className="absolute bottom-0 left-1/2 hidden h-96 w-96 -translate-x-1/2 rounded-full sm:block"
            style={{
              filter: "blur(120px)",
              opacity: 0.035,
              background: "radial-gradient(circle, #a78bfa, transparent 70%)",
            }}
          />
          {/* Grid — very soft */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(99,102,241,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.014) 1px, transparent 1px)",
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
          <span className="bg-linear-to-r from-white to-slate-300 bg-clip-text font-heading text-2xl font-extrabold text-transparent">
            zimtor
          </span>
          <Link to={user ? "/dashboard" : "/auth"}>
            <button className="rounded-xl border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10">
              כניסה לבעל עסק
            </button>
          </Link>
        </nav>

        {/* Hero text */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-16 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-4 py-1.5 text-xs font-medium text-indigo-300"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            ניהול תורים חכם לעסקים קטנים
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="mb-6 font-heading text-5xl leading-tight font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            הדרך החכמה
            <br />
            לקבוע תורים
            <br />
            <span className="bg-linear-to-r from-indigo-200 via-violet-200 to-indigo-200 bg-clip-text text-transparent">
              בלי כאב ראש
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            Zimtor עוזרת לעסקים קטנים לקבל תורים אונליין, לנהל שירותים, ולראות
            את כל ההזמנות במקום אחד.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <button
              onClick={() => setShowModal(true)}
              className="w-full rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-90 hover:shadow-indigo-500/35 sm:w-auto"
            >
              קבלו הדגמה
            </button>
            <Link to="/davidbarber">
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
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <FloatCard2 />
                </motion.div>
              </motion.div>
              <motion.div style={{ x: f4X, y: f4Y }}>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 5.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.8,
                  }}
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
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0,
                  }}
                >
                  <FloatCard1 />
                </motion.div>
              </motion.div>
              <motion.div style={{ x: f3X, y: f3Y }}>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 4.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.2,
                  }}
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
          style={{
            background: "linear-gradient(to bottom, transparent, #07091a)",
          }}
        />
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section style={{ background: "#07091a" }} className="px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-3 font-heading text-3xl font-extrabold text-white sm:text-4xl">
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
                      ? "0 0 0 1px rgba(99,102,241,0.12), 0 8px 28px rgba(99,102,241,0.05)"
                      : f.color === "cyan"
                        ? "0 0 0 1px rgba(56,189,248,0.12), 0 8px 28px rgba(56,189,248,0.05)"
                        : "0 0 0 1px rgba(167,139,250,0.12), 0 8px 28px rgba(167,139,250,0.05)",
                }}
              >
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background:
                      f.color === "blue"
                        ? "rgba(99,102,241,0.12)"
                        : f.color === "cyan"
                          ? "rgba(56,189,248,0.12)"
                          : "rgba(167,139,250,0.12)",
                    border:
                      f.color === "blue"
                        ? "1px solid rgba(99,102,241,0.22)"
                        : f.color === "cyan"
                          ? "1px solid rgba(56,189,248,0.22)"
                          : "1px solid rgba(167,139,250,0.22)",
                  }}
                >
                  <f.icon
                    className={`h-5 w-5 ${
                      f.color === "blue"
                        ? "text-indigo-400"
                        : f.color === "cyan"
                          ? "text-sky-400"
                          : "text-violet-400"
                    }`}
                  />
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0c1528 0%, #060814 100%)",
          borderTop: "1px solid rgba(99,102,241,0.10)",
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
          <h2 className="mb-3 font-heading text-3xl font-extrabold text-white sm:text-4xl">
            מוכנים להתחיל?
          </h2>
          <p className="mb-8 text-slate-400">
            הצטרפו לעסקים שכבר מנהלים את התורים שלהם עם zimtor. בחינם, בלי כרטיס
            אשראי.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-10 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/15 transition hover:opacity-90 hover:shadow-indigo-500/28"
          >
            קבלו הדגמה
          </button>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer
        style={{
          background: "#050816",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
        className="px-6 py-8 text-center"
      >
        <span className="bg-linear-to-r from-white to-slate-400 bg-clip-text font-heading text-lg font-extrabold text-transparent">
          zimtor
        </span>
        <span className="mx-3 text-white/10">·</span>
        <span className="text-xs text-slate-600">
          © 2026 · ניהול תורים לעסקים
        </span>
      </footer>

      <AnimatePresence>
        {showModal && <LeadModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
