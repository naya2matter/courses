import { useCallback, useEffect, useMemo, useState } from "react"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { getAllUsers, getAllUsersUnpaginated } from "@/pages/admin/user-management/users/service/user.service"
import { getFilteredDepartments } from "@/pages/admin/user-management/departments/service/department.service"
import type { FlatDepartment } from "@/pages/admin/user-management/departments/types/department.types"
import type { OnlineCourse } from "../types/online-course.types"
import type { OnlineCourseAssignmentFilters } from "../types/online-course-assignment.types"

interface Props {
  filters: OnlineCourseAssignmentFilters
  courses: OnlineCourse[]
  resultCount: { from: number; to: number; total: number } | null
  onFilterChange: (f: Partial<OnlineCourseAssignmentFilters>) => void
  onClearAll: () => void
}

export function OnlineCourseAssignmentFiltersToolbar({
  filters,
  courses,
  resultCount,
  onFilterChange,
  onClearAll,
}: Props) {
  const hasActive = Boolean(
    filters.course_online_id || filters.user_id || filters.is_overdue != null,
  )

  // Search-as-you-type user results — avoids relying on one preloaded page
  // that silently drops everyone past the backend's per_page cap.
  const [userOptions, setUserOptions] = useState<{ id: number; name: string; email: string }[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [selectedUserOption, setSelectedUserOption] = useState<{ value: string; label: string; keywords: string } | null>(null)
  const [departmentId, setDepartmentId] = useState("")
  const [departments, setDepartments] = useState<FlatDepartment[]>([])

  // Departments rarely change — load once.
  useEffect(() => {
    getFilteredDepartments({ has_users: true }, 100)
      .then((res) => setDepartments(res.departments))
      .catch(() => null)
  }, [])

  const handleUserSearch = useCallback(async (term: string) => {
    setIsSearchingUsers(true)
    try {
      const departmentFilter = departmentId ? Number(departmentId) : undefined
      if (!term) {
        const all = await getAllUsersUnpaginated({ department_id: departmentFilter })
        setUserOptions(all)
      } else {
        const res = await getAllUsers({ search: term, department_id: departmentFilter, per_page: 100 })
        setUserOptions(res.data)
      }
    } catch {
      // keep whatever options are already shown; the search box stays usable
    } finally {
      setIsSearchingUsers(false)
    }
  }, [departmentId])

  useEffect(() => {
    handleUserSearch("")
  }, [handleUserSearch])

  function handleUserFilterChange(v: string) {
    if (v === "all") {
      setSelectedUserOption(null)
    } else {
      const picked = userOptions.find((u) => String(u.id) === v)
      if (picked) setSelectedUserOption({ value: v, label: `${picked.name} (${picked.email})`, keywords: picked.email })
    }
    onFilterChange({ user_id: v === "all" ? undefined : Number(v), page: 1 })
  }

  // Keep the currently selected user visible even if a later search
  // replaces the loaded batch and no longer includes them.
  const userSelectOptions = useMemo(() => {
    const base = userOptions.map((u) => ({
      value: String(u.id),
      label: `${u.name} (${u.email})`,
      keywords: u.email,
    }))
    if (selectedUserOption && !base.some((o) => o.value === selectedUserOption.value)) {
      base.unshift(selectedUserOption)
    }
    return base
  }, [userOptions, selectedUserOption])

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

        <SearchableSelect
          value={departmentId || "all"}
          onValueChange={(v) => setDepartmentId(v === "all" ? "" : v)}
          placeholder="Filter by department"
          searchPlaceholder="Search departments…"
          triggerClassName="w-[220px]"
          emptyText="No departments found"
          pinnedOptions={[{ value: "all", label: "All departments" }]}
          options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
        />

        <SearchableSelect
          value={filters.user_id != null ? String(filters.user_id) : "all"}
          onValueChange={handleUserFilterChange}
          placeholder="Filter by user"
          searchPlaceholder="Type a name or email to search all users…"
          triggerClassName="w-[240px]"
          emptyText={isSearchingUsers ? "Searching…" : "No users found"}
          onSearchChange={handleUserSearch}
          isSearching={isSearchingUsers}
          pinnedOptions={[{ value: "all", label: "All users" }]}
          options={userSelectOptions}
        />

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
            onClick={onClearAll}
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
