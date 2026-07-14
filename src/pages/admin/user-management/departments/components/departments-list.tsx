// ─── Departments List ─────────────────────────────────────────────────────────
// Renders department cards with a hierarchical user tree showing
// manager → direct-report relationships at a glance.

import {
  BuildingIcon,
  CheckCircleIcon,
  ChevronsRightIcon,
  PencilIcon,
  ShieldIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { DeleteDepartmentDialog } from "./delete-department-dialog"
import type { Department, DepartmentUser } from "../types/department.types"

// ── User hierarchy helpers ────────────────────────────────────────────────────

/**
 * One user card in the hierarchy tree.
 * `depth` drives the left-indent connector styling.
 * `directReportCount` shows a small badge when a user has reports.
 * `externalManager` shows a subtle upward pointer when the manager is outside the dept.
 */
function UserNode({
  user,
  allUsers,
  depth = 0,
}: {
  user: DepartmentUser
  allUsers: DepartmentUser[]
  depth?: number
}) {
  const userIdSet = new Set(allUsers.map((u) => u.id))
  const reports = allUsers.filter((u) => u.manager?.id === user.id)
  const externalManager =
    user.manager && !userIdSet.has(user.manager.id) ? user.manager : null

  return (
    <div>
      {/* Card */}
      <div className="rounded-xl border border-white/10 bg-muted/40 px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-4 w-4" />
          </div>

          {/* Name + email + external manager hint */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            {externalManager && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/50">
                <ChevronsRightIcon className="h-3 w-3 rotate-[-90deg]" />
                Reports to {externalManager.name} (external)
              </p>
            )}
          </div>

          {/* Badges */}
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {user.role && (
              <Badge
                variant="outline"
                className="h-5 gap-1 px-1.5 text-[11px] font-normal capitalize"
              >
                <ShieldIcon className="h-2.5 w-2.5" />
                {user.role}
              </Badge>
            )}
            {user.tier && (
              <Badge
                variant="secondary"
                className="h-5 gap-1 px-1.5 text-[11px] font-normal"
              >
                <CheckCircleIcon className="h-2.5 w-2.5" />
                {user.tier.level ? user.tier.level.name : user.tier.tier_name}
                {user.tier.level && (
                  <span className="text-muted-foreground">
                    {" / "}
                    {user.tier.tier_name}
                  </span>
                )}
              </Badge>
            )}
            {reports.length > 0 && (
              <Badge className="h-5 gap-1 border border-indigo-500/30 bg-indigo-500/15 px-1.5 text-[11px] font-normal text-indigo-300 hover:bg-indigo-500/20">
                <UsersIcon className="h-2.5 w-2.5" />
                {reports.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Direct reports — indented with a connector line */}
      {reports.length > 0 && (
        <div className="ml-5 mt-2 flex flex-col gap-2 border-l border-white/10 pl-4">
          {reports.map((report) => (
            <UserNode
              key={report.id}
              user={report}
              allUsers={allUsers}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Builds and renders the manager→report tree for a flat list of users.
 * Root users are those whose manager is null or points outside the dept.
 */
export function UserHierarchyTree({ users }: { users: DepartmentUser[] }) {
  if (users.length === 0) return null

  const userIdSet = new Set(users.map((u) => u.id))
  const roots = users.filter(
    (u) => !u.manager?.id || !userIdSet.has(u.manager.id),
  )

  return (
    <div className="flex flex-col gap-2">
      {roots.map((user) => (
        <UserNode key={user.id} user={user} allUsers={users} />
      ))}
    </div>
  )
}

// ── Department node (sub-department) ─────────────────────────────────────────

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
    <div
      className={
        level > 0
          ? "rounded-2xl border border-white/10 bg-muted/30 p-4"
          : "flex flex-col gap-4"
      }
    >
      {/* Sub-dept header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground">
            <BuildingIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">
              {department.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {hasUsers
                ? `${department.users.length} user${department.users.length === 1 ? "" : "s"}`
                : "No users"}
              {hasChildren
                ? ` · ${childCount} sub-dept${childCount === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(department)}
            aria-label={`Edit ${department.name}`}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </Button>
          <DeleteDepartmentDialog
            department={department}
            onSuccess={() => onDelete(department)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label={`Delete ${department.name}`}
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </Button>
          </DeleteDepartmentDialog>
        </div>
      </div>

      {/* Users hierarchy */}
      {hasUsers && (
        <div className="rounded-2xl border border-white/10 bg-card/80 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              Users
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {department.users.length} total
            </span>
          </div>
          <UserHierarchyTree users={department.users} />
        </div>
      )}

      {!hasUsers && !hasChildren && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-card/60 p-4 text-sm italic text-muted-foreground">
          No users or sub-departments.
        </div>
      )}

      {/* Recursive sub-departments */}
      {hasChildren && (
        <div className="mt-2 flex flex-col gap-4">
          {department.children?.map((child) => (
            <DepartmentNode
              key={child.id}
              department={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── DepartmentsList (exported) ────────────────────────────────────────────────

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
          className="overflow-hidden border border-white/10 bg-card shadow-none transition-none hover:!scale-100 hover:!bg-card hover:!shadow-none"
        >
          <CardHeader className="bg-muted/30 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl text-white">{dept.name}</CardTitle>
                <CardDescription className="mt-1 text-muted-foreground">
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(dept)}
                  aria-label={`Edit ${dept.name}`}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
                <DeleteDepartmentDialog
                  department={dept}
                  onSuccess={() => onDelete(dept)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    aria-label={`Delete ${dept.name}`}
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </DeleteDepartmentDialog>
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
