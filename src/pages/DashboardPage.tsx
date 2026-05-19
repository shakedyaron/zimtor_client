import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Plus,
  Trash2,
  LogOut,
  ExternalLink,
  Clock,
  Phone,
  ChevronDown,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Business, Service, Appointment } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const DEFAULT_OPENING_TIME = "09:00"
const DEFAULT_CLOSING_TIME = "18:00"
const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4]
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const totalMinutes = index * 15
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
})

const weekDays = [
  { value: 0, label: "ראשון" },
  { value: 1, label: "שני" },
  { value: 2, label: "שלישי" },
  { value: 3, label: "רביעי" },
  { value: 4, label: "חמישי" },
  { value: 5, label: "שישי" },
  { value: 6, label: "שבת" },
]

const statusLabel: Record<string, string> = {
  pending: "ממתין",
  confirmed: "מאושר",
  cancelled: "בוטל",
}

const statusVariant: Record<
  string,
  "default" | "success" | "destructive" | "warning"
> = {
  pending: "warning",
  confirmed: "success",
  cancelled: "destructive",
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5)
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

function getAppointmentDateTime(appointment: Appointment) {
  const [year, month, day] = appointment.appointment_date.split("-").map(Number)
  const [hour, minute] = formatTime(appointment.appointment_time)
    .split(":")
    .map(Number)

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null
  }

  return new Date(year, month - 1, day, hour, minute)
}

function isUpcomingAppointment(appointment: Appointment) {
  if (appointment.status === "cancelled") return false
  const appointmentDateTime = getAppointmentDateTime(appointment)
  return appointmentDateTime
    ? appointmentDateTime.getTime() >= Date.now()
    : false
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const [loadError, setLoadError] = useState<string | null>(null)

  const [showAddService, setShowAddService] = useState(false)
  const [newServiceName, setNewServiceName] = useState("")
  const [newServiceDuration, setNewServiceDuration] = useState("30")
  const [newServicePrice, setNewServicePrice] = useState("")
  const [addingService, setAddingService] = useState(false)
  const [addServiceError, setAddServiceError] = useState<string | null>(null)
  const [openingTime, setOpeningTime] = useState(DEFAULT_OPENING_TIME)
  const [closingTime, setClosingTime] = useState(DEFAULT_CLOSING_TIME)
  const [workingDays, setWorkingDays] = useState<number[]>(DEFAULT_WORKING_DAYS)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  )
  const [availabilitySuccess, setAvailabilitySuccess] = useState<string | null>(
    null
  )
  const [businessName, setBusinessName] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [businessWhatsapp, setBusinessWhatsapp] = useState("")
  const [businessInstagram, setBusinessInstagram] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [businessLogoUrl, setBusinessLogoUrl] = useState("")
  const [businessCoverUrl, setBusinessCoverUrl] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showAvailabilitySettings, setShowAvailabilitySettings] =
    useState(false)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    setLoadError(null)

    const { data: biz, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user!.id)
      .maybeSingle()

    if (bizError) {
      console.error("loadData: businesses fetch failed", bizError)
      setLoadError("שגיאה בטעינת נתוני העסק. רענן את הדף.")
      setLoading(false)
      return
    }

    if (!biz) {
      navigate("/create-business")
      return
    }

    setBusiness(biz)
    setOpeningTime(biz.opening_time?.slice(0, 5) ?? DEFAULT_OPENING_TIME)
    setClosingTime(biz.closing_time?.slice(0, 5) ?? DEFAULT_CLOSING_TIME)
    setWorkingDays(getBusinessWorkingDays(biz))
    setBusinessName(biz.name ?? "")
    setBusinessDescription(biz.description ?? "")
    setBusinessPhone(biz.phone ?? "")
    setBusinessWhatsapp(biz.whatsapp_url ?? "")
    setBusinessInstagram(biz.instagram_url ?? "")
    setBusinessAddress(biz.address ?? "")
    setBusinessLogoUrl(biz.logo_url ?? "")
    setBusinessCoverUrl(biz.cover_image_url ?? "")

    const [{ data: svcs }, { data: apts }] = await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at"),
      supabase
        .from("appointments")
        .select("*, services(name, duration_minutes)")
        .eq("business_id", biz.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true }),
    ])

    setServices(svcs ?? [])
    setAppointments(apts ?? [])
    setLoading(false)
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setAddServiceError(null)
    const trimmedName = newServiceName.trim()
    const duration = Number(newServiceDuration)
    const price = newServicePrice.trim() ? Number(newServicePrice) : null

    if (!trimmedName) {
      setAddServiceError("יש להזין שם שירות.")
      return
    }
    if (!newServiceDuration.trim()) {
      setAddServiceError("יש להזין משך שירות.")
      return
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setAddServiceError("משך השירות חייב להיות מספר חיובי.")
      return
    }
    if (price !== null && (!Number.isFinite(price) || price <= 0)) {
      setAddServiceError("מחיר השירות חייב להיות מספר חיובי.")
      return
    }

    setAddingService(true)

    const { error } = await supabase.from("services").insert({
      business_id: business.id,
      name: trimmedName,
      duration_minutes: duration,
      price,
    })

    if (error) {
      console.error("handleAddService: insert failed", error)
      setAddServiceError("שגיאה בשמירת השירות. נסה שוב.")
    } else {
      setNewServiceName("")
      setNewServiceDuration("30")
      setNewServicePrice("")
      setAddServiceError(null)
      setShowAddService(false)
      loadData()
    }
    setAddingService(false)
  }

  async function handleDeleteService(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id)
    if (error) {
      console.error("handleDeleteService: delete failed", error)
      return
    }
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleCancelAppointment(id: string) {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id)
    if (error) {
      console.error("handleCancelAppointment: update failed", error)
      return
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    )
  }

  function toggleWorkingDay(day: number) {
    setAvailabilityError(null)
    setAvailabilitySuccess(null)
    setWorkingDays((prev) =>
      prev.includes(day)
        ? prev.filter((currentDay) => currentDay !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  async function handleSaveAvailability(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setAvailabilityError(null)
    setAvailabilitySuccess(null)

    if (!openingTime) {
      setAvailabilityError("יש לבחור שעת פתיחה.")
      return
    }
    if (!closingTime) {
      setAvailabilityError("יש לבחור שעת סגירה.")
      return
    }
    if (openingTime >= closingTime) {
      setAvailabilityError("שעת הסגירה חייבת להיות אחרי שעת הפתיחה.")
      return
    }
    if (workingDays.length === 0) {
      setAvailabilityError("יש לבחור לפחות יום עבודה אחד.")
      return
    }

    setSavingAvailability(true)
    const { data, error } = await supabase
      .from("businesses")
      .update({
        opening_time: openingTime,
        closing_time: closingTime,
        working_days: workingDays,
      })
      .eq("id", business.id)
      .select("*")
      .single()

    if (error) {
      console.error("handleSaveAvailability: update failed", error)
      setAvailabilityError("שגיאה בשמירת הגדרות הזמינות. נסה שוב.")
    } else {
      setBusiness(data)
      setOpeningTime(data.opening_time?.slice(0, 5) ?? DEFAULT_OPENING_TIME)
      setClosingTime(data.closing_time?.slice(0, 5) ?? DEFAULT_CLOSING_TIME)
      setWorkingDays(getBusinessWorkingDays(data))
      setAvailabilitySuccess("הגדרות הזמינות נשמרו.")
    }
    setSavingAvailability(false)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setProfileError(null)
    setProfileSuccess(null)

    const trimmedName = businessName.trim()
    if (!trimmedName) {
      setProfileError("יש להזין שם עסק.")
      return
    }

    setSavingProfile(true)
    const { data, error } = await supabase
      .from("businesses")
      .update({
        name: trimmedName,
        description: businessDescription.trim() || null,
        phone: businessPhone.trim() || null,
        whatsapp_url: businessWhatsapp.trim() || null,
        instagram_url: businessInstagram.trim() || null,
        address: businessAddress.trim() || null,
        logo_url: businessLogoUrl.trim() || null,
        cover_image_url: businessCoverUrl.trim() || null,
      })
      .eq("id", business.id)
      .select("*")
      .single()

    if (error) {
      console.error("handleSaveProfile: update failed", error)
      setProfileError("שגיאה בשמירת פרטי העסק. נסה שוב.")
    } else {
      setBusiness(data)
      setBusinessName(data.name ?? "")
      setBusinessDescription(data.description ?? "")
      setBusinessPhone(data.phone ?? "")
      setBusinessWhatsapp(data.whatsapp_url ?? "")
      setBusinessInstagram(data.instagram_url ?? "")
      setBusinessAddress(data.address ?? "")
      setBusinessLogoUrl(data.logo_url ?? "")
      setBusinessCoverUrl(data.cover_image_url ?? "")
      setProfileSuccess("פרטי העסק נשמרו.")
    }

    setSavingProfile(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center"
        dir="rtl"
      >
        <p className="text-sm text-red-400">{loadError}</p>
        <button
          onClick={() => loadData()}
          className="rounded-lg bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/25"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  const upcomingAppointments = appointments.filter(isUpcomingAppointment)

  const bookingUrl = `/${business?.slug}`
  const bookingDisplayUrl = `${new URL(window.location.origin).host}/${business?.slug ?? ""}`

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: "rgba(5,8,22,0.94)",
          borderColor: "rgba(125,211,252,0.12)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text font-heading text-xl font-bold text-transparent">
              zimtor
            </span>
            <span className="text-white/20">·</span>
            <span className="truncate text-sm font-semibold text-slate-100">
              {business?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-blue-500/10 hover:text-white sm:flex"
            >
              דף ההזמנות
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-slate-300 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">יציאה</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-5 sm:py-6 lg:py-7">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-3 sm:gap-4"
        >
          <div
            className="rounded-2xl p-4 shadow-[0_14px_40px_rgba(0,0,0,0.14)] sm:p-5"
            style={{
              background: "rgba(9,14,32,0.86)",
              border: "1px solid rgba(125,211,252,0.14)",
            }}
          >
            <p className="mb-1 text-xs font-medium text-slate-300">
              תורים קרובים
            </p>
            <p className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text font-heading text-3xl leading-none font-bold text-transparent sm:text-4xl">
              {upcomingAppointments.length}
            </p>
          </div>
          <div
            className="rounded-2xl p-4 shadow-[0_14px_40px_rgba(0,0,0,0.14)] sm:p-5"
            style={{
              background: "rgba(9,14,32,0.86)",
              border: "1px solid rgba(125,211,252,0.14)",
            }}
          >
            <p className="mb-1 text-xs font-medium text-slate-300">
              שירותים פעילים
            </p>
            <p className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text font-heading text-3xl leading-none font-bold text-transparent sm:text-4xl">
              {services.length}
            </p>
          </div>
          {business?.phone && (
            <div
              className="hidden flex-col justify-center rounded-2xl p-5 shadow-[0_14px_40px_rgba(0,0,0,0.14)] sm:flex"
              style={{
                background: "rgba(9,14,32,0.86)",
                border: "1px solid rgba(125,211,252,0.14)",
              }}
            >
              <p className="mb-1 text-xs font-medium text-slate-300">טלפון</p>
              <p className="text-sm font-semibold text-slate-100" dir="ltr">
                {business.phone}
              </p>
            </div>
          )}
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.03 }}
          onSubmit={handleSaveProfile}
          className="mb-4 overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.16)] sm:mb-5"
          style={{
            background: "rgba(7,12,29,0.9)",
            border: "1px solid rgba(125,211,252,0.12)",
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
            style={{
              borderBottom: showProfileSettings
                ? "1px solid rgba(125,211,252,0.1)"
                : "0",
            }}
          >
            <button
              type="button"
              onClick={() => setShowProfileSettings((open) => !open)}
              className="flex min-w-0 flex-1 items-center gap-3 text-right"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-blue-500/10 text-cyan-300">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showProfileSettings ? "rotate-180" : ""
                  }`}
                />
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-base font-bold text-slate-50">
                  ערוך פרטי עסק
                </span>
                <span className="mt-1 block truncate text-xs text-slate-400">
                  שם, פרטי קשר ומיתוג לדף ההזמנות
                </span>
              </span>
            </button>
            {showProfileSettings && (
              <button
                type="submit"
                disabled={savingProfile}
                className="shrink-0 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/15 transition hover:opacity-90 disabled:opacity-60"
              >
                {savingProfile ? "שומר..." : "שמור"}
              </button>
            )}
          </div>

          {showProfileSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-4 px-4 py-4 sm:px-5"
            >
              <p className="text-xs text-slate-400">
                הפרטים שמופיעים בדף ההזמנות הציבורי
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="business-name"
                    className="text-xs text-slate-400"
                  >
                    שם העסק
                  </Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value)
                      setProfileError(null)
                      setProfileSuccess(null)
                    }}
                    className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    placeholder="שם העסק"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="business-phone"
                    className="text-xs text-slate-400"
                  >
                    טלפון
                  </Label>
                  <Input
                    id="business-phone"
                    value={businessPhone}
                    onChange={(e) => {
                      setBusinessPhone(e.target.value)
                      setProfileError(null)
                      setProfileSuccess(null)
                    }}
                    className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    placeholder="050-0000000"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="business-description"
                    className="text-xs text-slate-400"
                  >
                    תיאור העסק
                  </Label>
                  <Input
                    id="business-description"
                    value={businessDescription}
                    onChange={(e) => {
                      setBusinessDescription(e.target.value)
                      setProfileError(null)
                      setProfileSuccess(null)
                    }}
                    className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    placeholder="משפט קצר על העסק והשירותים"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="business-whatsapp"
                    className="text-xs text-slate-400"
                  >
                    WhatsApp URL או טלפון
                  </Label>
                  <Input
                    id="business-whatsapp"
                    value={businessWhatsapp}
                    onChange={(e) => {
                      setBusinessWhatsapp(e.target.value)
                      setProfileError(null)
                      setProfileSuccess(null)
                    }}
                    className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    placeholder="https://wa.me/972..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="business-instagram"
                    className="text-xs text-slate-400"
                  >
                    Instagram URL
                  </Label>
                  <Input
                    id="business-instagram"
                    value={businessInstagram}
                    onChange={(e) => {
                      setBusinessInstagram(e.target.value)
                      setProfileError(null)
                      setProfileSuccess(null)
                    }}
                    className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    placeholder="https://instagram.com/..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="business-address"
                    className="text-xs text-slate-400"
                  >
                    כתובת
                  </Label>
                  <Input
                    id="business-address"
                    value={businessAddress}
                    onChange={(e) => {
                      setBusinessAddress(e.target.value)
                      setProfileError(null)
                      setProfileSuccess(null)
                    }}
                    className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    placeholder="כתובת העסק"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="business-logo"
                    className="text-xs text-slate-400"
                  >
                    Logo URL
                  </Label>
                  <Input
                    id="business-logo"
                    value={businessLogoUrl}
                    onChange={(e) => {
                      setBusinessLogoUrl(e.target.value)
                      setProfileError(null)
                      setProfileSuccess(null)
                    }}
                    className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="business-cover"
                    className="text-xs text-slate-400"
                  >
                    Cover image URL
                  </Label>
                  <Input
                    id="business-cover"
                    value={businessCoverUrl}
                    onChange={(e) => {
                      setBusinessCoverUrl(e.target.value)
                      setProfileError(null)
                      setProfileSuccess(null)
                    }}
                    className="border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
              </div>

              {profileError && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {profileError}
                </p>
              )}
              {profileSuccess && (
                <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
                  {profileSuccess}
                </p>
              )}
            </motion.div>
          )}
        </motion.form>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.04 }}
          onSubmit={handleSaveAvailability}
          className="mb-4 overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.16)] sm:mb-5"
          style={{
            background: "rgba(7,12,29,0.9)",
            border: "1px solid rgba(125,211,252,0.12)",
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
            style={{
              borderBottom: showAvailabilitySettings
                ? "1px solid rgba(125,211,252,0.1)"
                : "0",
            }}
          >
            <button
              type="button"
              onClick={() => setShowAvailabilitySettings((open) => !open)}
              className="flex min-w-0 flex-1 items-center gap-3 text-right"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-blue-500/10 text-cyan-300">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showAvailabilitySettings ? "rotate-180" : ""
                  }`}
                />
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-base font-bold text-slate-50">
                  הגדרות זמינות
                </span>
                <span className="mt-1 block truncate text-xs text-slate-400">
                  שעות פתיחה וימי עבודה להזמנות
                </span>
              </span>
            </button>
            {showAvailabilitySettings && (
              <button
                type="submit"
                disabled={savingAvailability}
                className="shrink-0 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/15 transition hover:opacity-90 disabled:opacity-60"
              >
                {savingAvailability ? "שומר..." : "שמור"}
              </button>
            )}
          </div>

          {showAvailabilitySettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-4 px-4 py-4 sm:px-5"
            >
              <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">שעת פתיחה</Label>
                  <select
                    value={openingTime}
                    onChange={(e) => {
                      setOpeningTime(e.target.value)
                      setAvailabilityError(null)
                      setAvailabilitySuccess(null)
                    }}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-slate-100 shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    dir="ltr"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time} className="bg-slate-950">
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">שעת סגירה</Label>
                  <select
                    value={closingTime}
                    onChange={(e) => {
                      setClosingTime(e.target.value)
                      setAvailabilityError(null)
                      setAvailabilitySuccess(null)
                    }}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-slate-100 shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    dir="ltr"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time} className="bg-slate-950">
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-400">ימי עבודה</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => {
                    const active = workingDays.includes(day.value)
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWorkingDay(day.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? "border-cyan-300/35 bg-blue-500/15 text-cyan-200"
                            : "border-white/8 bg-white/4 text-slate-400 hover:border-cyan-300/20 hover:text-slate-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {availabilityError && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {availabilityError}
                </p>
              )}
              {availabilitySuccess && (
                <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
                  {availabilitySuccess}
                </p>
              )}
            </motion.div>
          )}
        </motion.form>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.07 }}
          >
            <div
              className="overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
              style={{
                background: "rgba(7,12,29,0.9)",
                border: "1px solid rgba(125,211,252,0.12)",
              }}
            >
              <div
                className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
                style={{ borderBottom: "1px solid rgba(125,211,252,0.1)" }}
              >
                <h2 className="font-heading text-base font-bold text-slate-50">
                  שירותים
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddService(!showAddService)}
                  className="shrink-0 gap-1.5 text-xs font-medium text-slate-300 hover:text-blue-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  הוסף שירות
                </Button>
              </div>

              {showAddService && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  onSubmit={handleAddService}
                  noValidate
                  className="space-y-3 px-4 py-4 sm:px-5"
                  style={{
                    borderBottom: "1px solid rgba(125,211,252,0.1)",
                    background: "rgba(15,23,42,0.45)",
                  }}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="col-span-2 space-y-1 sm:col-span-3">
                      <Label className="text-xs">שם שירות</Label>
                      <Input
                        placeholder="תספורת גברים"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">דקות</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(e.target.value)}
                        min={5}
                        dir="ltr"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">מחיר ₪</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        min={0}
                        dir="ltr"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  {addServiceError && (
                    <p className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
                      {addServiceError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setShowAddService(false)
                        setAddServiceError(null)
                      }}
                    >
                      ביטול
                    </Button>
                    <button
                      type="submit"
                      disabled={addingService}
                      className="h-7 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 px-3 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {addingService ? "שומר..." : "שמור"}
                    </button>
                  </div>
                </motion.form>
              )}

              <div
                className="divide-y"
                style={{ borderColor: "rgba(125,211,252,0.1)" }}
              >
                {services.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">
                    עדיין אין שירותים. הוסף שירות ראשון.
                  </p>
                ) : (
                  services.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/3 sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-50">
                          {s.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{s.duration_minutes} דקות</span>
                          {s.price != null && (
                            <span className="font-semibold text-cyan-300">
                              ₪{s.price}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
          >
            <div
              className="overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
              style={{
                background: "rgba(7,12,29,0.9)",
                border: "1px solid rgba(125,211,252,0.12)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4"
                style={{ borderBottom: "1px solid rgba(125,211,252,0.1)" }}
              >
                <h2 className="font-heading text-base font-bold text-slate-50">
                  תורים קרובים
                </h2>
                <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400">
                  {upcomingAppointments.length}
                </span>
              </div>

              <div
                className="divide-y lg:max-h-[460px] lg:overflow-y-auto"
                style={{ borderColor: "rgba(125,211,252,0.1)" }}
              >
                {upcomingAppointments.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">
                    אין תורים קרובים.
                  </p>
                ) : (
                  upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="px-4 py-3.5 transition-colors hover:bg-white/3 sm:px-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-100">
                              {apt.customer_name}
                            </span>
                            <Badge
                              variant={statusVariant[apt.status] ?? "default"}
                              className="h-5 py-0 text-[10px]"
                            >
                              {statusLabel[apt.status] ?? apt.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-xs leading-5 text-slate-400">
                            <p className="font-semibold text-slate-300">
                              {formatDate(apt.appointment_date)} ·{" "}
                              {formatTime(apt.appointment_time)}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-2.5 w-2.5" />
                              <span dir="ltr">{apt.customer_phone}</span>
                            </div>
                            {(
                              apt as Appointment & {
                                services?: { name: string }
                              }
                            ).services?.name && (
                              <p className="font-medium text-slate-300">
                                {
                                  (
                                    apt as Appointment & {
                                      services?: { name: string }
                                    }
                                  ).services!.name
                                }
                              </p>
                            )}
                          </div>
                        </div>
                        {apt.status === "pending" && (
                          <button
                            onClick={() => handleCancelAppointment(apt.id)}
                            className="self-end rounded-lg border border-red-400/15 bg-red-500/8 px-2.5 py-1.5 text-[10px] font-semibold text-red-300 transition-colors hover:bg-destructive/10 hover:text-destructive sm:self-start"
                          >
                            בטל תור
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Booking link bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="mt-4 rounded-2xl px-4 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.16)] sm:px-5"
          style={{
            background: "rgba(7,12,29,0.9)",
            border: "1px solid rgba(59,130,246,0.28)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium text-slate-300">
                קישור לדף ההזמנות שלך
              </p>
              <p
                dir="ltr"
                title={`${window.location.origin}/${business?.slug ?? ""}`}
                className="max-w-[220px] truncate font-mono text-sm font-semibold text-cyan-300 sm:max-w-sm"
              >
                {bookingDisplayUrl}
              </p>
            </div>
            <a href={bookingUrl} target="_blank" rel="noreferrer">
              <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 sm:w-auto">
                פתח
                <ExternalLink className="h-3 w-3" />
              </button>
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
