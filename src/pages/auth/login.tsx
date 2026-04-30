import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth"
import { Role } from "@/types/auth"

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  // The login page no longer exposes a role selector — role comes from the backend.

  const handleSignIn = () => {
    // UI-only behavior: infer role from email for mock users
    const role = email.trim().toLowerCase() === "admin@courses.dev" ? Role.admin : Role.user
    signIn(role)
    navigate(role === Role.admin ? "/admin" : "/user", { replace: true })
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
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 p-3 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <img src="/favicon.ico" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400/80">Nexus Learning</p>
            <h1 className="text-3xl font-bold tracking-tight text-white/90">Welcome Back</h1>
            <p className="text-xs font-medium text-white/40">Enter your credentials to access your workspace.</p>
          </div>
        </div>

        <Card className="border-slate-700/50 bg-slate-950/80 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-lg font-semibold tracking-tight text-white/90">Sign In</CardTitle>
            <CardDescription className="text-xs text-white/40">Enter your details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-8">
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
                  placeholder="name@example.com"
                  className="h-10 w-full rounded-xl border border-slate-700/70 bg-slate-900/80 pl-11 text-sm text-white/90 ring-0 transition-all placeholder:text-slate-500 focus:border-indigo-400/70 focus:bg-slate-900/95"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-white/60">Password</Label>
                <button className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative group/input">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400/70 transition-colors group-focus-within/input:text-indigo-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-xl border border-slate-700/70 bg-slate-900/80 pl-11 pr-11 text-sm text-white/90 ring-0 transition-all placeholder:text-slate-500 focus:border-indigo-400/70 focus:bg-slate-900/95"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400/70 hover:text-indigo-400 transition-colors"
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
              />
              <Label htmlFor="remember" className="cursor-pointer text-[11px] font-medium text-white/50">
                Keep me signed in
              </Label>
            </div>

            {/* role selection moved to admin-only sidebar (impersonation UI) */}
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-2">
            <Button
              className="h-12 w-full rounded-2xl bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 font-semibold text-white shadow-[0_18px_50px_-18px_rgba(99,102,241,0.8)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_22px_60px_-20px_rgba(99,102,241,0.9)]"
              onClick={handleSignIn}
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-[10px] text-white/30">
          Nexus Learning Systems &copy; 2026. All rights reserved.
        </p>
      </div>
    </div>
  )
}
