import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth"
import { Role } from "@/types/auth"
import { isApiError } from "@/lib/api"

export function LoginPage() {
  const { signIn, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    navigate(user.role === Role.admin ? "/admin" : "/user", { replace: true })
  }, [isAuthenticated, user, navigate])

  const handleSignIn = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const role = await signIn(email.trim(), password)
      navigate(role === Role.admin ? "/admin" : "/user", { replace: true })
    } catch (err) {
      if (isApiError(err) && err.status === 422) {
        // Validation errors — surface the first message
        const messages: string[] = err.data?.errors
          ? Object.values<string[]>(err.data.errors).flat()
          : [err.message]
        setError(messages[0] ?? "Invalid credentials.")
      } else if (isApiError(err) && err.status === 401) {
        setError("Invalid email or password.")
      } else {
        setError("Unable to connect. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignIn()
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center overflow-hidden px-4 text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-[10%] h-100 w-100 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] h-100 w-100 rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-100">
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 p-4 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <img src="/favicon.ico" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-white/90">Welcome Back</h1>
            <p className="text-xs font-medium text-white/40">Enter your credentials to access your workspace.</p>
          </div>
        </div>
{/* login card */}
        <Card className="border-slate-700/50 bg-slate-950/80 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-none hover:!bg-slate-950/80 hover:!scale-100 hover:!shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-lg font-semibold tracking-tight text-white/90">Sign In</CardTitle>
            <CardDescription className="text-xs text-white/40">Enter your details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-8">
            {/* Error banner */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-white/60">Email address</Label>
              <div className="relative group/input">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/70 transition-colors group-focus-within/input:text-indigo-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className="h-10 w-full rounded-xl border border-slate-700/70 bg-slate-900/80 pl-11 text-sm text-white/90 ring-0 transition-all placeholder:text-slate-500 focus:border-indigo-400/70 focus:bg-slate-900/95"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-white/60">Password</Label>
              </div>
              <div className="relative group/input">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/70 transition-colors group-focus-within/input:text-indigo-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="h-10 w-full rounded-xl border border-slate-700/70 bg-slate-900/80 pl-11 pr-11 text-sm text-white/90 ring-0 transition-all placeholder:text-slate-500 focus:border-indigo-400/70 focus:bg-slate-900/95"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400/70"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(Boolean(checked))}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="cursor-pointer text-[11px] font-medium text-white/50">
                Keep me signed in
              </Label>
            </div>
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-2">
            <Button
              className="h-12 w-full rounded-2xl bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 font-semibold text-white shadow-[0_18px_50px_-18px_rgba(99,102,241,0.8)] duration-300"
              onClick={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
