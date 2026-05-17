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
  const interval = Math.max(durationMinutes, 30)
  for (let m = startMinutes; m + durationMinutes <= endMinutes; m += interval) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`)
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
        <h1 className="font-heading mb-2 text-2xl font-bold text-white">
          העסק לא נמצא
        </h1>
        <p className="text-sm text-slate-400">הקישור שהגעת אליו לא תקין.</p>
      </div>
    )
  }

  const timeSlots = selectedService ? generateTimeSlots(selectedService.duration_minutes) : []
  const availableSlots = timeSlots.filter((t) => !bookedTimes.includes(t))

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Business header */}
      <div
        className="border-b"
        style={{
          background: "rgba(5,8,22,0.85)",
          borderColor: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto max-w-lg px-4 py-5">
          <p className="mb-0.5 text-xs font-medium text-slate-500">קביעת תור</p>
          <h1 className="font-heading text-2xl font-bold text-white">
            {business?.name}
          </h1>
        </div>
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <div className="mx-auto max-w-lg px-4 pb-1 pt-5">
          <div className="flex items-center">
            {[1, 2, 3].map((s, idx) => (
              <div key={s} className="flex flex-1 items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    step > s
                      ? "bg-blue-500/20 text-blue-400"
                      : step === s
                        ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-[0_0_0_3px] shadow-blue-500/20"
                        : "bg-white/5 text-slate-500"
                  }`}
                >
                  {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                </div>
                {idx < 2 && (
                  <div
                    className={`mx-2 h-px flex-1 transition-colors duration-300 ${
                      step > s ? "bg-blue-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-0.5 text-[11px] text-slate-500">
            {stepLabels.map((label, idx) => (
              <span
                key={label}
                className={`${step === idx + 1 ? "font-medium text-blue-400" : ""}`}
                style={{
                  width: "33.33%",
                  textAlign: idx === 0 ? "right" : idx === 2 ? "left" : "center",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="mx-auto max-w-lg px-4 py-6">
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
              className="space-y-3"
            >
              <h2 className="font-heading mb-5 text-xl font-semibold text-white">
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
                    className="w-full rounded-xl p-4 text-end transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <Clock className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-semibold text-slate-200">{s.name}</p>
                        <div className="mt-0.5 flex items-center justify-end gap-2 text-xs text-slate-500">
                          <span>{s.duration_minutes} דקות</span>
                          {s.price != null && (
                            <span className="font-semibold text-blue-400">₪{s.price}</span>
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
              className="space-y-5"
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

              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-slate-500">שירות: </span>
                <span className="font-medium text-slate-200">{selectedService?.name}</span>
              </div>

              <div className="space-y-1.5">
                <Label>תאריך</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={todayDateString()}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedTime(null)
                  }}
                  dir="ltr"
                />
              </div>

              {selectedDate && (
                <div className="space-y-2.5">
                  <Label>{formatDateHebrew(selectedDate)} — שעות פנויות</Label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-5">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      אין שעות פנויות בתאריך זה.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`rounded-lg py-2 text-sm font-medium transition-all duration-150 ${
                            selectedTime === slot
                              ? "bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                              : "text-slate-300 hover:border-blue-500/40"
                          }`}
                          style={selectedTime === slot ? {} : {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
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
                className="w-full rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:opacity-40"
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
              className="space-y-5"
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

              <div
                className="space-y-1.5 rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex justify-between">
                  <span className="text-slate-500">שירות</span>
                  <span className="font-medium text-slate-200">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">תאריך</span>
                  <span className="font-medium text-slate-200">{formatDateHebrew(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">שעה</span>
                  <span className="font-medium text-slate-200">{selectedTime}</span>
                </div>
              </div>

              <div className="space-y-4">
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
                disabled={!customerName.trim() || !customerPhone.trim() || submitting}
                onClick={handleBooking}
                className="w-full rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:opacity-40"
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
              className="py-10 text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: "backOut" }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-4 ring-green-500/10"
              >
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <h2 className="font-heading mb-2 text-2xl font-bold text-white">
                  התור נקבע!
                </h2>
                <p className="mb-6 text-sm text-slate-400">
                  {customerName}, התור שלך אצל{" "}
                  <span className="font-medium text-slate-200">{business?.name}</span> נרשם.
                </p>

                <div
                  className="mx-auto mb-6 max-w-xs space-y-1.5 rounded-xl px-4 py-3 text-start text-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex justify-between">
                    <span className="text-slate-500">שירות</span>
                    <span className="font-medium text-slate-200">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">תאריך</span>
                    <span className="font-medium text-slate-200">{formatDateHebrew(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">שעה</span>
                    <span className="font-medium text-slate-200">{selectedTime}</span>
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
                  className="text-sm text-blue-400 hover:underline"
                >
                  קביעת תור נוסף
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
