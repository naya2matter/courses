import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/auth"
import { Role } from "@/types/auth"

interface ProtectedRouteProps {
  requiredRole: Role
}

/**
 * Wraps a set of routes and enforces:
 *  1. Authentication  → redirects to /login if not signed in
 *  2. Role match      → redirects to the correct home if the role doesn't match
 */
export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user!.role !== requiredRole) {
    return <Navigate to={user!.role === Role.admin ? "/admin" : "/user"} replace />
  }

  return <Outlet />
}
