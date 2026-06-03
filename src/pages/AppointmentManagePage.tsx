import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useParams } from "react-router-dom"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Scissors,
  User,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

type ManagedAppointment = {
  appointment_id: string
  business_name: string
  service_name: string | null
  service_price: number | null
  service_duration_minutes: number | null
  customer_name: string
  appointment_date: string
  appointment_time: string
  status: string
}

function dateStringToLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatDateHebrew(dateStr: string) {
  return dateStringToLocalDate(dateStr).toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function parseAppointmentDateTimeLocal(dateStr: string, timeStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  const [hour, minute] = timeStr.slice(0, 5).split(":").map(Number)
  return new Date(year, month - 1, day, hour, minute)
}

function statusLabel(status: string) {
  if (status === "completed") return "בוצע"
  if (status === "cancelled") return "בוטל"
  if (status === "no_show") return "לא הגיע"
  return "קרוב"
}

export default function AppointmentManagePage() {
  const { token } = useParams<{ token: string }>()
  const [appointment, setAppointment] = useState<ManagedAppointment | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAppointment() {
      if (!token) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: loadError } = await supabase.rpc(
        "get_appointment_by_manage_token",
        { p_manage_token: token }
      )

      if (cancelled) return

      if (loadError) {
        console.error("manage appointment load failed", loadError)
        setError("שגיאה בטעינת התור. נסה שוב.")
        setLoading(false)
        return
      }

      const row = Array.isArray(data) ? data[0] : null
      if (!row) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setAppointment(row as ManagedAppointment)
      setLoading(false)
    }

    loadAppointment()

    return () => {
      cancelled = true
    }
  }, [token])

  const appointmentDateTime = useMemo(() => {
    if (!appointment) return null
    return parseAppointmentDateTimeLocal(
      appointment.appointment_date,
      appointment.appointment_time
    )
  }, [appointment])

  const hasPassed = appointmentDateTime
    ? appointmentDateTime.getTime() <= Date.now()
    : false
  const isCancelled = appointment?.status === "cancelled"
  const canCancel = Boolean(appointment && !isCancelled && !hasPassed)

  async function handleCancel() {
    if (!token || !appointment || !canCancel) return
    const confirmed = window.confirm("האם אתה בטוח שברצונך לבטל את התור?")
    if (!confirmed) return

    setCancelling(true)
    setError(null)
    setMessage(null)

    const { data, error: cancelError } = await supabase.rpc(
      "cancel_appointment_by_token",
      { p_manage_token: token }
    )

    if (cancelError || data !== true) {
      console.error("manage appointment cancel failed", cancelError)
      setError("לא ניתן לבטל את התור. ייתכן שהתור כבר עבר או בוטל.")
      setCancelling(false)
      return
    }

    setAppointment({ ...appointment, status: "cancelled" })
    setMessage("התור בוטל בהצלחה")
    setCancelling(false)
  }

  return (
    <div
      className="min-h-dvh bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.16),transparent_34%),#060814] px-4 py-6 text-slate-100"
      dir="rtl"
    >
      <main className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-xl flex-col justify-center">
        <section className="overflow-hidden rounded-[28px] border border-indigo-200/10 bg-[rgba(7,12,29,0.92)] shadow-[0_24px_90px_rgba(0,0,0,0.42),0_0_60px_rgba(99,102,241,0.08)]">
          <div className="border-b border-indigo-200/10 px-5 py-5">
            <p className="text-xs font-bold text-indigo-300">ניהול תור</p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-white">
              צפייה וביטול תור
            </h1>
          </div>

          <div className="px-5 py-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              </div>
            ) : notFound ? (
              <StateMessage
                icon={<AlertCircle className="h-6 w-6" />}
                title="התור לא נמצא"
                text="הקישור אינו תקין או שהתור אינו זמין יותר."
              />
            ) : appointment ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        {appointment.business_name}
                      </p>
                      <h2 className="mt-1 font-heading text-xl font-bold text-white">
                        {appointment.service_name ?? "שירות"}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isCancelled
                          ? "bg-red-500/12 text-red-300 ring-1 ring-red-400/20"
                          : hasPassed
                            ? "bg-slate-500/12 text-slate-300 ring-1 ring-white/10"
                            : "bg-indigo-500/14 text-indigo-200 ring-1 ring-indigo-300/20"
                      }`}
                    >
                      {statusLabel(appointment.status)}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <DetailRow
                      icon={<User className="h-4 w-4" />}
                      label="שם"
                      value={appointment.customer_name}
                    />
                    <DetailRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="תאריך"
                      value={formatDateHebrew(appointment.appointment_date)}
                    />
                    <DetailRow
                      icon={<Clock className="h-4 w-4" />}
                      label="שעה"
                      value={appointment.appointment_time.slice(0, 5)}
                    />
                    <DetailRow
                      icon={<Scissors className="h-4 w-4" />}
                      label="סטטוס"
                      value={statusLabel(appointment.status)}
                    />
                  </div>
                </div>

                {isCancelled && (
                  <StateMessage
                    icon={<CheckCircle className="h-6 w-6" />}
                    title="התור כבר בוטל"
                    text="אין צורך לבצע פעולה נוספת."
                  />
                )}

                {!isCancelled && hasPassed && (
                  <StateMessage
                    icon={<AlertCircle className="h-6 w-6" />}
                    title="התור כבר עבר ולא ניתן לבטל אותו"
                    text="לבירורים נוספים מומלץ לפנות ישירות לעסק."
                  />
                )}

                {message && (
                  <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300 ring-1 ring-green-400/20">
                    {message}
                  </p>
                )}

                {error && (
                  <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 ring-1 ring-red-400/20">
                    {error}
                  </p>
                )}

                {canCancel && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full rounded-2xl bg-red-500/14 px-5 py-3.5 text-sm font-bold text-red-200 ring-1 ring-red-400/20 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {cancelling ? "מבטל..." : "בטל את התור"}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.035] px-3 py-2.5">
      <span className="flex items-center gap-2 text-slate-400">
        <span className="text-indigo-300">{icon}</span>
        {label}
      </span>
      <span className="min-w-0 truncate text-left font-semibold text-slate-100">
        {value}
      </span>
    </div>
  )
}

function StateMessage({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-5 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/12 text-indigo-200">
        {icon}
      </div>
      <h2 className="font-heading text-lg font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  )
}
