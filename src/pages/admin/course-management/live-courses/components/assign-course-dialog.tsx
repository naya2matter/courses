// ─── Assign Course Dialog ────────────────────────────────────────────────────
// Sheet for assigning a private live course to a user.
// POST /admin/course-assignments/create

import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import {
  Loader2Icon,
  UserPlusIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  XIcon,
  BookOpenIcon,
  UserIcon,
  CalendarIcon,
  HashIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import { useCourseAssignmentStore } from "../store/course-assignment.store"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import { useDepartmentOptions } from "@/pages/admin/user-management/users/hook/use-department-options"
import { parseAvailabilities } from "../utils/availability"
import type { CourseResource } from "../types/course.types"
import type { CourseAssignmentResource } from "../types/course-assignment.types"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"

const SELECT_ALL_VALUE = "__select_all__"

interface AssignCourseDialogProps {
  open: boolean
  /** Pre-selected course — always private, so the selector is locked. */
  preselectedCourse?: CourseResource | null
  /** All available courses; only private ones will be offered in the selector. */
  courses: CourseResource[]
  onClose: () => void
  onAssigned?: (assignment: CourseAssignmentResource) => void
}

function formatDate(d?: string | null) {
  if (!d) return "TBD"
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return d ?? "TBD"
  }
}

export function AssignCourseDialog({
  open,
  preselectedCourse,
  courses,
  onClose,
  onAssigned,
}: AssignCourseDialogProps) {
  const formId = useId()
  const { isCreating, createError, clearCreateError, createAssignment } =
    useCourseAssignmentStore()
  const { departments, isLoadingOptions } = useDepartmentOptions()

  // Only private courses can be manually assigned
  const privateCourses = courses.filter((c) => c.privacy === "private")

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    preselectedCourse ? String(preselectedCourse.id) : "",
  )
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedUsers, setSelectedUsers] = useState<UserListResource[]>([])
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string>("")

  // ── User list ──────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserListResource[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)

  // ── Success result ─────────────────────────────────────────────────────────
  const [successResults, setSuccessResults] = useState<CourseAssignmentResource[]>([])

  useEffect(() => {
    if (!open) return
    setIsLoadingUsers(true)
    setUsersError(null)

    const filters = {
      per_page: 500,
      department_id:
        selectedDepartmentId && selectedDepartmentId !== "all"
          ? Number(selectedDepartmentId)
          : undefined,
    }

    getAllUsers(filters)
      .then((res) => setUsers(res.data))
      .catch((err: Error) => setUsersError(err.message || "Failed to load users"))
      .finally(() => setIsLoadingUsers(false))
  }, [open, selectedDepartmentId])

  // Sync preselected course
  useEffect(() => {
    if (preselectedCourse) {
      setSelectedCourseId(String(preselectedCourse.id))
    }
  }, [preselectedCourse])

  function addUser(userId: string) {
    if (!userId) return

    if (userId === SELECT_ALL_VALUE) {
      addAllUsers()
      return
    }

    const user = users.find((u) => String(u.id) === userId)
    if (!user) return

    if (selectedUsers.some((item) => item.id === user.id)) {
      toast.error("This user is already selected.")
      setSelectedUserId("")
      return
    }

    setSelectedUsers((prev) => [...prev, user])
    setSelectedUserId("")
  }

  function addAllUsers() {
    setSelectedUsers((prev) => {
      const existingIds = new Set(prev.map((u) => u.id))
      const toAdd = users.filter((u) => !existingIds.has(u.id))
      return [...prev, ...toAdd]
    })
    setSelectedUserId("")
  }

  function handleRemoveUser(userId: number) {
    setSelectedUsers((prev) => prev.filter((item) => item.id !== userId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourseId || selectedUsers.length === 0) return

    try {
      const created: CourseAssignmentResource[] = []
      for (const user of selectedUsers) {
        const result = await createAssignment({
          course_id: Number(selectedCourseId),
          user_id: user.id,
          course_availability_id:
            selectedAvailabilityId &&
            selectedAvailabilityId !== "none" &&
            !selectedAvailabilityId.startsWith("idx-")
              ? Number(selectedAvailabilityId)
              : null,
        })
        created.push(result)
        onAssigned?.(result)
      }
      setSuccessResults(created)
      toast.success(
        created.length === 1
          ? "Course assigned successfully!"
          : `Course assigned to ${created.length} users successfully!`,
      )
    } catch {
      // error is surfaced via createError from the store
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedUserId("")
      setSelectedUsers([])
      setSelectedAvailabilityId("")
      setSelectedDepartmentId("")
      setSuccessResults([])
      clearCreateError()
      if (!preselectedCourse) {
        setSelectedCourseId("")
      }
    }
  }, [open, preselectedCourse, clearCreateError])

  // Derive the selected course object for availability picker
  const activeCourse = preselectedCourse
    ?? privateCourses.find((c) => String(c.id) === selectedCourseId)
    ?? null

  const availabilities = activeCourse ? parseAvailabilities(activeCourse.availabilities) : []

  // ── Success View ───────────────────────────────────────────────────────────
  if (successResults.length > 0) {
    const firstResult = successResults[0]
    return (
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="px-6 pt-6 pb-5">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />
              {successResults.length === 1 ? "Assignment Created" : "Assignments Created"}
            </SheetTitle>
            <SheetDescription>
              {successResults.length === 1
                ? "The course has been successfully assigned to the user."
                : `The course has been successfully assigned to ${successResults.length} users.`}
            </SheetDescription>
          </SheetHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
              {/* Strip */}
              <div className="flex items-center gap-2 border-b border-emerald-500/10 bg-emerald-500/10 px-5 py-3">
                <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Assignment #{firstResult.id}
                </span>
              </div>

              <div className="divide-y divide-border/40 px-5">
                {/* Course */}
                <div className="flex items-start gap-3 py-4">
                  <BookOpenIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Course</p>
                    <p className="mt-0.5 font-semibold text-foreground leading-snug">
                      {firstResult.course?.name ?? `Course #${firstResult.course?.id}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">Private</Badge>
                </div>

                {/* Assigned to */}
                <div className="space-y-3 py-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Assigned To</p>
                  <div className="space-y-2">
                    {successResults.map((assignment) => (
                      <div key={assignment.user?.id ?? assignment.id} className="flex items-center gap-3">
                        <UserIcon className="h-4 w-4 shrink-0 text-sky-400" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {assignment.user?.name ?? `User #${assignment.user?.id}`}
                          </p>
                          {assignment.user?.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {assignment.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session */}
                {firstResult.course_availability && (
                  <div className="flex items-start gap-3 py-4">
                    <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Session</p>
                      <p className="mt-0.5 text-sm text-foreground">
                        {formatDate(firstResult.course_availability.start_date)}
                        {firstResult.course_availability.end_date &&
                          ` → ${formatDate(firstResult.course_availability.end_date)}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Assigned by */}
                {(firstResult.assigned_by_user || firstResult.assigned_by) && (
                  <div className="flex items-start gap-3 py-4">
                    <HashIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Assigned By</p>
                      <p className="mt-0.5 text-sm text-foreground">
                        {firstResult.assigned_by_user?.name ?? `User #${firstResult.assigned_by}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3 px-6 py-5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSuccessResults([])
                setSelectedUsers([])
                setSelectedUserId("")
                setSelectedAvailabilityId("")
              }}
            >
              Assign Another
            </Button>
            <Button className="flex-1" onClick={onClose}>Done</Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // ── Form View ──────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v && !isCreating) onClose() }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="px-6 pt-6 pb-5">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <UserPlusIcon className="h-5 w-5 text-primary" />
            Assign Course to User
          </SheetTitle>
          <SheetDescription>
            Manually assign a private course to a specific user.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <form
          id={formId}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          {/* Errors */}
          {createError && (
            <Alert variant="destructive" className="py-3">
              <AlertCircleIcon className="h-4 w-4" />
              <div className="flex w-full items-start justify-between gap-2">
                <AlertDescription className="text-sm">{createError}</AlertDescription>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={clearCreateError}>
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Alert>
          )}

          {usersError && (
            <Alert variant="destructive" className="py-3">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription className="text-sm">{usersError}</AlertDescription>
            </Alert>
          )}

          {/* Course */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Course <span className="text-destructive">*</span>
            </Label>
            {preselectedCourse ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                <BookOpenIcon className="h-4 w-4 shrink-0 text-indigo-400" />
                <p className="min-w-0 flex-1 truncate font-medium text-sm text-foreground">
                  {preselectedCourse.name}
                </p>
                <Badge variant="secondary" className="shrink-0 text-xs whitespace-nowrap">
                  Private · #{preselectedCourse.id}
                </Badge>
              </div>
            ) : (
              <Select
                value={selectedCourseId}
                onValueChange={(v) => { setSelectedCourseId(v); setSelectedAvailabilityId("") }}
                required
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select a private course…" />
                </SelectTrigger>
                <SelectContent>
                  {privateCourses.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No private courses available
                    </div>
                  ) : (
                    privateCourses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">#{c.id}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Department</Label>
            <SearchableSelect
              value={selectedDepartmentId || "all"}
              onValueChange={(v) => setSelectedDepartmentId(v === "all" ? "" : v)}
              disabled={isLoadingOptions}
              placeholder={isLoadingOptions ? "Loading departments…" : "All departments"}
              searchPlaceholder="Search departments…"
              triggerClassName="h-11 w-full"
              pinnedOptions={[{ value: "all", label: "All departments" }]}
              options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
            />
          </div>

          {/* User */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                User <span className="text-destructive">*</span>
              </Label>
              {selectedUsers.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear all ({selectedUsers.length})
                </button>
              )}
            </div>
            {isLoadingUsers ? (
              <div className="space-y-2">
                <Skeleton className="h-11 w-full rounded-md" />
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2Icon className="h-3 w-3 animate-spin" /> Loading users…
                </p>
              </div>
            ) : (
              <div>
                <SearchableSelect
                  value={selectedUserId}
                  onValueChange={(value) => addUser(value)}
                  placeholder="Select a user…"
                  searchPlaceholder="Search users…"
                  triggerClassName="h-11 w-full"
                  contentClassName="max-h-72"
                  emptyText="No users found"
                  pinnedOptions={
                    users.length > 0
                      ? [
                          {
                            value: SELECT_ALL_VALUE,
                            label: `Select all (${users.length})`,
                            node: (
                              <span className="font-medium text-primary">
                                Select all ({users.length})
                              </span>
                            ),
                          },
                        ]
                      : []
                  }
                  options={users.map((u) => ({
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
              </div>
            )}

            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted px-3 py-1 text-sm"
                  >
                    <span>{user.name}</span>
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-border/30"
                      onClick={() => handleRemoveUser(user.id)}
                      aria-label={`Remove ${user.name}`}
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use the selector above to build a batch of users to assign.
              </p>
            )}
          </div>

          {/* Session (optional) */}
          {availabilities.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Session{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Select value={selectedAvailabilityId} onValueChange={setSelectedAvailabilityId}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="No specific session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific session</SelectItem>
                  {availabilities.map((slot, idx) => (
                    <SelectItem
                      key={slot.id ?? idx}
                      value={slot.id ? String(slot.id) : `idx-${idx}`}
                    >
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>
                          {formatDate(slot.start_date)}
                          {slot.end_date ? ` → ${formatDate(slot.end_date)}` : ""}
                        </span>
                        {slot.capacity != null && (
                          <span className="text-xs text-muted-foreground">
                            · {slot.available_spots ?? slot.capacity} spots
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Info note */}
          <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            Only <span className="font-medium text-foreground">private</span> courses
            require manual assignment. Public courses are automatically available to
            all platform users.
          </div>
        </form>

        <Separator />

        <div className="flex gap-3 px-6 py-5">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            className="flex-1"
            disabled={
              isCreating || !selectedCourseId || selectedUsers.length === 0
            }
          >
            {isCreating ? (
              <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Assigning…</>
            ) : (
              <>
                <UserPlusIcon className="mr-2 h-4 w-4" />
                {selectedUsers.length > 1
                  ? `Assign Course to ${selectedUsers.length} Users`
                  : "Assign Course"}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

