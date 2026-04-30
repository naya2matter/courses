import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"
import { type AuthUser, Role } from "@/types/auth"

/* ── Mock users for UI-only development ─────────────────────────────────── */

const MOCK_ADMIN: AuthUser = {
  id: "1",
  name: "Admin User",
  email: "admin@courses.dev",
  avatar: "",
  role: Role.admin,
}

const MOCK_USER: AuthUser = {
  id: "2",
  name: "Alex Johnson",
  email: "alex@courses.dev",
  avatar: "",
  role: Role.user,
}

/* ── Context definition ──────────────────────────────────────────────────── */

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isImpersonating: boolean
  /** UI-only: normal sign in (replace with real API auth) */
  signIn: (role: Role) => void
  signOut: () => void
  /** UI-only: start impersonating another role (admin-only) */
  impersonateAs: (role: Role) => void
  /** UI-only: revert to original user after impersonation */
  revertImpersonation: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/* ── Provider ────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [originalUser, setOriginalUser] = useState<AuthUser | null>(null)

  const signIn = (role: Role) => {
    // Replace the mock lookup with a real API user object when connecting to the API
    setOriginalUser(null)
    setUser(role === Role.admin ? MOCK_ADMIN : MOCK_USER)
  }

  const signOut = () => {
    setOriginalUser(null)
    setUser(null)
  }

  const impersonateAs = (role: Role) => {
    if (!user) return
    if (user.role === role) return
    setOriginalUser(user)
    setUser(role === Role.admin ? MOCK_ADMIN : MOCK_USER)
  }

  const revertImpersonation = () => {
    if (!originalUser) return
    setUser(originalUser)
    setOriginalUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isImpersonating: !!originalUser,
        signIn,
        signOut,
        impersonateAs,
        revertImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/* ── Hook ────────────────────────────────────────────────────────────────── */

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
