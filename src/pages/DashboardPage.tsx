import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Plus, Trash2, LogOut, ExternalLink, Clock, Phone } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import type { Business, Service, Appointment } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

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
  return new Date(dateStr).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5)
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
    setAddingService(true)
    setAddServiceError(null)

    const { error } = await supabase.from("services").insert({
      business_id: business.id,
      name: newServiceName.trim(),
      duration_minutes: parseInt(newServiceDuration),
      price: newServicePrice ? parseInt(newServicePrice) : null,
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

  const upcomingAppointments = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      new Date(`${a.appointment_date}T${a.appointment_time}`) >=
        new Date(new Date().setHours(0, 0, 0, 0))
  )

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
                        required
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
                        required
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
                className="divide-y"
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
