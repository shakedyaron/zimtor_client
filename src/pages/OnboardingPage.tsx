import { useEffect, useState } from "react"
import type { ChangeEvent, ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Palette,
  UploadCloud,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import {
  deleteStorageFile,
  uploadBusinessCover,
  uploadBusinessLogo,
} from "@/lib/storage"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OnboardingStep = 1 | 2 | 3 | 4 | 5
type BusinessTheme = "dark" | "light"

const DEFAULT_OPENING_TIME = "09:00"
const DEFAULT_CLOSING_TIME = "18:00"
const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4]
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const totalMinutes = index * 15
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
})

const RESERVED_SLUGS = new Set([
  "auth",
  "dashboard",
  "create-business",
  "onboarding",
  "appointments",
  "appointment-history",
  "manage",
  "admin",
  "api",
  "login",
  "register",
  "signup",
  "sign-up",
  "signin",
  "sign-in",
])

const weekDays = [
  { value: 0, label: "ראשון" },
  { value: 1, label: "שני" },
  { value: 2, label: "שלישי" },
  { value: 3, label: "רביעי" },
  { value: 4, label: "חמישי" },
  { value: 5, label: "שישי" },
  { value: 6, label: "שבת" },
]

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [checkingBusiness, setCheckingBusiness] = useState(true)
  const [step, setStep] = useState<OnboardingStep>(1)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [businessName, setBusinessName] = useState("")
  const [slug, setSlug] = useState("")
  const [phone, setPhone] = useState("")
  const [description, setDescription] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [instagram, setInstagram] = useState("")
  const [address, setAddress] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [openingTime, setOpeningTime] = useState(DEFAULT_OPENING_TIME)
  const [closingTime, setClosingTime] = useState(DEFAULT_CLOSING_TIME)
  const [workingDays, setWorkingDays] = useState<number[]>(DEFAULT_WORKING_DAYS)
  const [serviceName, setServiceName] = useState("")
  const [serviceDuration, setServiceDuration] = useState("30")
  const [servicePrice, setServicePrice] = useState("")
  const [skipFirstService, setSkipFirstService] = useState(false)
  const [businessTheme, setBusinessTheme] = useState<BusinessTheme>("dark")

  useEffect(() => {
    let cancelled = false

    async function checkBusiness() {
      if (!user) return
      setCheckingBusiness(true)

      const { data, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle()

      if (cancelled) return

      if (businessError) {
        setError("שגיאה בבדיקת העסק שלך. נסה לרענן את הדף.")
        setCheckingBusiness(false)
        return
      }

      if (data) {
        navigate("/dashboard", { replace: true })
        return
      }

      setCheckingBusiness(false)
    }

    checkBusiness()

    return () => {
      cancelled = true
    }
  }, [user, navigate])

  function handleNameChange(value: string) {
    setBusinessName(value)
    setSlug(toSlug(value))
    setError(null)
  }

  function toggleWorkingDay(day: number) {
    setError(null)
    setWorkingDays((prev) =>
      prev.includes(day)
        ? prev.filter((currentDay) => currentDay !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  async function validateBasicDetails() {
    const trimmedName = businessName.trim()
    const trimmedSlug = slug.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) return "יש להזין שם עסק."
    if (!trimmedSlug) return "יש להזין קישור לעסק."
    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      return "ניתן להשתמש רק באותיות באנגלית, מספרים ומקפים (-)"
    }
    if (RESERVED_SLUGS.has(trimmedSlug)) {
      return "מזהה זה שמור ואינו זמין. בחר מזהה אחר."
    }
    if (!trimmedPhone) return "יש להזין מספר טלפון."

    const { data, error: slugError } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", trimmedSlug)
      .maybeSingle()

    if (slugError) return "שגיאה בבדיקת זמינות הקישור. נסה שוב."
    if (data) return "מזהה העסק כבר תפוס. בחר מזהה אחר."

    return null
  }

  function validateAvailability() {
    if (!openingTime) return "יש לבחור שעת פתיחה."
    if (!closingTime) return "יש לבחור שעת סגירה."
    if (openingTime >= closingTime) {
      return "שעת הסגירה חייבת להיות אחרי שעת הפתיחה."
    }
    if (workingDays.length === 0) return "יש לבחור לפחות יום עבודה אחד."
    return null
  }

  function validateService(allowEmpty: boolean) {
    const trimmedName = serviceName.trim()
    const duration = Number(serviceDuration)
    const trimmedPrice = servicePrice.trim()
    const price = Number(trimmedPrice)

    if (!trimmedName && allowEmpty) return null
    if (!trimmedName) return "שם השירות חובה"
    if (!Number.isFinite(duration) || duration <= 0) {
      return "משך השירות חייב להיות גדול מ-0"
    }
    if (!trimmedPrice) return "מחיר השירות חובה"
    if (!Number.isFinite(price) || price <= 0) {
      return "מחיר השירות חייב להיות גדול מ-0"
    }
    return null
  }

  async function handleNext() {
    setError(null)

    if (step === 1) {
      const validationError = await validateBasicDetails()
      if (validationError) {
        setError(validationError)
        return
      }
    }

    if (step === 3) {
      const validationError = validateAvailability()
      if (validationError) {
        setError(validationError)
        return
      }
    }

    if (step === 4) {
      const validationError = validateService(false)
      if (validationError) {
        setError(validationError)
        return
      }
      setSkipFirstService(false)
    }

    setStep((current) => Math.min(current + 1, 5) as OnboardingStep)
  }

  function handleBack() {
    setError(null)
    setStep((current) => Math.max(current - 1, 1) as OnboardingStep)
  }

  async function handleImageUpload(
    imageType: "logo" | "cover",
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !user) return

    const isLogo = imageType === "logo"
    const oldImageUrl = isLogo ? logoUrl : coverUrl

    setError(null)
    if (isLogo) setUploadingLogo(true)
    else setUploadingCover(true)

    try {
      const uploaded = isLogo
        ? await uploadBusinessLogo(user.id, file)
        : await uploadBusinessCover(user.id, file)

      if (isLogo) setLogoUrl(uploaded.publicUrl)
      else setCoverUrl(uploaded.publicUrl)

      await deleteStorageFile(
        isLogo ? "business-logos" : "business-covers",
        oldImageUrl
      )
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "שגיאה בהעלאת התמונה. נסה שוב."
      )
    } finally {
      if (isLogo) setUploadingLogo(false)
      else setUploadingCover(false)
    }
  }

  async function finishOnboarding(skipService = false) {
    if (!user) return
    setError(null)

    const basicError = await validateBasicDetails()
    if (basicError) {
      setStep(1)
      setError(basicError)
      return
    }

    const availabilityError = validateAvailability()
    if (availabilityError) {
      setStep(3)
      setError(availabilityError)
      return
    }

    const serviceError = validateService(skipService)
    if (serviceError) {
      setStep(4)
      setError(serviceError)
      return
    }

    setSubmitting(true)

    const businessPayload = {
      owner_id: user.id,
      name: businessName.trim(),
      slug: slug.trim(),
      phone: phone.trim(),
      description: description.trim() || null,
      whatsapp_url: whatsapp.trim() || null,
      instagram_url: instagram.trim() || null,
      address: address.trim() || null,
      logo_url: logoUrl.trim() || null,
      cover_image_url: coverUrl.trim() || null,
      opening_time: openingTime,
      closing_time: closingTime,
      working_days: workingDays,
      business_theme: businessTheme,
    }

    const { data: existingBusiness, error: existingError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()

    if (existingError) {
      setError("שגיאה בבדיקת העסק שלך. נסה שוב.")
      setSubmitting(false)
      return
    }

    const businessMutation = existingBusiness
      ? supabase
          .from("businesses")
          .update(businessPayload)
          .eq("id", existingBusiness.id)
          .select("id")
          .single()
      : supabase
          .from("businesses")
          .insert(businessPayload)
          .select("id")
          .single()

    const { data: savedBusiness, error: businessError } = await businessMutation

    if (businessError) {
      if (businessError.code === "23505") {
        setStep(1)
        setError("מזהה העסק כבר תפוס. בחר מזהה אחר.")
      } else {
        setError("שגיאה בשמירת העסק. נסה שוב.")
      }
      setSubmitting(false)
      return
    }

    const trimmedServiceName = serviceName.trim()
    if (!skipService && trimmedServiceName) {
      const price = Number(servicePrice.trim())
      const { error: serviceError } = await supabase.from("services").insert({
        business_id: savedBusiness.id,
        name: trimmedServiceName,
        duration_minutes: Number(serviceDuration),
        price,
      })

      if (serviceError) {
        setError(
          "העסק נשמר, אבל הייתה שגיאה בשמירת השירות. אפשר להוסיף אותו מהדשבורד."
        )
        setSubmitting(false)
        navigate("/dashboard", { replace: true })
        return
      }
    }

    navigate("/dashboard", { replace: true })
  }

  if (checkingBusiness) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="relative min-h-dvh overflow-hidden bg-background px-4 py-6 text-slate-100 sm:py-10"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -right-48 h-96 w-96 rounded-full"
          style={{
            filter: "blur(120px)",
            opacity: 0.14,
            background: "radial-gradient(circle, #6366f1, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-44 -left-44 h-96 w-96 rounded-full"
          style={{
            filter: "blur(120px)",
            opacity: 0.1,
            background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
          }}
        />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <span className="bg-linear-to-r from-white to-slate-300 bg-clip-text font-heading text-3xl font-extrabold text-transparent">
              zimtor
            </span>
            <h1 className="mt-2 font-heading text-2xl font-bold text-white">
              הקמת העסק שלך
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              כמה צעדים קצרים, ואז דף ההזמנות שלך מוכן לעבודה.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-indigo-300/12 bg-indigo-500/10 px-3 py-2 text-center">
            <p className="font-heading text-lg font-bold text-indigo-200">
              {step}/5
            </p>
            <p className="text-[11px] font-semibold text-slate-400">התקדמות</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className={`h-1.5 rounded-full transition-colors ${
                item <= step ? "bg-indigo-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <motion.section
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="overflow-hidden rounded-[28px] border border-indigo-200/10 bg-[rgba(7,12,29,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.35),0_0_50px_rgba(99,102,241,0.06)]"
        >
          <div className="border-b border-indigo-200/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-bold text-indigo-300">
              שלב {step} מתוך 5
            </p>
            <h2 className="mt-1 font-heading text-xl font-bold text-white">
              {stepTitle(step)}
            </h2>
          </div>

          <div className="px-5 py-5 sm:px-6">{renderStep()}</div>

          <div className="flex flex-col-reverse gap-3 border-t border-indigo-200/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-indigo-300/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" />
              חזרה
            </button>

            <div className="flex flex-col gap-2 sm:flex-row">
              {step === 4 && (
                <button
                  type="button"
                  onClick={() => {
                    setSkipFirstService(true)
                    setStep(5)
                    setError(null)
                  }}
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
                >
                  דלג כרגע
                </button>
              )}
              {step === 5 ? (
                <button
                  type="button"
                  onClick={() =>
                    finishOnboarding(skipFirstService || !serviceName.trim())
                  }
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {submitting ? "שומר..." : "סיים"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting || uploadingLogo || uploadingCover}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 transition hover:opacity-90 disabled:opacity-60"
                >
                  {step === 4 ? "הוסף שירות והמשך" : "המשך"}
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  )

  function renderStep() {
    return (
      <div className="space-y-5">
        {step === 1 && (
          <div className="grid gap-4">
            <Field label="שם העסק">
              <Input
                value={businessName}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="למשל: מספרת דוד"
                className="text-base"
              />
            </Field>
            <Field label="כתובת ההזמנות של העסק (אנגלית בלבד)">
              <div className="rounded-2xl border border-indigo-300/12 bg-indigo-500/8 px-4 py-3">
                <p className="text-xs font-medium text-slate-400">
                  כתובת ההזמנות של העסק שלך:
                </p>
                <p className="mt-1 truncate font-heading text-base font-bold text-indigo-200">
                  zimtor.co/
                  <span dir="ltr" className="inline-block">
                    {slug.trim() || "david-barber"}
                  </span>
                </p>
              </div>
              <Input
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value)
                  setError(null)
                }}
                placeholder="david-barber"
                dir="ltr"
                className="text-base"
              />
              <p className="text-xs leading-5 text-slate-500">
                אותיות באנגלית, מספרים ומקפים בלבד
                <span className="mx-1 text-slate-600">·</span>
                Example:{" "}
                <span dir="ltr" className="font-medium text-slate-400">
                  david-barber
                </span>
              </p>
            </Field>
            <Field label="טלפון">
              <Input
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  setError(null)
                }}
                placeholder="050-0000000"
                dir="ltr"
                className="text-base"
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="תיאור העסק">
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="משפט קצר שיופיע בדף ההזמנות"
                className="text-base"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="WhatsApp URL או טלפון">
                <Input
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  placeholder="https://wa.me/972..."
                  dir="ltr"
                  className="text-base"
                />
              </Field>
              <Field label="Instagram URL">
                <Input
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value)}
                  placeholder="https://instagram.com/..."
                  dir="ltr"
                  className="text-base"
                />
              </Field>
            </div>
            <Field label="כתובת">
              <Input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="רחוב, עיר"
                className="text-base"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploadCard
                title="לוגו"
                subtitle="מופיע בראש דף ההזמנות"
                imageUrl={logoUrl}
                uploading={uploadingLogo}
                onChange={(event) => handleImageUpload("logo", event)}
                compact
              />
              <ImageUploadCard
                title="תמונת קאבר"
                subtitle="רקע עליון בדף ההזמנות"
                imageUrl={coverUrl}
                uploading={uploadingCover}
                onChange={(event) => handleImageUpload("cover", event)}
              />
            </div>
            <p className="text-xs leading-5 text-slate-500">
              אפשר לדלג על תמונות עכשיו ולהוסיף אותן מהדשבורד בהמשך.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <Field label="שעת פתיחה">
                <TimeSelect value={openingTime} onChange={setOpeningTime} />
              </Field>
              <Field label="שעת סגירה">
                <TimeSelect value={closingTime} onChange={setClosingTime} />
              </Field>
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
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? "border-indigo-300/30 bg-indigo-500/12 text-indigo-200"
                          : "border-white/8 bg-white/4 text-slate-400 hover:border-indigo-300/15 hover:text-slate-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4">
            <Field label="שם שירות ראשון">
              <Input
                value={serviceName}
                onChange={(event) => {
                  setServiceName(event.target.value)
                  setSkipFirstService(false)
                  setError(null)
                }}
                placeholder="תספורת גברים"
                className="text-base"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="משך בדקות">
                <Input
                  type="number"
                  min={5}
                  value={serviceDuration}
                  onChange={(event) => {
                    setServiceDuration(event.target.value)
                    setSkipFirstService(false)
                    setError(null)
                  }}
                  placeholder="30"
                  dir="ltr"
                  className="text-base"
                />
              </Field>
              <Field label="מחיר ₪">
                <Input
                  type="number"
                  min={1}
                  value={servicePrice}
                  onChange={(event) => {
                    setServicePrice(event.target.value)
                    setSkipFirstService(false)
                    setError(null)
                  }}
                  placeholder="50"
                  dir="ltr"
                  required
                  className="text-base"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <ThemeOption
                theme="dark"
                active={businessTheme === "dark"}
                onClick={() => setBusinessTheme("dark")}
              />
              <ThemeOption
                theme="light"
                active={businessTheme === "light"}
                onClick={() => setBusinessTheme("light")}
              />
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <p className="text-xs font-bold text-indigo-300">סיכום</p>
              <p className="mt-1 text-sm text-slate-300">
                {businessName || "העסק שלך"} ייפתח עם שעות פעילות{" "}
                <span dir="ltr">
                  {openingTime}-{closingTime}
                </span>
                , {workingDays.length} ימי עבודה
                {!skipFirstService && serviceName.trim()
                  ? ` ושירות ראשון: ${serviceName.trim()}`
                  : "."}
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    )
  }
}

function stepTitle(step: OnboardingStep) {
  if (step === 1) return "פרטי העסק הבסיסיים"
  if (step === 2) return "פרופיל ציבורי"
  if (step === 3) return "זמינות ושעות פעילות"
  if (step === 4) return "שירות ראשון"
  return "בחירת עיצוב"
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-400">{label}</Label>
      {children}
    </div>
  )
}

function TimeSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base text-slate-100 shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
      dir="ltr"
    >
      {TIME_OPTIONS.map((time) => (
        <option key={time} value={time} className="bg-slate-950">
          {time}
        </option>
      ))}
    </select>
  )
}

function ImageUploadCard({
  title,
  subtitle,
  imageUrl,
  uploading,
  onChange,
  compact = false,
}: {
  title: string
  subtitle: string
  imageUrl: string
  uploading: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  compact?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04]">
      <div
        className={`flex items-center justify-center bg-white/[0.035] ${
          compact ? "h-32" : "h-40"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className={`h-full w-full object-cover ${compact ? "max-w-32 rounded-2xl" : ""}`}
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-slate-600" />
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-sm font-bold text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-300/16 bg-indigo-500/10 px-3 py-2.5 text-xs font-bold text-indigo-200 transition hover:bg-indigo-500/16">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : compact ? (
            <Camera className="h-4 w-4" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          {uploading ? "מעלה..." : imageUrl ? "החלף תמונה" : "העלה תמונה"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onChange}
          />
        </label>
      </div>
    </div>
  )
}

function ThemeOption({
  theme,
  active,
  onClick,
}: {
  theme: BusinessTheme
  active: boolean
  onClick: () => void
}) {
  const isDark = theme === "dark"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-4 text-right transition-all ${
        active
          ? "border-indigo-300/45 ring-2 ring-indigo-400/20"
          : "border-white/8 hover:border-indigo-300/20"
      }`}
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <div
        className="mb-3 h-24 overflow-hidden rounded-xl"
        style={{
          background: isDark ? "#060814" : "#FAF7F2",
          border: isDark
            ? "1px solid rgba(99,102,241,0.14)"
            : "1px solid #E5E7EB",
        }}
      >
        <div className="flex items-center gap-1 px-3 pt-3">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          <div
            className={`h-1 flex-1 rounded-full ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`}
          />
        </div>
        <div className="mt-4 space-y-2 px-3">
          <div
            className={`h-2 w-20 rounded-full ${
              isDark ? "bg-white/20" : "bg-gray-900/35"
            }`}
          />
          <div className="h-1.5 w-12 rounded-full bg-indigo-500/45" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 px-3">
          <div
            className="h-8 rounded-lg"
            style={{
              background: isDark ? "rgba(99,102,241,0.14)" : "#EEF2FF",
              border: isDark
                ? "1px solid rgba(99,102,241,0.22)"
                : "1px solid #C7D2FE",
            }}
          />
          <div
            className="h-8 rounded-lg"
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
              border: isDark
                ? "1px solid rgba(255,255,255,0.07)"
                : "1px solid #E5E7EB",
            }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-100">
          <Palette className="h-4 w-4 text-indigo-300" />
          {isDark ? "מצב כהה" : "מצב בהיר"}
        </span>
        {active && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
            <Check className="h-3 w-3 text-white" />
          </span>
        )}
      </div>
    </button>
  )
}
