import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Business, Service } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = 1 | 2 | 3 | 4

function generateTimeSlots(durationMinutes: number): string[] {
  const slots: string[] = []
  const startMinutes = 9 * 60
  const endMinutes = 18 * 60
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

function todayDateString() {
  return new Date().toISOString().split("T")[0]
}

function formatDateHebrew(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

const stepLabels = ["שירות", "תאריך ושעה", "פרטים"]

const slideVariants = {
  enter: { opacity: 0, x: -20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
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
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

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
    setLoadingSlots(true)
    supabase
      .from("appointments")
      .select("appointment_time")
      .eq("business_id", business.id)
      .eq("appointment_date", selectedDate)
      .neq("status", "cancelled")
      .then(({ data }) => {
        setBookedTimes((data ?? []).map((a) => a.appointment_time.slice(0, 5)))
        setLoadingSlots(false)
      })
  }, [business, selectedService, selectedDate])

  async function handleBooking() {
    if (!business || !selectedService || !selectedDate || !selectedTime) return
    setSubmitting(true)
    setSubmitError(null)

    const { error } = await supabase.from("appointments").insert({
      business_id: business.id,
      service_id: selectedService.id,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      appointment_date: selectedDate,
      appointment_time: selectedTime + ":00",
      status: "pending",
    })

    if (error) {
      setSubmitError("שגיאה בשמירת התור. נסה שוב.")
    } else {
      setSubmitted(true)
      setStep(4)
    }
    setSubmitting(false)
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

  const timeSlots = selectedService
    ? generateTimeSlots(selectedService.duration_minutes)
    : []
  const availableSlots = timeSlots.filter((t) => !bookedTimes.includes(t))

  return (
    <div
      className="min-h-screen bg-background sm:bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_34%),#050816]"
      dir="rtl"
    >
      {/* Business header */}
      <div
        className="border-b"
        style={{
          background: "rgba(5,8,22,0.94)",
          borderColor: "rgba(125,211,252,0.12)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto max-w-xl px-4 py-4">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="shrink-0 bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text font-heading text-xl font-extrabold text-transparent">
                zimtor
              </span>
              <span className="text-white/20">·</span>
              <div className="min-w-0">
                <h1 className="truncate font-heading text-lg font-bold text-white sm:text-xl">
                  {business?.name}
                </h1>
                <p className="text-xs font-semibold text-blue-300">קביעת תור</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <div className="mx-auto max-w-xl px-4 pt-5 pb-1 sm:pt-6">
          <div className="relative grid grid-cols-3">
            <div
              className={`pointer-events-none absolute top-4 right-[calc(16.666%+1.25rem)] left-[calc(50%+1.25rem)] z-0 h-px transition-colors duration-300 ${
                step > 1 ? "bg-blue-500" : "bg-white/10"
              }`}
            />
            <div
              className={`pointer-events-none absolute top-4 right-[calc(50%+1.25rem)] left-[calc(16.666%+1.25rem)] z-0 h-px transition-colors duration-300 ${
                step > 2 ? "bg-blue-500" : "bg-white/10"
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
                      ? "bg-blue-500/20 text-blue-400"
                      : step === s
                        ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-[0_0_0_3px] shadow-blue-500/20"
                        : "bg-white/5 text-slate-500"
                  }`}
                >
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                <span
                  className={`max-w-full truncate text-center text-[11px] leading-none ${
                    step === idx + 1
                      ? "font-semibold text-blue-300"
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
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:border-cyan-200/12 sm:bg-[rgba(7,12,29,0.92)] sm:p-5 sm:shadow-[0_24px_80px_rgba(0,0,0,0.32),0_0_60px_rgba(59,130,246,0.08)]">
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
                <h2 className="mb-4 font-heading text-xl font-semibold text-white">
                  בחר שירות
                </h2>
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
                        setStep(2)
                      }}
                      className="w-full rounded-2xl border border-white/8 bg-white/5 p-4 text-end transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 sm:border-cyan-200/12 sm:bg-[rgba(9,14,32,0.86)] sm:hover:border-cyan-300/35 sm:hover:bg-[rgba(12,20,42,0.96)]"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(59,130,246,0.4)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor =
                          window.innerWidth >= 640
                            ? "rgba(125,211,252,0.12)"
                            : "rgba(255,255,255,0.08)")
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                          <Clock className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 text-end">
                          <p className="truncate text-sm font-semibold text-slate-200 sm:text-slate-50">
                            {s.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-slate-500 sm:font-medium sm:text-slate-400">
                            <span>{s.duration_minutes} דקות</span>
                            {s.price != null && (
                              <span className="font-semibold text-blue-400">
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
                    className="text-sm text-slate-500 transition-colors hover:text-blue-400"
                  >
                    חזור
                  </button>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm sm:border-cyan-200/12 sm:bg-[rgba(9,14,32,0.86)]">
                  <span className="text-slate-500 sm:text-slate-400">
                    שירות:{" "}
                  </span>
                  <span className="font-medium text-slate-200 sm:text-slate-50">
                    {selectedService?.name}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>תאריך</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    min={todayDateString()}
                    className="sm:h-11 sm:rounded-2xl sm:border-cyan-200/14 sm:bg-[rgba(6,11,27,0.9)] sm:px-4 sm:font-medium sm:text-slate-100 sm:[color-scheme:dark] sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(59,130,246,0.02)] sm:focus-visible:border-cyan-300/60 sm:focus-visible:ring-cyan-400/25 sm:[&::-webkit-calendar-picker-indicator]:cursor-pointer sm:[&::-webkit-calendar-picker-indicator]:opacity-80 sm:[&::-webkit-calendar-picker-indicator]:hue-rotate-[155deg] sm:[&::-webkit-calendar-picker-indicator]:invert sm:[&::-webkit-calendar-picker-indicator]:saturate-[3] sm:[&::-webkit-calendar-picker-indicator]:sepia"
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setSelectedTime(null)
                    }}
                    dir="ltr"
                  />
                </div>

                {selectedDate && (
                  <div className="space-y-3 rounded-2xl border border-white/6 bg-white/[0.03] p-3.5 sm:border-cyan-200/10 sm:bg-[rgba(6,11,27,0.78)]">
                    <Label>
                      {formatDateHebrew(selectedDate)} — שעות פנויות
                    </Label>
                    {loadingSlots ? (
                      <div className="flex justify-center py-5">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        אין שעות פנויות בתאריך זה.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`rounded-xl border py-2.5 text-sm font-semibold transition-all duration-150 ${
                              selectedTime === slot
                                ? "border-cyan-200/40 bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg ring-1 shadow-blue-500/30 ring-cyan-300/40 sm:shadow-[0_0_28px_rgba(34,211,238,0.2)]"
                                : "border-white/8 bg-white/5 text-slate-200 hover:border-blue-500/40 hover:bg-white/8 sm:border-cyan-200/12 sm:bg-[rgba(15,23,42,0.82)] sm:text-slate-100 sm:hover:border-cyan-300/45 sm:hover:bg-[rgba(20,31,58,0.96)] sm:hover:text-white sm:hover:shadow-[0_0_22px_rgba(59,130,246,0.14)]"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  disabled={!selectedTime}
                  onClick={() => setStep(3)}
                  className="w-full rounded-2xl bg-linear-to-r from-blue-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:opacity-40"
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
                    className="text-sm text-slate-500 transition-colors hover:text-blue-400"
                  >
                    חזור
                  </button>
                </div>

                <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3.5 text-sm sm:border-cyan-200/12 sm:bg-[rgba(9,14,32,0.86)]">
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
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cphone">טלפון</Label>
                    <Input
                      id="cphone"
                      type="tel"
                      placeholder="050-0000000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
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
                  disabled={
                    !customerName.trim() || !customerPhone.trim() || submitting
                  }
                  onClick={handleBooking}
                  className="w-full rounded-2xl bg-linear-to-r from-blue-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:opacity-40"
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

                  <div className="mx-auto mb-6 max-w-sm space-y-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 text-start text-sm sm:border-cyan-200/12 sm:bg-[rgba(9,14,32,0.86)]">
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

                  <button
                    onClick={() => {
                      setStep(1)
                      setSelectedService(null)
                      setSelectedTime(null)
                      setCustomerName("")
                      setCustomerPhone("")
                      setSubmitted(false)
                    }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/10"
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
