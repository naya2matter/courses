// ─── Create User Page ───────────────────────────────────────────────────────
// A standalone page for creating a new user.
// This page replaces the previous sheet-based flow.

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { isApiError } from "@/lib/api"
import { createUser } from "../service/user.service"
import type { CreateUserPayload } from "../types/user.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive a human-readable error message from a caught error.
 * Handles Laravel 422 validation errors, 401, and generic API errors.
 */
function extractErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      const first = Object.values(err.data.errors as Record<string, string[]>)[0]
      if (Array.isArray(first) && first.length > 0) return first[0]
    }
    if (err.status === 401) return "You are not authenticated. Please log in again."
    if (err.status === 403) return "You do not have permission to perform this action."
    return err.message || "An unexpected error occurred."
  }

  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

/** Parse a string to a positive integer, returning null for empty/invalid input */
function toIntOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = parseInt(trimmed, 10)
  return isNaN(num) ? null : num
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateUserPage() {
  const navigate = useNavigate()

  // ── Form field state ──────────────────────────────────────────────────────
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [role, setRole] = useState<"user" | "admin">("user")
  const [departmentId, setDepartmentId] = useState("")
  const [reportTo, setReportTo] = useState("")
  const [userLevelTierId, setUserLevelTierId] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): string | null {
    if (!name.trim()) return "Name is required."
    if (!email.trim()) return "Email is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address."
    if (password.length < 8) return "Password must be at least 8 characters."
    if (password !== passwordConfirmation) return "Passwords do not match."
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const clientError = validate()
    if (clientError) {
      setError(clientError)
      return
    }

    const payload: CreateUserPayload = {
      name: name.trim(),
      email: email.trim(),
      password,
      password_confirmation: passwordConfirmation,
      role,
      department_id: toIntOrNull(departmentId),
      report_to: toIntOrNull(reportTo),
      user_level_tier_id: toIntOrNull(userLevelTierId),
    }

    setSubmitting(true)

    try {
      await createUser(payload)
      toast.success("User created successfully.")
      navigate("/admin/user-management/users")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
          <p className="mt-1 text-muted-foreground">
            Create a new user account and assign optional department, manager, and tier.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-fit"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to users
        </Button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5">
            <div className="grid gap-1.5">
              <Label htmlFor="user-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-name"
                placeholder="e.g. Jane Doe"
                maxLength={255}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                required
                autoComplete="name"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user-email"
                type="email"
                placeholder="jane@example.com"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
                autoComplete="email"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-password-confirm">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="user-password-confirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="Repeat password"
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPasswordConfirm((value) => !value)}
                  tabIndex={-1}
                  aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                >
                  {showPasswordConfirm ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as "user" | "admin")}
                disabled={submitting}
              >
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-department">Department ID</Label>
              <Input
                id="user-department"
                type="number"
                placeholder="Optional department ID"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={submitting}
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to leave the user unassigned.
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-report-to">Reports To (User ID)</Label>
              <Input
                id="user-report-to"
                type="number"
                placeholder="Optional manager's user ID"
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
                disabled={submitting}
                min={1}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-tier">User Level Tier ID</Label>
              <Input
                id="user-tier"
                type="number"
                placeholder="Optional tier ID"
                value={userLevelTierId}
                onChange={(e) => setUserLevelTierId(e.target.value)}
                disabled={submitting}
                min={1}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Creating…" : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
