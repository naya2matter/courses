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
  // If manager field is null, fall back to "None"
  const managerStr = user.manager ? String(user.manager) : "None"
  
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 shadow-sm transition-colors hover:bg-muted/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-1 flex flex-wrap items-center gap-2">
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
          <ShieldIcon className="h-3 w-3" />
          Manager: {managerStr}
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

  return (
    <div className={`flex flex-col gap-4 ${level > 0 ? "rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm" : ""}`}>
      <div className="flex flex-col gap-2">
        {/* Department header row with name and Edit button */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BuildingIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold tracking-tight">{department.name}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(department)}
              className="h-7 gap-1.5 text-xs"
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
                className="h-7 gap-1.5 text-xs"
                aria-label={`Delete ${department.name}`}
              >
                <Trash2Icon className="h-3.5 w-3.5" />
                
              </Button>
            </DeleteDepartmentDialog>
          </div>
        </div>
        
        {/* Render Users */}
        {hasUsers && (
          <div className="mt-2">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UsersIcon className="h-4 w-4" />
              Users ({department.users.length})
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {department.users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </div>
        )}

        {!hasUsers && !hasChildren && (
          <p className="text-sm text-muted-foreground italic">No users or subdepartments.</p>
        )}
      </div>

      {/* Render Subdepartments — pass onEdit down so every level has an Edit button */}
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
    <div className="flex flex-col gap-8">
      {departments.map((dept) => (
        <Card
          key={dept.id}
          className="overflow-hidden hover:bg-white/5 hover:scale-100 hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
        >
          <CardHeader className="bg-muted/40 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{dept.name}</CardTitle>
                <CardDescription className="mt-1.5">
                  Organisational structure and personnel for {dept.name}
                </CardDescription>
              </div>
              <Badge variant="outline" className="h-7 uppercase">
                {dept.slug}
              </Badge>
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
