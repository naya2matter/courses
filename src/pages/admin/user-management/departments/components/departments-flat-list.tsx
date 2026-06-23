// ─── DepartmentsFlatList ──────────────────────────────────────────────────────
// Card-based view for departments in filtered/paginated mode.
// Uses the same card layout and user hierarchy display as DepartmentsList.

import {
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
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
import { UserHierarchyTree } from "./departments-list"
import type {
  Department,
  FlatDepartment,
  FilteredDepartmentsMeta,
} from "../types/department.types"

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  meta,
  onPage,
}: {
  meta: FilteredDepartmentsMeta
  onPage: (p: number) => void
}) {
  if (meta.last_page <= 1) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page {meta.current_page} of {meta.last_page} · {meta.total} department{meta.total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-white/10 bg-white/5"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-white/10 bg-white/5"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface DepartmentsFlatListProps {
  departments: FlatDepartment[]
  meta: FilteredDepartmentsMeta
  onEdit: (dept: Department) => void
  onDelete: () => void
  onPage: (p: number) => void
}

export function DepartmentsFlatList({
  departments,
  meta,
  onEdit,
  onDelete,
  onPage,
}: DepartmentsFlatListProps) {
  if (departments.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">No departments match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {departments.map((dept) => {
        const hasUsers = dept.users && dept.users.length > 0

        return (
          <Card
            key={dept.id}
            className="overflow-hidden border border-white/10 bg-card shadow-none transition-none hover:!scale-100 hover:!bg-card hover:!shadow-none"
          >
            {/* ── Card header — identical to DepartmentsList ── */}
            <CardHeader className="bg-muted/30 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl text-white">{dept.name}</CardTitle>
                  <CardDescription className="mt-1 text-muted-foreground">
                    {dept.parent
                      ? `Sub-department of ${dept.parent.name}`
                      : `Organisational structure and personnel for ${dept.name}`}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="h-7 uppercase">
                    {dept.slug}
                  </Badge>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {dept.users_count} user{dept.users_count !== 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(dept as unknown as Department)}
                    aria-label={`Edit ${dept.name}`}
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </Button>
                  <DeleteDepartmentDialog
                    department={dept as unknown as Department}
                    onSuccess={onDelete}
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

            {/* ── Card body — same user hierarchy as DepartmentNode ── */}
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                {/* Sub-dept header row (matches DepartmentNode level=0) */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground">
                      <BuildingIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-white">
                        {dept.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {hasUsers
                          ? `${dept.users.length} user${dept.users.length === 1 ? "" : "s"}`
                          : "No users"}
                        {dept.parent ? ` · sub-dept of ${dept.parent.name}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Users hierarchy — identical to DepartmentNode */}
                {hasUsers && (
                  <div className="rounded-2xl border border-white/10 bg-card/80 p-4">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        Users
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                        {dept.users.length} total
                      </span>
                    </div>
                    <UserHierarchyTree users={dept.users} />
                  </div>
                )}

                {!hasUsers && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-card/60 p-4 text-sm italic text-muted-foreground">
                    No users in this department.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Pagination meta={meta} onPage={onPage} />
    </div>
  )
}
