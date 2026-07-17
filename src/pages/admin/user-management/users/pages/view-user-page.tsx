import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  Loader2Icon,
  AlertCircleIcon,
  PencilIcon,
  UserRoundIcon,
  MailIcon,
  ShieldIcon,
  Building2Icon,
  UserCogIcon,
  LayersIcon,
  CalendarClockIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { isApiError } from "@/lib/api"
import { getUserById } from "../service/user.service"
import type { UserResource } from "../types/user.types"

function formatDate(iso: string | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[18px_130px_1fr] items-start gap-2 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0 text-foreground break-words">{value}</div>
    </div>
  )
}

export function ViewUserPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const userId = Number(id)
  const [user, setUser] = useState<UserResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Invalid user id.")
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getUserById(userId)
      .then((data) => {
        if (!cancelled) setUser(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof DOMException && err.name === "AbortError") return

        let message = "Failed to load user details."
        if (isApiError(err)) {
          if (err.status === 404) message = "User not found."
          else if (err.status === 401) message = "You are not authenticated. Please log in again."
          else if (err.status === 403) message = "You do not have permission to view this user."
          else message = err.message || message
        } else if (err instanceof Error) {
          message = err.message
        }

        setError(message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const tierText = useMemo(() => {
    if (!user?.tier) return "—"
    const levelName = user.tier.level?.name ?? user.tier.level_name
    return levelName ? `${user.tier.tier_name} / ${levelName}` : user.tier.tier_name
  }, [user?.tier])

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-card/90 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">User Details</h1>
            <p className="text-sm text-muted-foreground">
              View full profile, hierarchy, and assignment details for this user.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={() => navigate(`/admin/user-management/users/edit/${userId}`)}
              disabled={!user || isLoading}
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Unable to load user</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-white/10 bg-card/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundIcon className="h-5 w-5 text-primary" />
            Profile Snapshot
          </CardTitle>
          <CardDescription>Record from GET /admin/users/getById/{'{id}'}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-3 py-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              Loading user details...
            </div>
          ) : user ? (
            <>
              <DetailRow icon={<UserRoundIcon className="h-4 w-4" />} label="Name" value={user.name} />
              <DetailRow icon={<MailIcon className="h-4 w-4" />} label="Email" value={user.email} />
              <DetailRow
                icon={<ShieldIcon className="h-4 w-4" />}
                label="Role"
                value={<Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>}
              />
              <DetailRow
                icon={<Building2Icon className="h-4 w-4" />}
                label="Department"
                value={
                  user.department
                    ? `${user.department.name}${user.department.slug ? ` (${user.department.slug})` : ""}`
                    : "—"
                }
              />
              <DetailRow
                icon={<UserCogIcon className="h-4 w-4" />}
                label="Managers"
                value={(() => {
                  const managers =
                    user.managers && user.managers.length > 0
                      ? user.managers
                      : user.manager
                        ? [user.manager]
                        : []
                  if (managers.length === 0) return "—"
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {managers.map((m) => (
                        <Badge key={m.id} variant="secondary" className="font-normal">
                          {m.name} (#{m.id})
                        </Badge>
                      ))}
                    </div>
                  )
                })()}
              />
              <DetailRow icon={<LayersIcon className="h-4 w-4" />} label="Tier / Level" value={tierText} />
              <DetailRow
                icon={<CalendarClockIcon className="h-4 w-4" />}
                label="Created"
                value={formatDate(user.created_at)}
              />
              <DetailRow
                icon={<CalendarClockIcon className="h-4 w-4" />}
                label="Updated"
                value={formatDate(user.updated_at)}
              />
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
