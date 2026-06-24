import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Plus,
  Trash2,
  LogOut,
  ExternalLink,
  Clock,
  ChevronDown,
  ImageIcon,
  Loader2,
  UploadCloud,
  Calendar,
  History,
  Check,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import {
  deleteStorageFile,
  uploadBusinessCover,
  uploadBusinessLogo,
} from "@/lib/storage"
import {
  buildWeeklyAvailabilityFromBusiness,
  getLegacyAvailabilityFields,
  slotOverlapsBreak,
  validateWeeklyAvailability,
  type WeeklyAvailability,
} from "@/lib/availability"
import {
  appointmentServiceDuration,
  appointmentServicePrice,
} from "@/lib/appointmentSnapshot"
import type { Business, Service, Appointment } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import WeeklyAvailabilityEditor from "@/components/WeeklyAvailabilityEditor"

const DEFAULT_OPENING_TIME = "09:00"
const DEFAULT_CLOSING_TIME = "18:00"

type AppointmentStatus = "future" | "completed" | "cancelled" | "no_show"

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5)
}

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
  if (normalizeAppointmentStatus(appointment.status) !== "future") return false
  const appointmentDateTime = getAppointmentDateTime(appointment)
  return appointmentDateTime
    ? appointmentDateTime.getTime() >= Date.now()
    : false
}

function appointmentOverlaps(
  newStartMinutes: number,
  newDurationMinutes: number,
  appointment: Appointment
) {
  const existingStartMinutes = timeToMinutes(
    formatTime(appointment.appointment_time)
  )
  const existingDurationMinutes = appointmentServiceDuration(appointment)

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

// ──────────────────────────────────────────────────────────────────────────────

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
  const [weeklyAvailability, setWeeklyAvailability] =
    useState<WeeklyAvailability>(() =>
      buildWeeklyAvailabilityFromBusiness(null)
    )
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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showAvailabilitySettings, setShowAvailabilitySettings] =
    useState(false)
  const [businessTheme, setBusinessTheme] = useState<string>("dark")
  const [themeSuccess, setThemeSuccess] = useState<string | null>(null)

  const appointmentsRef = useRef<Appointment[]>([])
  appointmentsRef.current = appointments

  async function runAutoComplete(apts: Appointment[]) {
    const now = Date.now()
    const toComplete = apts.filter((apt) => {
      if (normalizeAppointmentStatus(apt.status) !== "future") return false
      const start = getAppointmentDateTime(apt)
      if (!start) return false
      return start.getTime() + appointmentServiceDuration(apt) * 60_000 < now
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

  useEffect(() => {
    const id = setInterval(
      () => runAutoComplete(appointmentsRef.current),
      60_000
    )
    return () => clearInterval(id)
  }, [])

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
      navigate("/onboarding")
      return
    }

    setBusiness(biz)
    setBusinessTheme(biz.business_theme ?? "dark")
    setWeeklyAvailability(buildWeeklyAvailabilityFromBusiness(biz))
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
        .select("*, services(name, duration_minutes, price)")
        .eq("business_id", biz.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true }),
    ])

    setServices(svcs ?? [])
    const freshApts = apts ?? []
    setAppointments(freshApts)
    setLoading(false)
    if (freshApts.length) runAutoComplete(freshApts)
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setAddServiceError(null)
    const trimmedName = newServiceName.trim()
    const duration = Number(newServiceDuration)
    const trimmedPrice = newServicePrice.trim()
    const price = Number(trimmedPrice)

    if (!trimmedName) {
      setAddServiceError("שם השירות חובה")
      return
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setAddServiceError("משך השירות חייב להיות גדול מ-0")
      return
    }
    if (!trimmedPrice) {
      setAddServiceError("מחיר השירות חובה")
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setAddServiceError("מחיר השירות חייב להיות גדול מ-0")
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

  async function handleSaveAvailability(e: React.FormEvent) {
    e.preventDefault()
    if (!business) return
    setAvailabilityError(null)
    setAvailabilitySuccess(null)

    const validationError = validateWeeklyAvailability(weeklyAvailability)
    if (validationError) {
      setAvailabilityError(validationError)
      return
    }

    const legacyFields = getLegacyAvailabilityFields(weeklyAvailability)
    setSavingAvailability(true)
    const { data, error } = await supabase
      .from("businesses")
      .update({
        ...legacyFields,
        weekly_availability: weeklyAvailability,
      })
      .eq("id", business.id)
      .select("*")
      .single()

    if (error) {
      console.error("handleSaveAvailability: update failed", error)
      setAvailabilityError("שגיאה בשמירת הגדרות הזמינות. נסה שוב.")
    } else {
      setBusiness(data)
      setWeeklyAvailability(buildWeeklyAvailabilityFromBusiness(data))
      setAvailabilitySuccess("הגדרות הזמינות נשמרו.")
    }
    setSavingAvailability(false)
  }

  async function handleBusinessImageUpload(
    imageType: "logo" | "cover",
    file: File | undefined
  ) {
    if (!file || !business || !user) return

    const isLogo = imageType === "logo"
    const bucket = isLogo ? "business-logos" : "business-covers"
    const oldImageUrl = isLogo ? businessLogoUrl : businessCoverUrl

    setProfileError(null)
    setProfileSuccess(null)
    if (isLogo) {
      setUploadingLogo(true)
    } else {
      setUploadingCover(true)
    }

    try {
      const uploaded = isLogo
        ? await uploadBusinessLogo(user.id, file)
        : await uploadBusinessCover(user.id, file)

      const { data, error } = await supabase
        .from("businesses")
        .update(
          isLogo
            ? { logo_url: uploaded.publicUrl }
            : { cover_image_url: uploaded.publicUrl }
        )
        .eq("id", business.id)
        .select("*")
        .single()

      if (error) {
        await deleteStorageFile(bucket, uploaded.path)
        throw new Error("שגיאה בשמירת התמונה בעסק. נסה שוב.")
      }

      setBusiness(data)
      if (isLogo) {
        setBusinessLogoUrl(data.logo_url ?? "")
      } else {
        setBusinessCoverUrl(data.cover_image_url ?? "")
      }
      setProfileSuccess(
        isLogo ? "הלוגו נשמר בהצלחה." : "תמונת הקאבר נשמרה בהצלחה."
      )

      await deleteStorageFile(bucket, oldImageUrl)
    } catch (error) {
      console.error("handleBusinessImageUpload: upload failed", error)
      setProfileError(
        error instanceof Error ? error.message : "שגיאה בהעלאת התמונה. נסה שוב."
      )
    } finally {
      if (isLogo) {
        setUploadingLogo(false)
      } else {
        setUploadingCover(false)
      }
    }
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

  async function handleSaveTheme(theme: string) {
    if (!business) return
    const prev = businessTheme
    setBusinessTheme(theme)
    setThemeSuccess(null)
    const { error } = await supabase
      .from("businesses")
      .update({ business_theme: theme })
      .eq("id", business.id)
    if (error) {
      console.error("handleSaveTheme: update failed", error)
      setBusinessTheme(prev)
      return
    }
    setBusiness((b) => (b ? { ...b, business_theme: theme } : b))
    setThemeSuccess("העיצוב נשמר.")
    setTimeout(() => setThemeSuccess(null), 3000)
  }

  async function handleSignOut() {
    await signOut()
    navigate("/")
  }

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const upcomingAppointments = useMemo(
    () => appointments.filter(isUpcomingAppointment),
    [appointments]
  )

  // const statusKpis = useMemo(() => {
  //   return appointments.reduce(
  //     (counts, appointment) => {
  //       const status = normalizeAppointmentStatus(appointment.status)
  //       counts[status] += 1
  //       return counts
  //     },
  //     {
  //       completed: 0,
  //       cancelled: 0,
  //       no_show: 0,
  //       upcoming: 0,
  //     } satisfies Record<AppointmentStatus, number>
  //   )
  // }, [appointments])

  const todaySummary = useMemo(() => {
    const todayDate = new Date()
    const todayActiveAppointments = appointments.filter(
      (appointment) =>
        appointment.appointment_date === todayStr &&
        normalizeAppointmentStatus(appointment.status) !== "cancelled"
    )
    const completedRevenue = todayActiveAppointments.reduce(
      (total, appointment) => {
        if (normalizeAppointmentStatus(appointment.status) !== "completed") {
          return total
        }
        return total + appointmentServicePrice(appointment)
      },
      0
    )
    const todayAvailability = weeklyAvailability[String(todayDate.getDay())]
    const openingMinutes =
      timeToMinutes(todayAvailability?.open) ??
      timeToMinutes(DEFAULT_OPENING_TIME)!
    const closingMinutes =
      timeToMinutes(todayAvailability?.close) ??
      timeToMinutes(DEFAULT_CLOSING_TIME)!
    const shortestServiceDuration =
      services
        .map((service) => service.duration_minutes)
        .filter((duration) => Number.isFinite(duration) && duration > 0)
        .sort((a, b) => a - b)[0] ?? 30

    let availableSlots = 0
    if (
      todayAvailability?.enabled &&
      openingMinutes < closingMinutes &&
      services.length > 0
    ) {
      for (
        let slotStart = openingMinutes;
        slotStart + shortestServiceDuration <= closingMinutes;
        slotStart += shortestServiceDuration
      ) {
        if (
          slotOverlapsBreak(
            slotStart,
            shortestServiceDuration,
            todayAvailability
          )
        ) {
          continue
        }
        const hasConflict = todayActiveAppointments.some((appointment) =>
          appointmentOverlaps(slotStart, shortestServiceDuration, appointment)
        )
        if (!hasConflict) availableSlots += 1
      }
    }

    return {
      appointmentCount: todayActiveAppointments.length,
      completedRevenue,
      availableSlots,
    }
  }, [appointments, services, todayStr, weeklyAvailability])

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
          className="rounded-lg bg-indigo-500/12 px-4 py-2 text-sm font-medium text-indigo-400 transition hover:bg-indigo-500/20"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  const bookingUrl = `/${business?.slug}`
  const bookingDisplayUrl = `${new URL(window.location.origin).host}/${business?.slug ?? ""}`
  const isLightTheme = businessTheme === "light"

  return (
    <div
      className={`min-h-screen bg-background ${isLightTheme ? "dashboard-light" : ""}`}
      dir="rtl"
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: "rgba(5,8,22,0.94)",
          borderColor: "rgba(99,102,241,0.10)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text font-heading text-xl font-bold text-transparent">
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
              className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-indigo-500/8 hover:text-white sm:flex"
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
          className="dashboard-dark-stat-group mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-3 sm:gap-4"
        >
          <div
            className="rounded-2xl p-4 shadow-[0_14px_40px_rgba(0,0,0,0.14)] sm:p-5"
            style={{
              background: "rgba(9,14,32,0.86)",
              border: "1px solid rgba(99,102,241,0.12)",
            }}
          >
            <p className="mb-1 text-xs font-medium text-slate-300">
              תורים קרובים
            </p>
            <p className="bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text font-heading text-3xl leading-none font-bold text-transparent sm:text-4xl">
              {upcomingAppointments.length}
            </p>
          </div>

          <div
            className="rounded-2xl p-4 shadow-[0_14px_40px_rgba(0,0,0,0.14)] sm:p-5"
            style={{
              background: "rgba(9,14,32,0.86)",
              border: "1px solid rgba(99,102,241,0.12)",
            }}
          >
            <p className="mb-1 text-xs font-medium text-slate-500">
              שירותים פעילים
            </p>
            <p className="bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text font-heading text-3xl leading-none font-bold text-transparent sm:text-4xl">
              {services.length}
            </p>
          </div>

          {business?.phone && (
            <div
              className="hidden flex-col justify-center rounded-2xl p-5 shadow-[0_14px_40px_rgba(0,0,0,0.14)] sm:flex"
              style={{
                background: "rgba(9,14,32,0.86)",
                border: "1px solid rgba(99,102,241,0.12)",
              }}
            >
              <p className="mb-1 text-xs font-medium text-slate-300">טלפון</p>
              <p className="text-sm font-semibold text-slate-100" dir="ltr">
                {business.phone}
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.02 }}
          className="dashboard-dark-stat-group mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-4"
        >
          <button
            type="button"
            onClick={() => navigate("/appointment-history")}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-300/12 bg-indigo-500/8 px-4 py-3 text-xs font-bold text-indigo-200 transition hover:border-indigo-300/24 hover:bg-indigo-500/12 sm:col-span-4"
          >
            <History className="h-4 w-4" />
            פתח היסטוריית תורים
          </button>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.03 }}
          onSubmit={handleSaveProfile}
          className="mb-4 overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.16)] sm:mb-5"
          style={{
            background: "rgba(7,12,29,0.9)",
            border: "1px solid rgba(99,102,241,0.10)",
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
            style={{
              borderBottom: showProfileSettings
                ? "1px solid rgba(99,102,241,0.08)"
                : "0",
            }}
          >
            <button
              type="button"
              onClick={() => setShowProfileSettings((open) => !open)}
              className="flex min-w-0 flex-1 items-center gap-3 text-right"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-300/12 bg-indigo-500/8 text-indigo-300">
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
                className="shrink-0 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/10 transition hover:opacity-90 disabled:opacity-60"
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
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">לוגו</Label>
                  <div className="rounded-2xl border border-indigo-300/10 bg-white/[0.03] p-3 shadow-[0_16px_40px_rgba(99,102,241,0.06)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-200/16 bg-slate-950/60 shadow-[0_0_24px_rgba(99,102,241,0.10)]">
                        {businessLogoUrl ? (
                          <img
                            src={businessLogoUrl}
                            alt="לוגו העסק"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-indigo-300/60" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-100">
                          {businessLogoUrl ? "לוגו קיים" : "אין לוגו עדיין"}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          PNG, JPG או WEBP עד 5MB
                        </p>
                      </div>
                    </div>
                    <input
                      id="business-logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        handleBusinessImageUpload(
                          "logo",
                          e.currentTarget.files?.[0]
                        )
                        e.currentTarget.value = ""
                      }}
                    />
                    <label
                      htmlFor="business-logo-upload"
                      className="mt-3 flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-300/15 bg-indigo-500/8 px-3 py-2 text-xs font-bold text-indigo-200 transition-colors hover:border-indigo-300/28 hover:bg-indigo-500/12"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      {uploadingLogo
                        ? "מעלה לוגו..."
                        : businessLogoUrl
                          ? "החלף לוגו"
                          : "העלה לוגו"}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">תמונת קאבר</Label>
                  <div className="rounded-2xl border border-indigo-300/10 bg-white/[0.03] p-3 shadow-[0_16px_40px_rgba(99,102,241,0.06)]">
                    <div className="relative h-28 overflow-hidden rounded-2xl border border-indigo-200/12 bg-slate-950/60 shadow-[0_0_28px_rgba(99,102,241,0.08)]">
                      {businessCoverUrl ? (
                        <img
                          src={businessCoverUrl}
                          alt="תמונת קאבר של העסק"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.18),transparent_36%),linear-gradient(135deg,rgba(99,102,241,0.20),rgba(6,11,27,0.95))]">
                          <ImageIcon className="h-7 w-7 text-indigo-300/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-[#050816]/70 via-transparent to-transparent" />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      תמונה רחבה לדף ההזמנות, PNG/JPG/WEBP עד 5MB
                    </p>
                    <input
                      id="business-cover-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        handleBusinessImageUpload(
                          "cover",
                          e.currentTarget.files?.[0]
                        )
                        e.currentTarget.value = ""
                      }}
                    />
                    <label
                      htmlFor="business-cover-upload"
                      className="mt-3 flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-300/15 bg-indigo-500/8 px-3 py-2 text-xs font-bold text-indigo-200 transition-colors hover:border-indigo-300/28 hover:bg-indigo-500/12"
                    >
                      {uploadingCover ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      {uploadingCover
                        ? "מעלה קאבר..."
                        : businessCoverUrl
                          ? "החלף קאבר"
                          : "העלה קאבר"}
                    </label>
                  </div>
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
            border: "1px solid rgba(99,102,241,0.10)",
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
            style={{
              borderBottom: showAvailabilitySettings
                ? "1px solid rgba(99,102,241,0.08)"
                : "0",
            }}
          >
            <button
              type="button"
              onClick={() => setShowAvailabilitySettings((open) => !open)}
              className="flex min-w-0 flex-1 items-center gap-3 text-right"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-300/12 bg-indigo-500/8 text-indigo-300">
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
                className="shrink-0 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/10 transition hover:opacity-90 disabled:opacity-60"
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
              <WeeklyAvailabilityEditor
                value={weeklyAvailability}
                onChange={(value) => {
                  setWeeklyAvailability(value)
                  setAvailabilityError(null)
                  setAvailabilitySuccess(null)
                }}
              />

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

        {/* Theme section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-4 overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.16)] sm:mb-5"
          style={{
            background: "rgba(7,12,29,0.9)",
            border: "1px solid rgba(99,102,241,0.10)",
          }}
        >
          <div
            className="px-4 py-3.5 sm:px-5 sm:py-4"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}
          >
            <span className="block font-heading text-base font-bold text-slate-50">
              עיצוב מערכת
            </span>
            <span className="mt-1 block text-xs text-slate-400">
              בחר מצב תצוגה לעסק שלך
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:px-5">
            {(
              [
                {
                  key: "dark",
                  label: "מצב כהה",
                  preview: (
                    <div
                      className="mb-2.5 h-14 overflow-hidden rounded-lg"
                      style={{
                        background: "#060814",
                        border: "1px solid rgba(99,102,241,0.14)",
                      }}
                    >
                      <div className="flex items-center gap-1 px-2 pt-1.5">
                        <div className="h-1 w-1 rounded-full bg-indigo-500/60" />
                        <div className="h-0.5 flex-1 rounded-full bg-white/8" />
                      </div>
                      <div className="mt-1.5 space-y-1 px-2">
                        <div className="h-1.5 w-10 rounded-full bg-white/14" />
                        <div className="h-1 w-6 rounded-full bg-indigo-400/35" />
                      </div>
                      <div className="mt-2 flex gap-1 px-2">
                        <div
                          className="h-4 flex-1 rounded"
                          style={{
                            background: "rgba(99,102,241,0.14)",
                            border: "1px solid rgba(99,102,241,0.22)",
                          }}
                        />
                        <div
                          className="h-4 flex-1 rounded"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  key: "light",
                  label: "מצב בהיר",
                  preview: (
                    <div
                      className="mb-2.5 h-14 overflow-hidden rounded-lg"
                      style={{
                        background: "#FAF7F2",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <div className="flex items-center gap-1 px-2 pt-1.5">
                        <div className="h-1 w-1 rounded-full bg-indigo-500" />
                        <div className="h-0.5 flex-1 rounded-full bg-gray-200" />
                      </div>
                      <div className="mt-1.5 space-y-1 px-2">
                        <div className="h-1.5 w-10 rounded-full bg-gray-800/35" />
                        <div className="h-1 w-6 rounded-full bg-indigo-500/40" />
                      </div>
                      <div className="mt-2 flex gap-1 px-2">
                        <div
                          className="h-4 flex-1 rounded"
                          style={{
                            background: "#EEF2FF",
                            border: "1px solid #C7D2FE",
                          }}
                        />
                        <div
                          className="h-4 flex-1 rounded"
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                          }}
                        />
                      </div>
                    </div>
                  ),
                },
              ] as const
            ).map(({ key, label, preview }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSaveTheme(key)}
                className={`relative overflow-hidden rounded-xl border p-3 text-right transition-all duration-200 ${
                  businessTheme === key
                    ? "border-indigo-400/40 ring-2 ring-indigo-400/20"
                    : "border-white/8 hover:border-indigo-400/20"
                }`}
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                {preview}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    {label}
                  </span>
                  {businessTheme === key && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {themeSuccess && (
            <div className="px-4 pb-4 sm:px-5">
              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
                {themeSuccess}
              </p>
            </div>
          )}
        </motion.div>

        {/* Today summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="mb-4 overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.16)] sm:mb-5"
          style={{
            background: "rgba(7,12,29,0.9)",
            border: "1px solid rgba(99,102,241,0.10)",
          }}
        >
          <div
            className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
            style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}
          >
            <div>
              <h2 className="font-heading text-base font-bold text-slate-50">
                היום
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                תמונת מצב קצרה ליום העבודה
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/appointments")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300/16 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-200 transition hover:border-indigo-300/28 hover:bg-indigo-500/14"
            >
              <Calendar className="h-3.5 w-3.5" />
              פתח יומן תורים
            </button>
          </div>

          <div className="grid grid-cols-3 divide-x divide-indigo-300/10 px-2 py-4 divide-x-reverse sm:px-4">
            {[
              {
                label: "תורים היום",
                value: todaySummary.appointmentCount,
              },
              {
                label: "הכנסה בפועל",
                value: `₪${todaySummary.completedRevenue}`,
              },
              {
                label: "תורים פנויים",
                value: todaySummary.availableSlots,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="min-w-0 px-2 text-center sm:px-4"
              >
                <p className="bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text font-heading text-2xl leading-none font-bold text-transparent sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 truncate text-[11px] font-semibold text-slate-400 sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.07 }}
          >
            <div
              className="dashboard-dark-section overflow-hidden rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
              style={{
                background: "rgba(7,12,29,0.9)",
                border: "1px solid rgba(99,102,241,0.10)",
              }}
            >
              <div
                className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}
              >
                <h2 className="font-heading text-base font-bold text-slate-50">
                  שירותים
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddService(!showAddService)}
                  className="shrink-0 gap-1.5 text-xs font-medium text-slate-300 hover:text-indigo-300"
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
                    borderBottom: "1px solid rgba(99,102,241,0.08)",
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
                        className="h-8 text-base sm:text-sm"
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
                        className="h-8 text-base sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">מחיר ₪</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        min={1}
                        required
                        dir="ltr"
                        className="h-8 text-base sm:text-sm"
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
                      className="h-7 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 px-3 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {addingService ? "שומר..." : "שמור"}
                    </button>
                  </div>
                </motion.form>
              )}

              <div
                className="divide-y"
                style={{ borderColor: "rgba(99,102,241,0.08)" }}
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
                            <span className="font-semibold text-indigo-300">
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

          {/* Full calendar link */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="dashboard-dark-section rounded-2xl px-4 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.14)] sm:px-5"
            style={{
              background: "rgba(7,12,29,0.9)",
              border: "1px solid rgba(99,102,241,0.12)",
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-indigo-300">יומן מלא</p>
                <h2 className="mt-1 font-heading text-base font-bold text-slate-50">
                  פתח תצוגת לוח לימים הקרובים
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  הדשבורד מציג הצצה יומית. ניהול מלא נמצא ביומן התורים.
                </p>
              </div>
              <button
                onClick={() => navigate("/appointments")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:brightness-110"
              >
                <Calendar className="h-4 w-4" />
                פתח יומן תורים
              </button>
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
            border: "1px solid rgba(99,102,241,0.20)",
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
                className="max-w-[220px] truncate font-mono text-sm font-semibold text-indigo-300 sm:max-w-sm"
              >
                {bookingDisplayUrl}
              </p>
            </div>
            <a href={bookingUrl} target="_blank" rel="noreferrer">
              <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/12 transition hover:opacity-90 sm:w-auto">
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
