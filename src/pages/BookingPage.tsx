import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  CheckCircle,
  Check,
  Phone,
  Camera,
  MessageCircle,
  MapPin,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Business, Service } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = 1 | 2 | 3 | 4
type BookedAppointmentService = { duration_minutes: number | null }
type BookedAppointment = {
  appointment_time: string
  services?: BookedAppointmentService | BookedAppointmentService[] | null
}

const DEFAULT_OPENING_TIME = "09:00"
const DEFAULT_CLOSING_TIME = "18:00"
const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4]

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

// Returns true when a slot has already passed (or is within bufferMinutes) on today's date.
function isPastSlotForToday(
  slotTime: string,
  dateStr: string,
  bufferMinutes = 10
) {
  if (dateStr !== todayDateString()) return false
  const slotMinutes = timeToMinutes(slotTime)
  if (slotMinutes === null) return false
  const now = new Date()
  return slotMinutes <= now.getHours() * 60 + now.getMinutes() + bufferMinutes
}

function generateTimeSlots(
  durationMinutes: number,
  openingTime = DEFAULT_OPENING_TIME,
  closingTime = DEFAULT_CLOSING_TIME
): string[] {
  const slots: string[] = []
  const startMinutes =
    timeToMinutes(openingTime) ?? timeToMinutes(DEFAULT_OPENING_TIME)!
  const endMinutes =
    timeToMinutes(closingTime) ?? timeToMinutes(DEFAULT_CLOSING_TIME)!
  if (durationMinutes <= 0 || startMinutes >= endMinutes) return slots
  const interval = durationMinutes
  for (let m = startMinutes; m + durationMinutes <= endMinutes; m += interval) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(
      `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
    )
  }
  return slots
}

function appointmentOverlaps(
  newStartMinutes: number,
  newDurationMinutes: number,
  bookedAppointment: BookedAppointment
) {
  const existingStartMinutes = timeToMinutes(bookedAppointment.appointment_time)
  const bookedService = Array.isArray(bookedAppointment.services)
    ? bookedAppointment.services[0]
    : bookedAppointment.services
  const existingDurationMinutes = bookedService?.duration_minutes ?? 30

  if (
    existingStartMinutes === null ||
    newDurationMinutes <= 0 ||
    existingDurationMinutes <= 0
  ) {
    return false
  }

  const newEndMinutes = newStartMinutes + newDurationMinutes
  const existingEndMinutes = existingStartMinutes + existingDurationMinutes

  return (
    existingStartMinutes < newEndMinutes && newStartMinutes < existingEndMinutes
  )
}

function hasOverlappingAppointment(
  slotTime: string,
  serviceDurationMinutes: number,
  bookedAppointments: BookedAppointment[]
) {
  const newStartMinutes = timeToMinutes(slotTime)
  if (newStartMinutes === null) return true

  return bookedAppointments.some((appointment) =>
    appointmentOverlaps(newStartMinutes, serviceDurationMinutes, appointment)
  )
}

function todayDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
  })
}

function getBusinessWorkingDays(business: Business | null) {
  const workingDays = business?.working_days
  if (Array.isArray(workingDays)) return workingDays
  if (typeof workingDays === "string") {
    try {
      const parsed = JSON.parse(workingDays)
      if (Array.isArray(parsed))
        return parsed.filter((day) => typeof day === "number")
    } catch {
      return DEFAULT_WORKING_DAYS
    }
  }
  return DEFAULT_WORKING_DAYS
}

function isBusinessOpenOnDate(business: Business | null, dateStr: string) {
  const day = dateStringToLocalDate(dateStr).getDay()
  return getBusinessWorkingDays(business).includes(day)
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function isSelectableBookingDate(business: Business | null, date: Date) {
  const day = startOfLocalDay(date)
  const today = startOfLocalDay(new Date())
  const maxDate = addDays(today, 14)

  return (
    day.getTime() >= today.getTime() &&
    day.getTime() <= maxDate.getTime() &&
    getBusinessWorkingDays(business).includes(day.getDay())
  )
}

function findNextSelectableBookingDate(business: Business | null) {
  const today = startOfLocalDay(new Date())
  for (let offset = 0; offset <= 14; offset += 1) {
    const candidate = addDays(today, offset)
    if (isSelectableBookingDate(business, candidate)) {
      return toDateString(candidate)
    }
  }
  return toDateString(today)
}

const stepLabels = ["שירות", "תאריך ושעה", "פרטים"]
const weekdayLabels = ["א", "ב", "ג", "ד", "ה", "ו", "ש"]

const slideVariants = {
  enter: { opacity: 0, x: -20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function CalendarDatePicker({
  business,
  selectedDate,
  onSelect,
}: {
  business: Business | null
  selectedDate: string
  onSelect: (date: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() =>
    dateStringToLocalDate(selectedDate)
  )

  useEffect(() => {
    setVisibleMonth(dateStringToLocalDate(selectedDate))
  }, [selectedDate])

  const selected = dateStringToLocalDate(selectedDate)
  const monthStart = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1
  )
  const monthTitle = monthStart.toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  })
  const leadingEmptyDays = monthStart.getDay()
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0
  ).getDate()
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    return new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      index + 1
    )
  })

  return (
    <div className="relative">
      <Label>בחר תאריך</Label>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-right transition-all hover:border-indigo-500/30 hover:bg-white/[0.06] sm:border-indigo-200/10 sm:bg-[rgba(9,14,32,0.86)]"
      >
        <span className="block text-xs font-medium text-slate-500 sm:text-slate-400">
          תאריך נבחר
        </span>
        <span className="mt-1 block font-heading text-base font-semibold text-slate-100">
          {formatDateHebrew(selectedDate)}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 left-0 z-30 mt-2 rounded-2xl border border-indigo-200/10 bg-[rgba(6,11,27,0.98)] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.50),0_0_40px_rgba(99,102,241,0.08)] backdrop-blur-xl"
          dir="rtl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1
                  )
                )
              }
              className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:border-indigo-500/30 hover:text-white"
            >
              הקודם
            </button>
            <p className="font-heading text-sm font-bold text-slate-100">
              {monthTitle}
            </p>
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1
                  )
                )
              }
              className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:border-indigo-500/30 hover:text-white"
            >
              הבא
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
            {weekdayLabels.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingEmptyDays }).map((_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {days.map((day) => {
              const disabled = !isSelectableBookingDate(business, day)
              const active = sameDate(day, selected)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  title={disabled ? "לא זמין" : undefined}
                  onClick={() => {
                    onSelect(toDateString(day))
                    setOpen(false)
                  }}
                  className={`aspect-square rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/18"
                      : disabled
                        ? "cursor-not-allowed text-slate-700"
                        : "text-slate-200 hover:bg-indigo-500/12 hover:text-indigo-200"
                  }`}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BookingPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>()

  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const [step, setStep] = useState<Step>(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayDateString())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookedAppointments, setBookedAppointments] = useState<
    BookedAppointment[]
  >([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [refreshSlotsKey, setRefreshSlotsKey] = useState(0)

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessSlug) return
    supabase
      .from("businesses")
      .select("*")
      .eq("slug", businessSlug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
          setLoading(false)
        } else {
          setBusiness(data)
          supabase
            .from("services")
            .select("*")
            .eq("business_id", data.id)
            .order("created_at")
            .then(({ data: svcs }) => {
              setServices(svcs ?? [])
              setLoading(false)
            })
        }
      })
  }, [businessSlug])

  useEffect(() => {
    if (!business || !selectedService || !selectedDate) return
    if (!isBusinessOpenOnDate(business, selectedDate)) {
      setBookedAppointments([])
      setLoadingSlots(false)
      return
    }
    setLoadingSlots(true)
    supabase
      .from("appointments")
      .select("appointment_time, services(duration_minutes)")
      .eq("business_id", business.id)
      .eq("appointment_date", selectedDate)
      .neq("status", "cancelled")
      .then(({ data }) => {
        setBookedAppointments((data ?? []) as BookedAppointment[])
        setLoadingSlots(false)
      })
  }, [business, selectedService, selectedDate, refreshSlotsKey])

  useEffect(() => {
    if (!business || !selectedDate) return
    const selected = dateStringToLocalDate(selectedDate)
    if (isSelectableBookingDate(business, selected)) return

    setSelectedDate(findNextSelectableBookingDate(business))
    setSelectedTime(null)
    setSubmitError(null)
  }, [business, selectedDate])

  async function handleBooking() {
    setSubmitError(null)
    const trimmedName = customerName.trim()
    const trimmedPhone = customerPhone.trim()
    const phoneDigits = trimmedPhone.replace(/\D/g, "")

    if (!business) {
      setSubmitError("שגיאה בטעינת העסק. נסה לרענן את הדף.")
      return
    }
    if (!selectedService) {
      setSubmitError("יש לבחור שירות לפני קביעת התור.")
      setStep(1)
      return
    }
    if (!selectedDate) {
      setSubmitError("יש לבחור תאריך לפני קביעת התור.")
      setStep(2)
      return
    }
    if (!isBusinessOpenOnDate(business, selectedDate)) {
      setSubmitError("העסק סגור ביום זה")
      setStep(2)
      return
    }
    if (!selectedTime) {
      setSubmitError("יש לבחור שעה לפני קביעת התור.")
      setStep(2)
      return
    }
    if (selectedDate < todayDateString()) {
      setSubmitError("השעה הזו כבר עברה. בחר שעה אחרת.")
      setSelectedTime(null)
      setStep(2)
      return
    }
    if (selectedDate === todayDateString()) {
      const slotMins = timeToMinutes(selectedTime)
      const now = new Date()
      const nowMins = now.getHours() * 60 + now.getMinutes()
      if (slotMins !== null && slotMins <= nowMins) {
        setSubmitError("השעה הזו כבר עברה. בחר שעה אחרת.")
        setSelectedTime(null)
        setStep(2)
        return
      }
    }
    {
      const openT = business.opening_time?.slice(0, 5) ?? DEFAULT_OPENING_TIME
      const closeT = business.closing_time?.slice(0, 5) ?? DEFAULT_CLOSING_TIME
      const slotMins = timeToMinutes(selectedTime)
      const openMins = timeToMinutes(openT)
      const closeMins = timeToMinutes(closeT)
      if (
        slotMins === null ||
        openMins === null ||
        closeMins === null ||
        slotMins < openMins ||
        slotMins + selectedService.duration_minutes > closeMins
      ) {
        setSubmitError("השעה שנבחרה אינה בשעות הפעילות של העסק.")
        setStep(2)
        return
      }
    }
    if (!trimmedName) {
      setSubmitError("יש להזין שם מלא.")
      return
    }
    if (!trimmedPhone) {
      setSubmitError("יש להזין מספר טלפון.")
      return
    }
    if (/[^\d\s\-]/.test(trimmedPhone)) {
      setSubmitError("מספר הטלפון יכול להכיל ספרות בלבד.")
      return
    }
    if (phoneDigits.startsWith("05") && phoneDigits.length !== 10) {
      setSubmitError("מספר נייד ישראלי שמתחיל ב-05 חייב להכיל בדיוק 10 ספרות.")
      return
    }
    if (phoneDigits.length < 9) {
      setSubmitError("מספר הטלפון אינו תקין.")
      return
    }

    setSubmitting(true)

    const { data: latestBookedAppointments, error: latestBookedError } =
      await supabase
        .from("appointments")
        .select("appointment_time, services(duration_minutes)")
        .eq("business_id", business.id)
        .eq("appointment_date", selectedDate)
        .neq("status", "cancelled")

    if (latestBookedError) {
      setSubmitError("שגיאה בבדיקת זמינות השעה. נסה שוב.")
      setSubmitting(false)
      return
    }

    const currentBookedAppointments = (latestBookedAppointments ??
      []) as BookedAppointment[]

    if (
      hasOverlappingAppointment(
        selectedTime,
        selectedService.duration_minutes,
        currentBookedAppointments
      )
    ) {
      setSubmitError("השעה הזו כבר תפוסה. בחר שעה אחרת.")
      setBookedAppointments(currentBookedAppointments)
      setRefreshSlotsKey((prev) => prev + 1)
      setSelectedTime(null)
      setStep(2)
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from("appointments").insert({
      business_id: business.id,
      service_id: selectedService.id,
      customer_name: trimmedName,
      customer_phone: trimmedPhone,
      appointment_date: selectedDate,
      appointment_time: selectedTime + ":00",
      status: "future",
    })

    if (error) {
      if (error.code === "23505") {
        setSubmitError("השעה הזו כבר נתפסה. בחר שעה אחרת.")
        setRefreshSlotsKey((prev) => prev + 1)
        setSelectedTime(null)
        setStep(2)
      } else {
        setSubmitError("שגיאה בשמירת התור. נסה שוב.")
      }
    } else {
      setSubmitted(true)
      setStep(4)
    }
    setSubmitting(false)
  }

  function handleContinueToDetails() {
    setSubmitError(null)
    if (!selectedService) {
      setSubmitError("יש לבחור שירות לפני שממשיכים.")
      setStep(1)
      return
    }
    if (!selectedDate) {
      setSubmitError("יש לבחור תאריך לפני שממשיכים.")
      return
    }
    if (!isBusinessOpenOnDate(business, selectedDate)) {
      setSubmitError("העסק סגור ביום זה")
      return
    }
    if (!selectedTime) {
      setSubmitError("יש לבחור שעה לפני שממשיכים.")
      return
    }
    if (selectedDate < todayDateString()) {
      setSubmitError("השעה הזו כבר עברה. בחר שעה אחרת.")
      setSelectedTime(null)
      return
    }
    if (selectedDate === todayDateString()) {
      const slotMins = timeToMinutes(selectedTime)
      const now = new Date()
      const nowMins = now.getHours() * 60 + now.getMinutes()
      if (slotMins !== null && slotMins <= nowMins) {
        setSubmitError("השעה הזו כבר עברה. בחר שעה אחרת.")
        setSelectedTime(null)
        return
      }
    }
    setStep(3)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center"
        dir="rtl"
      >
        <p className="mb-4 text-5xl">😕</p>
        <h1 className="mb-2 font-heading text-2xl font-bold text-white">
          העסק לא נמצא
        </h1>
        <p className="text-sm text-slate-400">הקישור שהגעת אליו לא תקין.</p>
      </div>
    )
  }

  const openingTime =
    business?.opening_time?.slice(0, 5) ?? DEFAULT_OPENING_TIME
  const closingTime =
    business?.closing_time?.slice(0, 5) ?? DEFAULT_CLOSING_TIME
  const isClosedDay = selectedDate
    ? !isBusinessOpenOnDate(business, selectedDate)
    : false
  // TODO: Add closed_dates table support for one-off owner closures.
  // TODO: Let owners close a specific date from the dashboard.
  // TODO: Show "העסק סגור ביום זה" for special closed dates too.
  const timeSlots =
    selectedService && !isClosedDay
      ? generateTimeSlots(
          selectedService.duration_minutes,
          openingTime,
          closingTime
        )
      : []
  const availableSlots = isClosedDay
    ? []
    : timeSlots.filter(
        (t) =>
          selectedService &&
          !hasOverlappingAppointment(
            t,
            selectedService.duration_minutes,
            bookedAppointments
          ) &&
          !isPastSlotForToday(t, selectedDate)
      )
  const businessInitial = business?.name?.trim().charAt(0) || "Z"
  const businessDescription =
    business?.description ||
    "בחרו שירות, תאריך ושעה שמתאימים לכם והשלימו את קביעת התור בכמה רגעים."

  return (
    <div
      className="min-h-screen bg-background sm:bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.12),transparent_34%),#060814]"
      dir="rtl"
    >
      {/* Business header */}
      <div
        className="border-b"
        style={{
          background: "rgba(5,8,22,0.94)",
          borderColor: "rgba(99,102,241,0.10)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto max-w-xl px-4 py-4">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="shrink-0 bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text font-heading text-xl font-extrabold text-transparent">
                zimtor
              </span>
              <span className="text-white/20">·</span>
              <div className="min-w-0">
                <h1 className="truncate font-heading text-lg font-bold text-white sm:text-xl">
                  {business?.name}
                </h1>
                <p className="text-xs font-semibold text-indigo-300">
                  קביעת תור
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-5 sm:pt-6">
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035] shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:border-indigo-200/10 sm:bg-[rgba(7,12,29,0.92)]">
          <div className="relative h-28 overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.18),transparent_34%),linear-gradient(135deg,rgba(99,102,241,0.20),rgba(6,11,27,0.96))] sm:h-32">
            {business?.cover_image_url && (
              <img
                src={business.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-[#050816] via-[#050816]/35 to-[#050816]/10" />
            <div className="absolute inset-0 bg-linear-to-r from-cyan-400/10 via-transparent to-blue-500/10" />
          </div>

          <div className="-mt-10 px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="relative flex items-end gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-200/20 bg-[rgba(9,14,32,0.96)] shadow-[0_18px_40px_rgba(99,102,241,0.12)] ring-1 ring-indigo-300/8">
                {business?.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="bg-linear-to-r from-indigo-200 to-violet-200 bg-clip-text font-heading text-3xl font-bold text-transparent">
                    {businessInitial}
                  </span>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h2 className="truncate font-heading text-xl font-bold text-white">
                  {business?.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                  {businessDescription}
                </p>
              </div>
            </div>

            {(business?.phone ||
              business?.whatsapp_url ||
              business?.instagram_url ||
              business?.address) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-indigo-300/20 hover:text-white"
                  >
                    <Phone className="h-3.5 w-3.5 text-indigo-300" />
                    טלפון
                  </a>
                )}
                {business.whatsapp_url && (
                  <a
                    href={`https://wa.me/${business.whatsapp_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-indigo-300/20 hover:text-white"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-violet-300" />
                    WhatsApp
                  </a>
                )}
                {business.instagram_url && (
                  <a
                    href={business.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-indigo-300/20 hover:text-white"
                  >
                    <Camera className="h-3.5 w-3.5 text-pink-300" />
                    Instagram
                  </a>
                )}
                {business.address && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-indigo-300" />
                    {business.address}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <div className="mx-auto max-w-xl px-4 pt-5 pb-1 sm:pt-6">
          <div className="relative grid grid-cols-3">
            <div
              className={`pointer-events-none absolute top-4 right-[calc(16.666%+1.25rem)] left-[calc(50%+1.25rem)] z-0 h-px transition-colors duration-300 ${
                step > 1 ? "bg-indigo-500" : "bg-white/10"
              }`}
            />
            <div
              className={`pointer-events-none absolute top-4 right-[calc(50%+1.25rem)] left-[calc(16.666%+1.25rem)] z-0 h-px transition-colors duration-300 ${
                step > 2 ? "bg-indigo-500" : "bg-white/10"
              }`}
            />
            {[1, 2, 3].map((s, idx) => (
              <div
                key={s}
                className="relative z-10 flex min-w-0 flex-col items-center gap-2"
              >
                <div
                  className={`relative z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    step > s
                      ? "bg-indigo-500/15 text-indigo-400"
                      : step === s
                        ? "bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-[0_0_0_3px] shadow-indigo-500/15"
                        : "bg-white/5 text-slate-500"
                  }`}
                >
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                <span
                  className={`max-w-full truncate text-center text-[11px] leading-none ${
                    step === idx + 1
                      ? "font-semibold text-indigo-300"
                      : "font-medium text-slate-500"
                  }`}
                >
                  {stepLabels[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="mx-auto max-w-xl px-4 py-5 sm:py-6">
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:border-indigo-200/10 sm:bg-[rgba(7,12,29,0.92)] sm:p-5 sm:shadow-[0_24px_80px_rgba(0,0,0,0.35),0_0_50px_rgba(99,102,241,0.06)]">
          <AnimatePresence mode="wait">
            {/* Step 1: Service */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22 }}
                className="space-y-3.5"
              >
                <div className="mb-4">
                  <h2 className="font-heading text-xl font-semibold text-white">
                    בחר שירות
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    בחר שירות כדי להמשיך
                  </p>
                </div>
                {services.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    העסק לא הגדיר שירותים עדיין.
                  </p>
                ) : (
                  services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedService(s)
                        setSelectedTime(null)
                        setSubmitError(null)
                        setStep(2)
                      }}
                      className={`w-full rounded-2xl border p-4 text-end transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 ${
                        selectedService?.id === s.id
                          ? "border-indigo-300/40 bg-indigo-500/8 ring-1 ring-indigo-300/20"
                          : "border-white/8 bg-white/5 hover:border-indigo-500/35 hover:bg-white/8 sm:border-indigo-200/10 sm:bg-[rgba(9,14,32,0.86)] sm:hover:border-indigo-300/35 sm:hover:bg-[rgba(12,20,42,0.96)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/8">
                          <Clock className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div className="min-w-0 text-end">
                          <p className="truncate text-sm font-semibold text-slate-200 sm:text-slate-50">
                            {s.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-slate-500 sm:font-medium sm:text-slate-400">
                            <span>משך: {s.duration_minutes} דקות</span>
                            {s.price != null && (
                              <span className="font-semibold text-indigo-400">
                                ₪{s.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </motion.div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-semibold text-white">
                    תאריך ושעה
                  </h2>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-slate-500 transition-colors hover:text-indigo-400"
                  >
                    חזור
                  </button>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm sm:border-indigo-200/10 sm:bg-[rgba(9,14,32,0.86)]">
                  <span className="text-slate-500 sm:text-slate-400">
                    שירות:{" "}
                  </span>
                  <span className="font-medium text-slate-200 sm:text-slate-50">
                    {selectedService?.name}
                  </span>
                </div>

                <CalendarDatePicker
                  business={business}
                  selectedDate={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setSelectedTime(null)
                    setSubmitError(null)
                  }}
                />

                {selectedDate && (
                  <div className="space-y-3 rounded-2xl border border-white/6 bg-white/[0.03] p-3.5 sm:border-indigo-200/8 sm:bg-[rgba(6,11,27,0.78)]">
                    <Label>
                      {formatDateHebrew(selectedDate)} — שעות פנויות
                    </Label>
                    {loadingSlots ? (
                      <div className="flex justify-center py-5">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : isClosedDay ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        העסק סגור ביום זה
                      </p>
                    ) : availableSlots.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        אין שעות פנויות ביום זה
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => {
                              setSelectedTime(slot)
                              setSubmitError(null)
                            }}
                            className={`rounded-xl border py-2.5 text-sm font-semibold transition-all duration-150 ${
                              selectedTime === slot
                                ? "border-indigo-300/35 bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-lg ring-1 shadow-indigo-500/20 ring-indigo-300/30 sm:shadow-[0_0_24px_rgba(99,102,241,0.18)]"
                                : "border-white/8 bg-white/5 text-slate-200 hover:border-indigo-500/35 hover:bg-white/8 sm:border-indigo-200/10 sm:bg-[rgba(15,23,42,0.82)] sm:text-slate-100 sm:hover:border-indigo-300/35 sm:hover:bg-[rgba(12,18,42,0.96)] sm:hover:text-white sm:hover:shadow-[0_0_18px_rgba(99,102,241,0.10)]"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {submitError && (
                  <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <button
                  onClick={handleContinueToDetails}
                  className="w-full rounded-2xl bg-linear-to-r from-indigo-500 to-violet-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/12 transition hover:opacity-90"
                >
                  המשך
                </button>
              </motion.div>
            )}

            {/* Step 3: Customer Info */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-semibold text-white">
                    פרטי הזמנה
                  </h2>
                  <button
                    onClick={() => setStep(2)}
                    className="text-sm text-slate-500 transition-colors hover:text-indigo-400"
                  >
                    חזור
                  </button>
                </div>

                <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3.5 text-sm sm:border-indigo-200/10 sm:bg-[rgba(9,14,32,0.86)]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 sm:text-slate-400">
                      שירות
                    </span>
                    <span className="font-medium text-slate-200 sm:text-slate-50">
                      {selectedService?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 sm:text-slate-400">
                      תאריך
                    </span>
                    <span className="font-medium text-slate-200 sm:text-slate-50">
                      {formatDateHebrew(selectedDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500 sm:text-slate-400">
                      שעה
                    </span>
                    <span className="font-medium text-slate-200 sm:text-slate-50">
                      {selectedTime}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="cname">שם מלא</Label>
                    <Input
                      id="cname"
                      placeholder="ישראל ישראלי"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value)
                        setSubmitError(null)
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cphone">טלפון</Label>
                    <Input
                      id="cphone"
                      type="tel"
                      placeholder="050-0000000"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value)
                        setSubmitError(null)
                      }}
                      dir="ltr"
                    />
                  </div>
                </div>

                {submitError && (
                  <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <button
                  disabled={submitting}
                  onClick={handleBooking}
                  className="w-full rounded-2xl bg-linear-to-r from-indigo-500 to-violet-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/12 transition hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? "שומר תור..." : "קבע תור"}
                </button>
              </motion.div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && submitted && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="py-7 text-center sm:py-9"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: "backOut" }}
                  className="mx-auto mb-5 flex size-[72px] items-center justify-center rounded-full bg-green-500/15 shadow-[0_0_45px_rgba(34,197,94,0.18)] ring-8 ring-green-500/10"
                >
                  <CheckCircle className="h-9 w-9 text-green-600 dark:text-green-400" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <h2 className="mb-2 font-heading text-3xl leading-tight font-bold text-white">
                    התור נקבע!
                  </h2>
                  <p className="mx-auto mb-5 max-w-sm text-sm leading-6 text-slate-400">
                    {customerName}, התור שלך אצל{" "}
                    <span className="font-medium text-slate-200 sm:text-slate-50">
                      {business?.name}
                    </span>{" "}
                    נרשם.
                  </p>

                  <div className="mx-auto mb-6 max-w-sm space-y-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 text-start text-sm sm:border-indigo-200/10 sm:bg-[rgba(9,14,32,0.86)]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 sm:text-slate-400">
                        שירות
                      </span>
                      <span className="font-medium text-slate-200 sm:text-slate-50">
                        {selectedService?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 sm:text-slate-400">
                        תאריך
                      </span>
                      <span className="font-medium text-slate-200 sm:text-slate-50">
                        {formatDateHebrew(selectedDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 sm:text-slate-400">
                        שעה
                      </span>
                      <span className="font-medium text-slate-200 sm:text-slate-50">
                        {selectedTime}
                      </span>
                    </div>
                  </div>

                  <p className="mb-4 text-xs text-slate-500">
                    מומלץ לשמור את פרטי התור או לשלוח לעצמך ב-WhatsApp.
                  </p>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `תזכורת לתור שלי 📅\nעסק: ${business?.name}\nשירות: ${selectedService?.name}\nתאריך: ${formatDateHebrew(selectedDate)}\nשעה: ${selectedTime}\nשם: ${customerName}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-3 inline-flex items-center gap-2 rounded-xl bg-green-500/15 px-5 py-2.5 text-sm font-semibold text-green-400 ring-1 ring-green-500/20 transition hover:bg-green-500/25"
                  >
                    <MessageCircle className="h-4 w-4" />
                    שלח לעצמי ב-WhatsApp
                  </a>

                  <br />

                  <button
                    onClick={() => {
                      setStep(1)
                      setSelectedService(null)
                      setSelectedTime(null)
                      setCustomerName("")
                      setCustomerPhone("")
                      setSubmitted(false)
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-indigo-400 transition hover:bg-indigo-500/8"
                  >
                    קביעת תור נוסף
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
