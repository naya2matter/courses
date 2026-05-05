// --- Edit User Page ---------------------------------------------------------
// A standalone page for updating an existing user.
// It updates any editable field and keeps password optional.

import { useState, type FormEvent } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  ShieldIcon,
  SlidersHorizontalIcon,
  SquarePenIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { isApiError } from "@/lib/api"
import { updateUser } from "../service/user.service"
import type { UpdateUserPayload, UserListResource } from "../types/user.types"
import { useDepartmentOptions } from "../hook/use-department-options"

// Radix Select item values cannot be empty strings.
const NONE_VALUE = "__none__"

/** Extracts user-friendly API errors for inline alert rendering. */
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

export function EditUserPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  // Passed from users table on Edit click.
  const userFromState = location.state?.user as UserListResource | undefined

  const userId = Number(id)

  const [name, setName] = useState(userFromState?.name ?? "")
  const [email, setEmail] = useState(userFromState?.email ?? "")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [role, setRole] = useState<"admin" | "user">(userFromState?.role ?? "user")
  const [departmentId, setDepartmentId] = useState(
    userFromState?.department?.id ? String(userFromState.department.id) : "",
  )
  const [reportTo, setReportTo] = useState(
    userFromState?.report_to?.id ? String(userFromState.report_to.id) : "",
  )
  const [userLevelTierId, setUserLevelTierId] = useState(
    userFromState?.tier?.id ? String(userFromState.tier.id) : "",
  )

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Linked options from departments data.
  const { departments, allUsers, allTiers, isLoadingOptions } =
    useDepartmentOptions()

  function validate(): string | null {
    if (!name.trim()) return "Name is required."
    if (!email.trim()) return "Email is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address."
    }

    // Password is optional for updates; validate only when typed.
    if (password.length > 0 && password.length < 8) {
      return "Password must be at least 8 characters."
    }
    if (password.length > 0 && password !== passwordConfirmation) {
      return "Passwords do not match."
    }

    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Invalid user id.")
      return
    }

    const clientError = validate()
    if (clientError) {
      setError(clientError)
      return
    }

    const payload: UpdateUserPayload = {
      name: name.trim(),
      email: email.trim(),
      role,
      department_id: departmentId ? Number(departmentId) : null,
      report_to: reportTo ? Number(reportTo) : null,
      user_level_tier_id: userLevelTierId ? Number(userLevelTierId) : null,
    }

    // Only send password keys if user entered a new password.
    if (password) {
      payload.password = password
      payload.password_confirmation = passwordConfirmation
    }

    setSubmitting(true)

    try {
      const updated = await updateUser(userId, payload)
      toast.success(`User ${updated.name} updated successfully.`)
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
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-card/90 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <SquarePenIcon className="h-4 w-4" />
            Edit user
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Update User</h1>
            <p className="text-sm text-muted-foreground">
              Update user details, role, and assignment settings.
            </p>
          </div>
        </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full border-white/15 bg-background/40 sm:w-auto"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to users
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="overflow-hidden border-white/10 bg-card/90 shadow-sm transition-none hover:bg-transparent hover:shadow-none hover:scale-100">
          <CardHeader className="bg-muted/60 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Edit user</CardTitle>
                <CardDescription>
                  Update fields below and save changes.
                </CardDescription>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm text-muted-foreground">
                <ShieldIcon className="h-4 w-4" />
                User id: {userId}
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="space-y-4 px-5 py-5 sm:px-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!userFromState && (
              <Alert>
                <AlertDescription>
                  This page works best when opened from the Users table edit action.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 lg:grid-cols-[1fr_0.68fr]">
              <div className="grid gap-4 rounded-3xl border border-white/10 bg-muted/60 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Account details
                </p>
                <div className="grid gap-1.5">
                  <Label htmlFor="user-name">
                    Full name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="user-name"
                    placeholder="Jane Doe"
                    maxLength={255}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    required
                    autoComplete="name"
                    className="h-10"
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
                    className="h-10"
                  />
                </div>

                <div className="grid gap-1.5 sm:grid-cols-2 sm:items-end sm:gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="user-password">New password (optional)</Label>
                    <div className="relative">
                      <Input
                        id="user-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Leave blank to keep current"
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        autoComplete="new-password"
                        className="h-9 pr-10"
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
                    <p className="text-xs text-muted-foreground">
                      Leave blank to keep current password.
                    </p>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="user-password-confirm">
                      Confirm password (optional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="user-password-confirm"
                        type={showPasswordConfirm ? "text" : "password"}
                        placeholder="Repeat new password"
                        minLength={8}
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        disabled={submitting}
                        autoComplete="new-password"
                        className="h-9 pr-10"
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
                    <p className="text-xs text-muted-foreground">
                      Required only if changing password.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-white/10 bg-muted/65 p-5">
                <div className="space-y-1.5">
                  <p className="inline-flex items-center gap-2 text-sm font-medium">
                    <SlidersHorizontalIcon className="h-4 w-4 text-primary" />
                    Optional settings
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Assign the user to a department or manager, or set a tier.
                  </p>
                </div>

                <div className="grid gap-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="user-role">Role</Label>
                    <Select
                      value={role}
                      onValueChange={(value) => setRole(value as "user" | "admin")}
                      disabled={submitting}
                    >
                      <SelectTrigger id="user-role" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="user-department">Department</Label>
                    <Select
                      value={departmentId || NONE_VALUE}
                      onValueChange={(value) =>
                        setDepartmentId(value === NONE_VALUE ? "" : value)
                      }
                      disabled={submitting || isLoadingOptions}
                    >
                      <SelectTrigger id="user-department" className="h-9 w-full">
                        <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Select department"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={String(department.id)}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="user-report-to">Reports To</Label>
                    <Select
                      value={reportTo || NONE_VALUE}
                      onValueChange={(value) =>
                        setReportTo(value === NONE_VALUE ? "" : value)
                      }
                      disabled={submitting || isLoadingOptions}
                    >
                      <SelectTrigger id="user-report-to" className="h-9 w-full">
                        <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Select manager"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={NONE_VALUE}>No manager</SelectItem>
                          {allUsers.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="user-tier">User Level Tier</Label>
                    <Select
                      value={userLevelTierId || NONE_VALUE}
                      onValueChange={(value) =>
                        setUserLevelTierId(value === NONE_VALUE ? "" : value)
                      }
                      disabled={submitting || isLoadingOptions}
                    >
                      <SelectTrigger id="user-tier" className="h-9 w-full">
                        <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Select tier"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={NONE_VALUE}>No tier</SelectItem>
                          {allTiers.map((tier) => (
                            <SelectItem key={tier.id} value={String(tier.id)}>
                              {tier.tier_name}
                              {tier.level?.name ? ` / ${tier.level.name}` : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <Separator />

          <CardFooter className="flex flex-col gap-2 border-t border-white/10 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <div className="text-xs text-muted-foreground">
              Save changes after reviewing role and assignment fields.
            </div>
            <div className=" flex gap-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="w-full border-white/15 sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Saving..." : "Save changes"}
            </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
