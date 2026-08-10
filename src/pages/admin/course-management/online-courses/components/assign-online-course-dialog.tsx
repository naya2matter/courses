import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertCircleIcon,
  Loader2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { getAllUsers, getAllUsersUnpaginated } from "@/pages/admin/user-management/users/service/user.service"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"
import { getFilteredDepartments } from "@/pages/admin/user-management/departments/service/department.service"
import type { FlatDepartment } from "@/pages/admin/user-management/departments/types/department.types"
import type { OnlineCourse } from "../types/online-course.types"
import { useOnlineCourseAssignmentStore } from "../store/online-course-assignment.store"

interface Props {
  open: boolean
  courses: OnlineCourse[]
  onClose: () => void
  onAssigned?: () => void
}

export function AssignOnlineCourseDialog({
  open,
  courses,
  onClose,
  onAssigned,
}: Props) {
  const createAssignments = useOnlineCourseAssignmentStore((s) => s.createAssignments)
  const isCreating = useOnlineCourseAssignmentStore((s) => s.isCreating)
  const createError = useOnlineCourseAssignmentStore((s) => s.createError)
  const clearCreateError = useOnlineCourseAssignmentStore((s) => s.clearCreateError)

  const [courseId, setCourseId] = useState("")
  const [userId, setUserId] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<UserListResource[]>([])
  const [sendNotification, setSendNotification] = useState(true)

  // Search-as-you-type user results — avoids relying on one preloaded page
  // that silently drops everyone past the backend's per_page cap.
  const [userOptions, setUserOptions] = useState<UserListResource[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [departmentId, setDepartmentId] = useState("")
  const [departments, setDepartments] = useState<FlatDepartment[]>([])

  useEffect(() => {
    if (!open) {
      setCourseId("")
      setUserId("")
      setSelectedUsers([])
      setSendNotification(true)
      setUserOptions([])
      setDepartmentId("")
      clearCreateError()
    }
  }, [open, clearCreateError])

  // Departments rarely change — load once, independent of the dialog's open state.
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
        // No search text — load everyone (matching the department filter,
        // if any) so admins can browse the full list, not just one page.
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

  // Preload/refresh the user list when the dialog opens or the department filter changes.
  useEffect(() => {
    if (open) handleUserSearch("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, departmentId])

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === courseId) ?? null,
    [courseId, courses],
  )

  function addUser(userIdValue: string) {
    const user = userOptions.find((u) => String(u.id) === userIdValue)
    if (!user) return
    if (selectedUsers.some((u) => u.id === user.id)) {
      toast.error("User already selected")
      setUserId("")
      return
    }
    setSelectedUsers((prev) => [...prev, user])
    setUserId("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId || selectedUsers.length === 0) return

    try {
      const res = await createAssignments({
        course_online_id: Number(courseId),
        user_ids: selectedUsers.map((u) => u.id),
        send_notification: sendNotification,
      })

      toast.success(
        res.meta.created > 0
          ? `Created ${res.meta.created} assignment${res.meta.created > 1 ? "s" : ""}${res.meta.skipped ? `, skipped ${res.meta.skipped}` : ""}.`
          : `No assignments created. Skipped ${res.meta.skipped}.`,
      )
      onAssigned?.()
      onClose()
    } catch {
      // surfaced in UI via createError
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isCreating && !v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon className="h-4 w-4" />
            Assign Online Course
          </DialogTitle>
          <DialogDescription>
            Assign one course to one or more users in a single action.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {createError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label>Course</Label>
            <SearchableSelect
              value={courseId}
              onValueChange={setCourseId}
              placeholder="Select online course"
              searchPlaceholder="Search courses…"
              emptyText="No courses found"
              options={courses.map((c) => ({ value: String(c.id), label: c.name }))}
            />
            {selectedCourse && (
              <p className="text-xs text-muted-foreground">
                Status: <span className="capitalize">{selectedCourse.status}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Department</Label>
            <SearchableSelect
              value={departmentId}
              onValueChange={(v) => setDepartmentId(v === "all" ? "" : v)}
              placeholder="All departments"
              searchPlaceholder="Search departments…"
              emptyText="No departments found"
              pinnedOptions={[{ value: "all", label: "All departments" }]}
              options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Users</Label>
            <SearchableSelect
              value={userId}
              onValueChange={addUser}
              placeholder="Add user…"
              searchPlaceholder="Type a name or email to search all users…"
              emptyText={isSearchingUsers ? "Searching…" : "No users found"}
              onSearchChange={handleUserSearch}
              isSearching={isSearchingUsers}
              options={userOptions.map((u) => ({
                value: String(u.id),
                label: u.name,
                keywords: `${u.email} ${u.department?.name ?? ""}`,
                node: (
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">{u.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {u.department?.name ?? u.email}
                    </span>
                  </span>
                ),
              }))}
            />
            <p className="text-xs text-muted-foreground">
              {isSearchingUsers
                ? "Loading…"
                : `Showing all ${userOptions.length} users${departmentId ? " in this department" : ""}. Type above to narrow down.`}
            </p>
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedUsers.map((u) => (
                  <Badge key={u.id} variant="secondary" className="gap-1.5">
                    {u.name}
                    <button
                      type="button"
                      aria-label={`Remove ${u.name}`}
                      onClick={() => setSelectedUsers((prev) => prev.filter((s) => s.id !== u.id))}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/3 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Send Notification</p>
              <p className="text-xs text-muted-foreground">
                Notify selected users immediately.
              </p>
            </div>
            <Switch checked={sendNotification} onCheckedChange={setSendNotification} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !courseId || selectedUsers.length === 0}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-4 w-4" />
                  Assign
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
