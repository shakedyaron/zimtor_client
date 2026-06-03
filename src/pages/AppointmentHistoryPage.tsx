import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Filter } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Appointment } from "@/types"

type AppointmentStatus = "future" | "completed" | "cancelled" | "no_show"
type StatusFilter = "all" | AppointmentStatus
type DateRangeFilter = "today" | "week" | "month" | "custom"
type AppointmentWithService = Appointment & {
  services?: {
    name: string
    price: number | null
    duration_minutes: number | null
  } | null
}

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; badgeClass: string }
> = {
  future: {
    label: "עתידי",
    badgeClass: "bg-violet-100 text-violet-700 border-violet-200",
  },
  completed: {
    label: "בוצע",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "בוטל",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
  no_show: {
    label: "לא הגיע",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
  },
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "הכל" },
  { value: "completed", label: "בוצעו" },
  { value: "cancelled", label: "בוטלו" },
  { value: "no_show", label: "לא הגיעו" },
  { value: "future", label: "עתידיים" },
]

const DATE_RANGE_FILTERS: { value: DateRangeFilter; label: string }[] = [
  { value: "today", label: "היום" },
  { value: "week", label: "שבוע" },
  { value: "month", label: "חודש" },
  { value: "custom", label: "מותאם" },
]

function normalizeAppointmentStatus(status?: string | null): AppointmentStatus {
  if (
    status === "completed" ||
    status === "cancelled" ||
    status === "no_show"
  ) {
    return status
  }
  return "future"
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function getTodayRange() {
  const d = formatLocalDate(new Date())
  return { start: d, end: d }
}

function getCurrentWeekRange() {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek)
  const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6)
  return { start: formatLocalDate(sunday), end: formatLocalDate(saturday) }
}

function getCurrentMonthRange() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return { start: formatLocalDate(firstDay), end: formatLocalDate(lastDay) }
}

function formatHistoryDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("he-IL")
}

function resolveDateRange(
  filter: DateRangeFilter,
  customStart: string,
  customEnd: string
) {
  if (filter === "custom") {
    const fallback = formatLocalDate(new Date())
    return {
      start: customStart || fallback,
      end: customEnd || customStart || fallback,
    }
  }
  if (filter === "week") return getCurrentWeekRange()
  if (filter === "month") return getCurrentMonthRange()
  return getTodayRange()
}

export default function AppointmentHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>("month")
  const [customStart, setCustomStart] = useState(formatLocalDate(new Date()))
  const [customEnd, setCustomEnd] = useState(formatLocalDate(new Date()))

  const appointmentsRef = useRef<AppointmentWithService[]>([])
  appointmentsRef.current = appointments

  async function runAutoComplete(apts: AppointmentWithService[]) {
    const now = Date.now()
    const toComplete = apts.filter((apt) => {
      if (normalizeAppointmentStatus(apt.status) !== "future") return false
      const [year, month, day] = apt.appointment_date.split("-").map(Number)
      const [hour, minute] = (apt.appointment_time ?? "")
        .slice(0, 5)
        .split(":")
        .map(Number)
      if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day) ||
        !Number.isFinite(hour) ||
        !Number.isFinite(minute)
      )
        return false
      const duration = apt.services?.duration_minutes ?? 30
      const endMinutes = hour * 60 + minute + duration
      const endDate = new Date(
        year,
        month - 1,
        day,
        Math.floor(endMinutes / 60),
        endMinutes % 60
      )
      return endDate.getTime() < now
    })
    if (!toComplete.length) return
    const ids = toComplete.map((a) => a.id)
    const { error } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .in("id", ids)
    if (error) return
    setAppointments((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, status: "completed" } : a))
    )
  }

  const dateRange = useMemo(
    () => resolveDateRange(dateRangeFilter, customStart, customEnd),
    [customEnd, customStart, dateRangeFilter]
  )

  useEffect(() => {
    if (!user) return
    let ignore = false

    async function loadHistory() {
      setLoading(true)
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user!.id)
        .maybeSingle()

      if (ignore) return
      if (!business) {
        navigate("/dashboard")
        return
      }

      if (import.meta.env.DEV) {
        console.log("history date range", {
          filter: dateRangeFilter,
          startDate: dateRange.start,
          endDate: dateRange.end,
        })
      }

      const { data } = await supabase
        .from("appointments")
        .select("*, services(name, price, duration_minutes)")
        .eq("business_id", business.id)
        .gte("appointment_date", dateRange.start)
        .lte("appointment_date", dateRange.end)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false })
      if (ignore) return
      const freshApts = (data as AppointmentWithService[]) ?? []
      setAppointments(freshApts)
      setLoading(false)
      if (freshApts.length) runAutoComplete(freshApts)
    }

    loadHistory()
    return () => {
      ignore = true
    }
  }, [dateRange.end, dateRange.start, dateRangeFilter, navigate, user])

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "all") return appointments
    return appointments.filter(
      (appointment) =>
        normalizeAppointmentStatus(appointment.status) === statusFilter
    )
  }, [appointments, statusFilter])

  const completedRevenue = filteredAppointments.reduce((total, appointment) => {
    if (normalizeAppointmentStatus(appointment.status) !== "completed") {
      return total
    }
    return total + (appointment.services?.price ?? 0)
  }, 0)

  return (
    <div className="min-h-dvh bg-[#F6F7FB]" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
            aria-label="חזרה לדשבורד"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-lg font-black text-slate-950 sm:text-2xl">
              היסטוריית תורים
            </h1>
            <p className="hidden text-sm text-slate-500 sm:block">
              מעקב סטטוסים, לקוחות והכנסות שהושלמו.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:flex">
             הכנסה בפועל היום: ₪{completedRevenue}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_70px_rgba(61,43,97,0.10)]">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-800">
            <Filter className="h-4 w-4 text-violet-600" />
            סינון
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <p className="mb-2 text-xs font-bold text-slate-400">סטטוס</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      statusFilter === filter.value
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-slate-400">
                טווח תאריכים
              </p>
              <div className="flex flex-wrap gap-2">
                {DATE_RANGE_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setDateRangeFilter(filter.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      dateRangeFilter === filter.value
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {dateRangeFilter === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-800 sm:text-sm"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-800 sm:text-sm"
                />
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(61,43,97,0.10)]">
          <div className="hidden grid-cols-[130px_1fr_1fr_90px_110px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black text-slate-400 md:grid">
            <span>תאריך</span>
            <span>לקוח</span>
            <span>שירות</span>
            <span>מחיר</span>
            <span>סטטוס</span>
          </div>

          {loading ? (
            <div className="flex justify-center px-5 py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
              אין תורים בטווח שנבחר.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAppointments.map((appointment) => {
                const status = normalizeAppointmentStatus(appointment.status)
                const meta = STATUS_META[status]
                return (
                  <div
                    key={appointment.id}
                    className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[130px_1fr_1fr_90px_110px] md:items-center md:gap-3"
                  >
                    <div className="font-bold text-slate-800">
                      {formatHistoryDate(appointment.appointment_date)}
                    </div>
                    <div className="min-w-0 truncate font-semibold text-slate-700">
                      {appointment.customer_name}
                    </div>
                    <div className="min-w-0 truncate text-slate-500">
                      {appointment.services?.name ?? "שירות"}
                    </div>
                    <div className="font-bold text-slate-700">
                      {appointment.services?.price != null
                        ? `₪${appointment.services.price}`
                        : "-"}
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
