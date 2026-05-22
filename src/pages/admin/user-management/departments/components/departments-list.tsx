// ─── Departments Recursion View ───────────────────────────────────────────────
// Renders department data as cards containing their respective tree nodes.

import { BuildingIcon, UserIcon, CheckCircleIcon, ShieldIcon, UsersIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DeleteDepartmentDialog } from "./delete-department-dialog"
import type { Department, DepartmentUser } from "../types/department.types"

// ── Components ───────────────────────────────────────────────────────────────

/**
 * Helper to display a single user.
 */
function UserCard({ user }: { user: DepartmentUser }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-muted/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none text-white truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {user.role && (
          <Badge variant="outline" className="gap-1 font-normal text-xs capitalize">
            <ShieldIcon className="h-3 w-3" />
            {user.role}
          </Badge>
        )}
        {user.tier && (
          <Badge variant="secondary" className="gap-1 font-normal">
            <CheckCircleIcon className="h-3 w-3" />
            <span className="capitalize">{user.tier.tier_name}</span>
            {user.tier.level && (
              <span className="text-muted-foreground">— {user.tier.level.name}</span>
            )}
          </Badge>
        )}
        <Badge variant="outline" className="gap-1 font-normal text-xs text-muted-foreground">
          <UserIcon className="h-3 w-3" />
          Manager: {user.manager?.name ?? "None"}
        </Badge>
      </div>
    </div>
  )
}

/**
 * Helper to visualize a subdepartment node recursively.
 * onEdit callback is propagated so every level can trigger the edit sheet.
 */
function DepartmentNode({
  department,
  level = 0,
  onEdit,
  onDelete,
}: {
  department: Department
  level?: number
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
}) {
  const hasUsers = department.users && department.users.length > 0
  const hasChildren = department.children && department.children.length > 0
  const childCount = department.children?.length ?? 0

  return (
    <div className={`flex flex-col gap-4 ${level > 0 ? "rounded-2xl border border-white/10 bg-muted/30 p-4" : ""}`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground">
              <BuildingIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {department.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {hasUsers ? `${department.users.length} user${department.users.length === 1 ? "" : "s"}` : "No users yet"}
                {hasChildren ? ` · ${childCount} subdepartment${childCount === 1 ? "" : "s"}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(department)}
              className="h-8 gap-1.5 text-xs"
              aria-label={`Edit ${department.name}`}
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </Button>
            <DeleteDepartmentDialog
              department={department}
              onSuccess={() => onDelete(department)}
            >
              <Button
                variant="destructive"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                aria-label={`Delete ${department.name}`}
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </Button>
            </DeleteDepartmentDialog>
          </div>
        </div>

        {hasUsers && (
          <div className="rounded-2xl border border-white/10 bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                Users
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                {department.users.length} total
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {department.users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </div>
        )}

        {!hasUsers && !hasChildren && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-card/60 p-4 text-sm text-muted-foreground italic">
            No users or subdepartments.
          </div>
        )}
      </div>

      {hasChildren && (
        <div className="mt-2 flex flex-col gap-6">
          {department.children?.map((child) => (
            <DepartmentNode key={child.id} department={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Main UI component that maps root departments to full-screen cards.
 * onEdit is forwarded to every DepartmentNode to allow editing at any depth.
 */
export function DepartmentsList({
  departments,
  onEdit,
  onDelete,
}: {
  departments: Department[]
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
}) {
  if (departments.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No departments found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {departments.map((dept) => (
        <Card
          key={dept.id}
          className="overflow-hidden border border-white/10 bg-card transition-none shadow-none hover:!bg-card hover:!scale-100 hover:!shadow-none"
        >
          <CardHeader className="bg-muted/30 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl text-white">{dept.name}</CardTitle>
                <CardDescription className="mt-1.5 text-muted-foreground">
                  Organisational structure and personnel for {dept.name}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="h-7 uppercase">
                  {dept.slug}
                </Badge>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {dept.users.length} users
                </span>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <DepartmentNode department={dept} onEdit={onEdit} onDelete={onDelete} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
