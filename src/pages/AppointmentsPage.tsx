import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Appointment } from "@/types"

type AppointmentWithService = Appointment & {
  services?: { name: string; duration_minutes: number; price: number | null }
}

type CalendarDay = {
  key: string
  label: string
  dateLabel: string
  weekday: string
  appointments: AppointmentWithService[]
}

type CalendarViewMode = "day" | "threeDays" | "week"

type CalendarEventLayout = {
  column: number
  columnCount: number
  isOverlapping: boolean
  visualHeight: number
}

const FALLBACK_OPENING_TIME = "09:00"
const FALLBACK_CLOSING_TIME = "18:00"
const LABEL_STEP_MINUTES = 30
const POSITION_STEP_MINUTES = 15
const QUARTER_HEIGHT = 22
const DESKTOP_MIN_EVENT_HEIGHT = 44
const MOBILE_MIN_EVENT_HEIGHT = 48
const CALENDAR_TOP_PADDING = 14
const CALENDAR_BOTTOM_PADDING = 36
const MOBILE_GRID_TEMPLATE = "58px minmax(0, 1fr)"
const VIEW_MODE_OPTIONS: {
  value: CalendarViewMode
  label: string
  days: number
}[] = [
  { value: "day", label: "יום", days: 1 },
  { value: "threeDays", label: "3 ימים", days: 3 },
  { value: "week", label: "שבוע", days: 7 },
]

const SERVICE_COLORS = [
  {
    bg: "bg-violet-100",
    border: "border-violet-200",
    text: "text-violet-950",
    meta: "text-violet-700",
    accent: "bg-violet-500",
  },
  {
    bg: "bg-sky-100",
    border: "border-sky-200",
    text: "text-sky-950",
    meta: "text-sky-700",
    accent: "bg-sky-500",
  },
  {
    bg: "bg-amber-100",
    border: "border-amber-200",
    text: "text-amber-950",
    meta: "text-amber-700",
    accent: "bg-amber-500",
  },
  {
    bg: "bg-pink-100",
    border: "border-pink-200",
    text: "text-pink-950",
    meta: "text-pink-700",
    accent: "bg-pink-500",
  },
  {
    bg: "bg-emerald-100",
    border: "border-emerald-200",
    text: "text-emerald-950",
    meta: "text-emerald-700",
    accent: "bg-emerald-500",
  },
]

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function offsetDate(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days)
}

function viewModeDays(viewMode: CalendarViewMode) {
  return (
    VIEW_MODE_OPTIONS.find((option) => option.value === viewMode)?.days ?? 3
  )
}

function buildDayKeys(startDate: Date, viewMode: CalendarViewMode) {
  return Array.from({ length: viewModeDays(viewMode) }, (_, index) =>
    localDateStr(offsetDate(startDate, index))
  )
}

function labelForDate(dateStr: string) {
  const today = new Date()
  const date = dateFromKey(dateStr)
  const diffDays = Math.round(
    (date.getTime() -
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).getTime()) /
      86_400_000
  )

  if (diffDays === 0) return "היום"
  if (diffDays === 1) return "מחר"
  if (diffDays === 2) return "מחרתיים"
  return hebrewWeekday(dateStr)
}

function dateFromKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

function timeToMinutes(time: string): number | null {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function resolveBusinessHours(
  openingTime?: string | null,
  closingTime?: string | null
) {
  const opening = timeToMinutes(openingTime ?? FALLBACK_OPENING_TIME)
  const closing = timeToMinutes(closingTime ?? FALLBACK_CLOSING_TIME)

  if (opening === null || closing === null || closing <= opening) {
    return {
      openingMinutes: timeToMinutes(FALLBACK_OPENING_TIME)!,
      closingMinutes: timeToMinutes(FALLBACK_CLOSING_TIME)!,
    }
  }

  return {
    openingMinutes: opening,
    closingMinutes: closing,
  }
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

function hebrewShortDate(dateStr: string): string {
  return dateFromKey(dateStr).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  })
}

function hebrewWeekday(dateStr: string): string {
  return dateFromKey(dateStr).toLocaleDateString("he-IL", { weekday: "long" })
}

function getServiceColor(name: string | undefined) {
  if (!name) return SERVICE_COLORS[0]
  const lower = name.toLowerCase()
  if (
    (lower.includes("hair") && lower.includes("beard")) ||
    (name.includes("שיער") && name.includes("זקן"))
  ) {
    return SERVICE_COLORS[2]
  }
  if (lower.includes("beard") || name.includes("זקן")) return SERVICE_COLORS[1]
  if (
    lower.includes("color") ||
    lower.includes("dye") ||
    name.includes("צבע") ||
    name.includes("גוונים")
  ) {
    return SERVICE_COLORS[3]
  }
  if (
    lower.includes("hair") ||
    name.includes("תספורת") ||
    name.includes("שיער")
  ) {
    return SERVICE_COLORS[0]
  }

  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return SERVICE_COLORS[Math.abs(hash) % SERVICE_COLORS.length]
}

function getEventMetrics(apt: AppointmentWithService, openingMinutes: number) {
  const start =
    timeToMinutes(formatTime(apt.appointment_time)) ?? openingMinutes
  const duration = Math.max(apt.services?.duration_minutes ?? 30, 15)
  const top =
    ((start - openingMinutes) / POSITION_STEP_MINUTES) * QUARTER_HEIGHT
  const height = (duration / POSITION_STEP_MINUTES) * QUARTER_HEIGHT
  return {
    start,
    end: start + duration,
    duration,
    top: Math.max(top, 0),
    height,
  }
}

function buildTimeSlots(openingMinutes: number, closingMinutes: number) {
  const slots: number[] = []
  for (
    let time = openingMinutes;
    time <= closingMinutes;
    time += LABEL_STEP_MINUTES
  ) {
    slots.push(time)
  }
  if (slots[slots.length - 1] !== closingMinutes) slots.push(closingMinutes)
  return slots
}

function calendarHeight(openingMinutes: number, closingMinutes: number) {
  return (
    ((closingMinutes - openingMinutes) / POSITION_STEP_MINUTES) *
      QUARTER_HEIGHT +
    CALENDAR_TOP_PADDING +
    CALENDAR_BOTTOM_PADDING
  )
}

function getEventLayouts(
  appointments: AppointmentWithService[],
  openingMinutes: number,
  minHeight: number
) {
  const layouts = new Map<string, CalendarEventLayout>()
  const sorted = [...appointments].sort(
    (a, b) =>
      getEventMetrics(a, openingMinutes).start -
      getEventMetrics(b, openingMinutes).start
  )
  let index = 0

  while (index < sorted.length) {
    const cluster = [sorted[index]]
    let clusterEnd = getEventMetrics(sorted[index], openingMinutes).end
    index += 1

    while (index < sorted.length) {
      const metrics = getEventMetrics(sorted[index], openingMinutes)
      if (metrics.start >= clusterEnd) break
      cluster.push(sorted[index])
      clusterEnd = Math.max(clusterEnd, metrics.end)
      index += 1
    }

    if (cluster.length === 1) {
      layouts.set(cluster[0].id, {
        column: 0,
        columnCount: 1,
        isOverlapping: false,
        visualHeight: getEventMetrics(cluster[0], openingMinutes).height,
      })
      continue
    }

    const columnEnds: number[] = []
    cluster.forEach((appointment) => {
      const metrics = getEventMetrics(appointment, openingMinutes)
      const freeColumn = columnEnds.findIndex((end) => end <= metrics.start)
      const column = freeColumn === -1 ? columnEnds.length : freeColumn

      columnEnds[column] = metrics.end
      layouts.set(appointment.id, {
        column,
        columnCount: 1,
        isOverlapping: true,
        visualHeight: metrics.height,
      })
    })

    const columnCount = columnEnds.length
    cluster.forEach((appointment) => {
      const layout = layouts.get(appointment.id)
      if (layout) layout.columnCount = columnCount
    })
  }

  sorted.forEach((appointment) => {
    const layout = layouts.get(appointment.id)
    if (!layout) return
    const metrics = getEventMetrics(appointment, openingMinutes)
    if (metrics.height >= minHeight) {
      layout.visualHeight = metrics.height
      return
    }

    const minBottom = metrics.top + minHeight
    const wouldCollide = sorted.some((other) => {
      if (other.id === appointment.id) return false
      const otherLayout = layouts.get(other.id)
      if (!otherLayout || otherLayout.column !== layout.column) return false
      const otherMetrics = getEventMetrics(other, openingMinutes)
      return metrics.top < otherMetrics.top && otherMetrics.top < minBottom
    })

    layout.visualHeight = wouldCollide ? metrics.height : minHeight
  })

  return layouts
}

function TimeAxis({
  openingMinutes,
  closingMinutes,
}: {
  openingMinutes: number
  closingMinutes: number
}) {
  const slots = buildTimeSlots(openingMinutes, closingMinutes)

  return (
    <div className="relative h-full border-l border-slate-100 bg-slate-50/70">
      {slots.map((time) => (
        <div
          key={time}
          className="absolute right-2 left-2 text-left font-mono text-[11px] font-semibold text-slate-400 tabular-nums"
          style={{
            top:
              CALENDAR_TOP_PADDING +
              ((time - openingMinutes) / POSITION_STEP_MINUTES) *
                QUARTER_HEIGHT -
              6,
          }}
        >
          {formatMinutes(time)}
        </div>
      ))}
    </div>
  )
}

function CalendarEvent({
  apt,
  openingMinutes,
  displayMode,
  layout,
  onSelect,
}: {
  apt: AppointmentWithService
  openingMinutes: number
  displayMode: "desktop" | "mobile"
  layout: CalendarEventLayout
  onSelect: (appointment: AppointmentWithService) => void
}) {
  const color = getServiceColor(apt.services?.name)
  const { start, end, top } = getEventMetrics(apt, openingMinutes)
  const visualMinHeight =
    displayMode === "mobile"
      ? MOBILE_MIN_EVENT_HEIGHT
      : DESKTOP_MIN_EVENT_HEIGHT
  const timeRange = `${formatMinutes(start)}-${formatMinutes(end)}`
  const serviceName = apt.services?.name ?? "שירות"
  const widthPercent = 100 / layout.columnCount
  const eventHeight =
    layout.visualHeight <= visualMinHeight
      ? layout.visualHeight
      : layout.visualHeight - 3
  const horizontalInset = displayMode === "mobile" ? 6 : 8
  const overlapGap = layout.columnCount > 1 ? 4 : 0
  const eventLabel = `${timeRange} · ${apt.customer_name} · ${serviceName}`

  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(apt)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(apt)
      }}
      className={`absolute cursor-pointer overflow-hidden rounded-xl border px-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:px-3 ${color.bg} ${
        layout.isOverlapping
          ? "border-rose-300 ring-1 ring-rose-200"
          : color.border
      }`}
      style={{
        top: CALENDAR_TOP_PADDING + top,
        height: eventHeight,
        right: `calc(${layout.column * widthPercent}% + ${horizontalInset}px)`,
        width: `calc(${widthPercent}% - ${horizontalInset * 2 + overlapGap}px)`,
      }}
    >
      <div
        className={`absolute inset-y-1.5 right-1.5 w-1 rounded-full ${color.accent}`}
      />
      <div
        className="mr-3 flex h-full min-w-0 items-center justify-between gap-2 py-0.5"
        dir="rtl"
      >
        <div
          className={`min-w-0 flex-1 truncate text-right leading-tight font-black ${
            displayMode === "mobile" ? "text-[13px]" : "text-xs lg:text-[13px]"
          } ${color.text}`}
          title={eventLabel}
        >
          <span>{apt.customer_name}</span>
          <span className={color.meta}> · </span>
          <span className={`font-semibold ${color.meta}`}>{serviceName}</span>
        </div>
        <span
          className={`shrink-0 text-left font-mono leading-tight font-black tabular-nums ${
            displayMode === "mobile" ? "text-[13px]" : "text-xs"
          } ${color.meta}`}
          title={timeRange}
          dir="ltr"
        >
          {timeRange}
        </span>
      </div>
    </motion.div>
  )
}

function DesktopCalendar({
  days,
  openingMinutes,
  closingMinutes,
  onSelect,
}: {
  days: CalendarDay[]
  openingMinutes: number
  closingMinutes: number
  onSelect: (appointment: AppointmentWithService) => void
}) {
  const totalHeight = calendarHeight(openingMinutes, closingMinutes)
  const rowSlots: number[] = []
  const minEventHeight = DESKTOP_MIN_EVENT_HEIGHT
  const gridTemplateColumns = `72px repeat(${days.length}, minmax(0, 1fr))`
  for (
    let time = openingMinutes;
    time <= closingMinutes;
    time += POSITION_STEP_MINUTES
  ) {
    rowSlots.push(time)
  }

  return (
    <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(61,43,97,0.10)] lg:block">
      <div
        className="grid border-b border-slate-200 bg-white"
        style={{ gridTemplateColumns }}
      >
        <div className="border-l border-slate-100 bg-slate-50/70" />
        {days.map((day, index) => (
          <div
            key={day.key}
            className={`border-l border-slate-100 px-5 py-4 ${index === 0 ? "bg-violet-50/55" : "bg-white"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-black text-slate-900">
                  {day.label}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  {day.weekday} · {day.dateLabel}
                </p>
              </div>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                {day.appointments.length}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="max-h-[calc(100dvh-220px)] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns }}>
          <TimeAxis
            openingMinutes={openingMinutes}
            closingMinutes={closingMinutes}
          />
          {days.map((day, index) => {
            const eventLayouts = getEventLayouts(
              day.appointments,
              openingMinutes,
              minEventHeight
            )
            return (
              <div
                key={day.key}
                className={`relative border-l border-slate-100 ${index === 0 ? "bg-violet-50/20" : "bg-white"}`}
                style={{ height: totalHeight }}
              >
                {rowSlots.map((time) => (
                  <div
                    key={time}
                    className={`absolute right-0 left-0 border-t ${time % 60 === 0 ? "border-slate-200" : time % 30 === 0 ? "border-slate-100" : "border-slate-100/60"}`}
                    style={{
                      top:
                        CALENDAR_TOP_PADDING +
                        ((time - openingMinutes) / POSITION_STEP_MINUTES) *
                          QUARTER_HEIGHT,
                    }}
                  />
                ))}
                {day.appointments.length === 0 ? (
                  <div className="absolute inset-x-5 top-16 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                    אין תורים ביום זה
                  </div>
                ) : (
                  day.appointments.map((apt) => (
                    <CalendarEvent
                      key={apt.id}
                      apt={apt}
                      openingMinutes={openingMinutes}
                      displayMode="desktop"
                      layout={
                        eventLayouts.get(apt.id) ?? {
                          column: 0,
                          columnCount: 1,
                          isOverlapping: false,
                          visualHeight: getEventMetrics(apt, openingMinutes)
                            .height,
                        }
                      }
                      onSelect={onSelect}
                    />
                  ))
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function MobileTimeline({
  day,
  openingMinutes,
  closingMinutes,
  onSelect,
}: {
  day: CalendarDay
  openingMinutes: number
  closingMinutes: number
  onSelect: (appointment: AppointmentWithService) => void
}) {
  const totalHeight = calendarHeight(openingMinutes, closingMinutes)
  const rowSlots: number[] = []
  const minEventHeight = MOBILE_MIN_EVENT_HEIGHT
  const eventLayouts = getEventLayouts(
    day.appointments,
    openingMinutes,
    minEventHeight
  )

  for (
    let time = openingMinutes;
    time <= closingMinutes;
    time += POSITION_STEP_MINUTES
  ) {
    rowSlots.push(time)
  }

  return (
    <div className="max-h-[calc(100dvh-185px)] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(61,43,97,0.10)] lg:hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: MOBILE_GRID_TEMPLATE }}
      >
        <TimeAxis
          openingMinutes={openingMinutes}
          closingMinutes={closingMinutes}
        />
        <div className="relative bg-white" style={{ height: totalHeight }}>
          {rowSlots.map((time) => (
            <div
              key={time}
              className={`absolute right-0 left-0 border-t ${time % 60 === 0 ? "border-slate-200" : time % 30 === 0 ? "border-slate-100" : "border-slate-100/60"}`}
              style={{
                top:
                  CALENDAR_TOP_PADDING +
                  ((time - openingMinutes) / POSITION_STEP_MINUTES) *
                    QUARTER_HEIGHT,
              }}
            />
          ))}
          {day.appointments.length === 0 ? (
            <div className="absolute inset-x-4 top-16 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm font-semibold text-slate-400">
              אין תורים ביום זה
            </div>
          ) : (
            day.appointments.map((apt) => (
              <CalendarEvent
                key={apt.id}
                apt={apt}
                openingMinutes={openingMinutes}
                displayMode="mobile"
                layout={
                  eventLayouts.get(apt.id) ?? {
                    column: 0,
                    columnCount: 1,
                    isOverlapping: false,
                    visualHeight: getEventMetrics(apt, openingMinutes).height,
                  }
                }
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AppointmentDetailsSheet({
  appointment,
  onClose,
  onCancel,
}: {
  appointment: AppointmentWithService | null
  onClose: () => void
  onCancel: (id: string) => void
}) {
  if (!appointment) return null

  const start = timeToMinutes(formatTime(appointment.appointment_time)) ?? 0
  const duration = appointment.services?.duration_minutes ?? 30
  const end = start + duration
  const price = appointment.services?.price

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-3 pb-3 backdrop-blur-sm sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 text-right shadow-[0_24px_90px_rgba(15,23,42,0.22)]"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-violet-600">פרטי תור</p>
              <h2 className="mt-1 truncate font-heading text-2xl font-black text-slate-950">
                {appointment.customer_name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
            >
              סגור
            </button>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
            {[
              { label: "שירות", value: appointment.services?.name ?? "שירות" },
              {
                label: "תאריך",
                value: `${hebrewWeekday(appointment.appointment_date)}, ${hebrewShortDate(appointment.appointment_date)}`,
              },
              {
                label: "שעה",
                value: `${formatMinutes(start)}-${formatMinutes(end)}`,
              },
              { label: "טלפון", value: appointment.customer_phone, dir: "ltr" },
              {
                label: "מחיר",
                value: price != null ? `₪${price}` : "לא הוגדר",
              },
              { label: "סטטוס", value: appointment.status },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-slate-400">{item.label}</span>
                <span
                  className="min-w-0 truncate font-bold text-slate-800"
                  dir={item.dir}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {appointment.status === "pending" && (
            <button
              type="button"
              onClick={() => {
                onCancel(appointment.id)
                onClose()
              }}
              className="mt-4 w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
            >
              בטל תור
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState<AppointmentWithService[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithService | null>(null)
  const [viewMode, setViewMode] = useState<CalendarViewMode>("threeDays")
  const [rangeStartDate, setRangeStartDate] = useState(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      )
  )
  const [businessHours, setBusinessHours] = useState(() =>
    resolveBusinessHours(FALLBACK_OPENING_TIME, FALLBACK_CLOSING_TIME)
  )
  const [nowStr, setNowStr] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  })

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setNowStr(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      )
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const dayKeys = useMemo(
    () => buildDayKeys(rangeStartDate, viewMode),
    [rangeStartDate, viewMode]
  )

  const rangeEndKey =
    dayKeys[dayKeys.length - 1] ?? localDateStr(rangeStartDate)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, opening_time, closing_time")
        .eq("owner_id", user!.id)
        .maybeSingle()

      if (cancelled) return
      if (!biz) {
        navigate("/dashboard")
        return
      }
      setBusinessHours(resolveBusinessHours(biz.opening_time, biz.closing_time))

      const { data: apts } = await supabase
        .from("appointments")
        .select("*, services(name, duration_minutes, price)")
        .eq("business_id", biz.id)
        .neq("status", "cancelled")
        .gte("appointment_date", dayKeys[0])
        .lte("appointment_date", rangeEndKey)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })

      if (cancelled) return
      setAppointments((apts as AppointmentWithService[]) ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, dayKeys, rangeEndKey, navigate])

  async function handleCancel(id: string) {
    await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
    setAppointments((prev) =>
      prev.filter((appointment) => appointment.id !== id)
    )
    setSelectedAppointment((current) => (current?.id === id ? null : current))
  }

  function moveRange(direction: -1 | 1) {
    setRangeStartDate((current) =>
      offsetDate(current, direction * viewModeDays(viewMode))
    )
    setSelectedDayIdx(0)
    setSelectedAppointment(null)
  }

  function goToToday() {
    const today = new Date()
    setRangeStartDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate())
    )
    setSelectedDayIdx(0)
    setSelectedAppointment(null)
  }

  function changeViewMode(nextViewMode: CalendarViewMode) {
    setViewMode(nextViewMode)
    setSelectedDayIdx(0)
    setSelectedAppointment(null)
  }

  const days = useMemo<CalendarDay[]>(() => {
    return dayKeys.map((key) => ({
      key,
      label: labelForDate(key),
      dateLabel: hebrewShortDate(key),
      weekday: hebrewWeekday(key),
      appointments: appointments.filter(
        (apt) => apt.appointment_date === key && apt.status !== "cancelled"
      ),
    }))
  }, [appointments, dayKeys])

  const timeRangeLabel = `${formatMinutes(businessHours.openingMinutes)}-${formatMinutes(businessHours.closingMinutes)}`
  const visibleRangeLabel =
    dayKeys.length === 1
      ? `${hebrewWeekday(dayKeys[0])}, ${hebrewShortDate(dayKeys[0])}`
      : `${hebrewShortDate(dayKeys[0])} - ${hebrewShortDate(rangeEndKey)}`

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F6F7FB]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F6F7FB]" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3.5 sm:px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
            aria-label="חזרה לדשבורד"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-lg font-black text-slate-950 sm:text-2xl">
              יומן תורים
            </h1>
            <p className="hidden text-sm text-slate-500 sm:block">
              בחר טווח תאריכים ונהל תורים לפי שעה ומשך שירות.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            <Clock className="h-3.5 w-3.5" />
            עכשיו {nowStr}
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white/92 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
            >
              היום
            </button>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {VIEW_MODE_OPTIONS.map((option) => {
                const active = viewMode === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changeViewMode(option.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => moveRange(-1)}
                className="flex h-9 w-9 items-center justify-center border-l border-slate-200 text-slate-500 transition hover:text-violet-700"
                aria-label="התקופה הקודמת"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveRange(1)}
                className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:text-violet-700"
                aria-label="התקופה הבאה"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <CalendarDays className="h-4 w-4 text-violet-600" />
            <span>{visibleRangeLabel}</span>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="hidden sm:inline">ציר זמן: {timeRangeLabel}</span>
          </div>
        </div>
      </div>

      <div className="sticky top-[69px] z-20 border-b border-slate-200 bg-white/92 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {days.map((day, index) => {
            const active = selectedDayIdx === index
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDayIdx(index)}
                className={`min-w-24 rounded-2xl border px-2 py-2 transition-all ${
                  active
                    ? "border-violet-200 bg-violet-50 text-violet-800 shadow-sm"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <span className="block text-xs font-black">{day.label}</span>
                <span className="mt-0.5 block text-[10px]">
                  {day.dateLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        <DesktopCalendar
          days={days}
          openingMinutes={businessHours.openingMinutes}
          closingMinutes={businessHours.closingMinutes}
          onSelect={setSelectedAppointment}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={days[selectedDayIdx]?.key}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 14 }}
            transition={{ duration: 0.18 }}
          >
            <MobileTimeline
              day={days[selectedDayIdx]}
              openingMinutes={businessHours.openingMinutes}
              closingMinutes={businessHours.closingMinutes}
              onSelect={setSelectedAppointment}
            />
          </motion.div>
        </AnimatePresence>

        <AppointmentDetailsSheet
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancel={handleCancel}
        />
      </main>
    </div>
  )
}
