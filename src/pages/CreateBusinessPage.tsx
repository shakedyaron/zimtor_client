import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const RESERVED_SLUGS = new Set([
  "auth",
  "dashboard",
  "create-business",
  "admin",
  "api",
  "login",
  "register",
  "signup",
  "sign-up",
  "signin",
  "sign-in",
])

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\wא-ת-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CreateBusinessPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkingBusiness, setCheckingBusiness] = useState(true)
  const bookingDisplayOrigin = new URL(window.location.origin).host

  useEffect(() => {
    if (!user) return
    supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) navigate("/dashboard")
        else setCheckingBusiness(false)
      })
  }, [user, navigate])

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(toSlug(val))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedSlug = slug.trim()
    if (!trimmedSlug) {
      setError("מזהה עסק לא תקין")
      return
    }
    if (RESERVED_SLUGS.has(trimmedSlug)) {
      setError("מזהה זה שמור ואינו זמין. בחר מזהה אחר.")
      return
    }
    setSubmitting(true)

    const { error } = await supabase.from("businesses").insert({
      owner_id: user!.id,
      name: name.trim(),
      slug: slug.trim(),
      phone: phone.trim() || null,
    })

    if (error) {
      if (error.code === "23505") setError("מזהה העסק כבר תפוס. בחר מזהה אחר.")
      else setError("שגיאה ביצירת העסק. נסה שוב.")
      setSubmitting(false)
    } else {
      navigate("/dashboard")
    }
  }

  if (checkingBusiness) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -right-48 h-96 w-96 rounded-full"
          style={{
            filter: "blur(120px)",
            opacity: 0.13,
            background: "radial-gradient(circle, #3b82f6, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full"
          style={{
            filter: "blur(100px)",
            opacity: 0.08,
            background: "radial-gradient(circle, #06b6d4, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.011) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.011) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(5,8,22,0.8) 80%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-right">
          <span className="bg-linear-to-r from-white to-slate-300 bg-clip-text font-heading text-3xl font-extrabold text-transparent">
            zimtor
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold text-white">
            צור את העסק שלך
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            עוד כמה פרטים ויש לך דף הזמנות פרטי
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(24px)",
            boxShadow:
              "0 0 40px rgba(59,130,246,0.10), 0 24px 48px rgba(0,0,0,0.35)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400">
                שם העסק
              </Label>
              <Input
                placeholder="למשל: ספרות דוד"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400">
                קישור לעסק{" "}
                <span className="font-normal text-slate-600">
                  ({bookingDisplayOrigin}/
                  <span dir="ltr" className="inline">
                    {slug || "your-business"}
                  </span>
                  )
                </span>
              </Label>
              <Input
                placeholder="my-business"
                value={slug}
                onChange={(e) => setSlug(toSlug(e.target.value))}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400">
                טלפון{" "}
                <span className="font-normal text-slate-600">(אופציונלי)</span>
              </Label>
              <Input
                type="tel"
                placeholder="050-0000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "יוצר עסק..." : "צור עסק והמשך"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
