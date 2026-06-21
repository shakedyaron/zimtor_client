import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) navigate("/dashboard")
  }, [user, loading, navigate])

  function switchMode(next: "login" | "signup") {
    setMode(next)
    setError(null)
    setSuccessMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email.trim()) {
      setError("יש להזין כתובת מייל.")
      return
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים.")
      return
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות.")
      return
    }

    setSubmitting(true)

    if (mode === "login") {
      const { user: signedInUser, error: loginError } = await signIn(email, password)
      if (loginError) {
        if (loginError.message.includes("Email not confirmed")) {
          setError("יש לאמת את כתובת המייל לפני הכניסה. בדוק את תיבת הדואר שלך.")
        } else if (loginError.message.includes("Invalid login credentials")) {
          setError("אימייל או סיסמה שגויים. נסה שוב.")
        } else {
          setError("שגיאה בכניסה. נסה שוב.")
        }
      } else if (signedInUser) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", signedInUser.id)
          .maybeSingle()
        navigate(biz ? "/dashboard" : "/onboarding", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    } else {
      const { error: signupError } = await signUp(email, password)
      if (signupError) {
        if (
          signupError.message.includes("already registered") ||
          signupError.message.includes("already been registered")
        ) {
          setError("כתובת מייל זו כבר רשומה. נסה להתחבר.")
        } else if (signupError.message.includes("Password should be at least")) {
          setError("הסיסמה חייבת להכיל לפחות 6 תווים.")
        } else {
          setError("שגיאה בהרשמה. נסה שוב.")
        }
      } else {
        setSuccessMsg("נרשמת בהצלחה! בדוק את המייל שלך לאימות החשבון.")
        setMode("login")
        setPassword("")
        setConfirmPassword("")
      }
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

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12"
    >
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-48 -top-48 h-96 w-96 rounded-full"
          style={{
            filter: "blur(140px)",
            opacity: 0.10,
            background: "radial-gradient(circle, #6366f1, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full"
          style={{
            filter: "blur(120px)",
            opacity: 0.06,
            background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
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
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/">
            <span className="font-heading bg-linear-to-r from-white to-slate-300 bg-clip-text text-3xl font-extrabold text-transparent">
              zimtor
            </span>
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login" ? "כניסה לבעל עסק" : "הרשמה לבעל עסק"}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 40px rgba(99,102,241,0.07), 0 24px 48px rgba(0,0,0,0.38)",
          }}
        >
          {/* Mode tabs */}
          <div
            className="mb-6 flex overflow-hidden rounded-xl"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-2.5 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-indigo-500/20 text-indigo-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              כניסה
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 text-sm font-bold transition ${
                mode === "signup"
                  ? "bg-indigo-500/20 text-indigo-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              הרשמה
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400">אימייל</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-400">סיסמה</Label>
              <Input
                type="password"
                placeholder="לפחות 6 תווים"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                dir="ltr"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400">
                  אימות סיסמה
                </Label>
                <Input
                  type="password"
                  placeholder="הזן שוב את הסיסמה"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
                >
                  {error}
                </motion.p>
              )}
              {successMsg && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400"
                >
                  {successMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 transition hover:opacity-90 hover:shadow-indigo-500/28 disabled:opacity-60"
            >
              {submitting
                ? "טוען..."
                : mode === "login"
                  ? "כניסה לחשבון"
                  : "יצירת חשבון"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          {mode === "login" ? (
            <>
              אין לך חשבון?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                הרשמה בחינם
              </button>
            </>
          ) : (
            <>
              כבר יש לך חשבון?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                כניסה
              </button>
            </>
          )}
        </p>
        <p className="mt-2 text-center text-xs text-slate-600">
          <Link to="/" className="transition hover:text-slate-400">
            חזרה לעמוד הבית
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
