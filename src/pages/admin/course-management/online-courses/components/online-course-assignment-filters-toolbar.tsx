import { useMemo, useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"
import type { OnlineCourse } from "../types/online-course.types"
import type { OnlineCourseAssignmentFilters } from "../types/online-course-assignment.types"

interface Props {
  filters: OnlineCourseAssignmentFilters
  courses: OnlineCourse[]
  users: UserListResource[]
  resultCount: { from: number; to: number; total: number } | null
  onFilterChange: (f: Partial<OnlineCourseAssignmentFilters>) => void
  onClearAll: () => void
}

export function OnlineCourseAssignmentFiltersToolbar({
  filters,
  courses,
  users,
  resultCount,
  onFilterChange,
  onClearAll,
}: Props) {
  const [userSearch, setUserSearch] = useState("")

  const hasActive = Boolean(
    filters.course_online_id || filters.user_id || filters.is_overdue != null,
  )

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(q),
    )
  }, [users, userSearch])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.course_online_id != null ? String(filters.course_online_id) : "all"}
          onValueChange={(v) =>
            onFilterChange({
              course_online_id: v === "all" ? undefined : Number(v),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent className="max-h-[420px]" position="popper" sideOffset={4}>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.user_id != null ? String(filters.user_id) : "all"}
          onValueChange={(v) =>
            onFilterChange({ user_id: v === "all" ? undefined : Number(v), page: 1 })
          }
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent className="max-h-[420px]" position="popper" sideOffset={4}>
            <div className="px-2 pt-2 pb-1 sticky top-0 z-10 bg-popover">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="h-9 pl-8"
                />
              </div>
            </div>
            <SelectItem value="all">All users</SelectItem>
            {filteredUsers.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name} ({u.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            filters.is_overdue == null
              ? "all"
              : filters.is_overdue
                ? "overdue"
                : "not_overdue"
          }
          onValueChange={(v) =>
            onFilterChange({
              is_overdue:
                v === "all" ? undefined : v === "overdue",
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Overdue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="not_overdue">Not overdue</SelectItem>
          </SelectContent>
        </Select>

        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => {
              setUserSearch("")
              onClearAll()
            }}
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {resultCount && (
        <p className="text-sm text-muted-foreground">
          {resultCount.total === 0
            ? "No assignments found"
            : `Showing ${resultCount.from}-${resultCount.to} of ${resultCount.total} assignments`}
        </p>
      )}
    </div>
  )
}
