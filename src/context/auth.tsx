import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { type AuthUser, Role } from "@/types/auth"
import { apiClient, USER_ROLE_KEY } from "@/lib/api"
import { authService } from "@/services/auth.service"

/* ── Context definition ──────────────────────────────────────────────────── */

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isImpersonating: boolean
  isBootstrapping: boolean
  /** Sign in with email + password. Resolves with the authenticated user's role. Throws on invalid credentials. */
  signIn: (email: string, password: string) => Promise<Role>
  /** Sign out and invalidate the Sanctum token server-side. */
  signOut: () => Promise<void>
  /** Temporarily switch to another role's view (admin-only feature). */
  impersonateAs: (role: Role) => void
  /** Revert back to the original user after impersonation. */
  revertImpersonation: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function resourceToAuthUser(resource: {
  id: number
  name: string
  email: string
  role: Role
  avatar?: string
}): AuthUser {
  return {
    id: String(resource.id),
    name: resource.name,
    email: resource.email,
    avatar: resource.avatar ?? "",
    role: resource.role,
  }
}

/* ── Provider ────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [originalUser, setOriginalUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  // Hydrate session from a persisted token on first render.
  useEffect(() => {
    const controller = new AbortController()

    const token = apiClient.getToken()
    const storedRole = localStorage.getItem(USER_ROLE_KEY) as Role | null

    if (!token || !storedRole) {
      setIsBootstrapping(false)
      return
    }

    authService
      .getMe(storedRole, controller.signal)
      .then((resource) => setUser(resourceToAuthUser(resource)))
      .catch((err: Error) => {
        if (err.name === "AbortError") return
        // Token is invalid or expired — clear storage
        apiClient.clearToken()
      })
      .finally(() => {
        // Skip state update if this effect was cleaned up (StrictMode unmount)
        if (!controller.signal.aborted) setIsBootstrapping(false)
      })

    return () => controller.abort()
  }, [])

  const signIn = async (email: string, password: string): Promise<Role> => {
    // authService.login already unwraps Laravel's `data` envelope
    const { token, user: resource } = await authService.login({ email, password })

    apiClient.setToken(token)
    localStorage.setItem(USER_ROLE_KEY, resource.role)

    setOriginalUser(null)
    setUser(resourceToAuthUser(resource))

    return resource.role
  }

  const signOut = async (): Promise<void> => {
    try {
      await authService.logout()
    } finally {
      // Always clear local state even if the server call fails
      apiClient.clearToken()
      setOriginalUser(null)
      setUser(null)
    }
  }

  const impersonateAs = (role: Role) => {
    if (!user || user.role === role) return
    setOriginalUser(user)
    // Swap in-memory role; full API-based impersonation can be added later
    setUser({ ...user, role })
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
        isBootstrapping,
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
