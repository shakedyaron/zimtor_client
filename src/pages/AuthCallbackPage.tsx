import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      try {
        const queryParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        )
        const code = queryParams.get("code")
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        let session: Session | null = null

        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          session = data.session
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
          session = data.session
        }

        if (!session) {
          const {
            data: { session: currentSession },
            error,
          } = await supabase.auth.getSession()
          if (error) throw error
          session = currentSession
        }

        window.history.replaceState({}, document.title, "/auth/callback")

        if (!session?.user) {
          navigate("/auth", { replace: true })
          return
        }

        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", session.user.id)
          .maybeSingle()

        if (businessError) throw businessError
        if (cancelled) return

        navigate(business ? "/dashboard" : "/create-business", {
          replace: true,
        })
      } catch (err) {
        console.error("Auth callback failed", err)
        window.history.replaceState({}, document.title, "/auth/callback")
        if (!cancelled) {
          setError("שגיאה באימות החשבון. נסה להתחבר שוב.")
          setTimeout(() => navigate("/auth", { replace: true }), 1600)
        }
      }
    }

    handleCallback()

    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-background px-4 text-center"
    >
      <div>
        <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-slate-300">
          {error ?? "מאמת את החשבון..."}
        </p>
      </div>
    </div>
  )
}
