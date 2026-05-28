import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertCircleIcon,
  CalendarIcon,
  Loader2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"
import type { OnlineCourse } from "../types/online-course.types"
import { useOnlineCourseAssignmentStore } from "../store/online-course-assignment.store"

interface Props {
  open: boolean
  courses: OnlineCourse[]
  users: UserListResource[]
  onClose: () => void
  onAssigned?: () => void
}

export function AssignOnlineCourseDialog({
  open,
  courses,
  users,
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
  const [deadline, setDeadline] = useState("")
  const [sendNotification, setSendNotification] = useState(true)

  useEffect(() => {
    if (!open) {
      setCourseId("")
      setUserId("")
      setSelectedUsers([])
      setDeadline("")
      setSendNotification(true)
      clearCreateError()
    }
  }, [open, clearCreateError])

  const selectedCourse = useMemo(
    () => courses.find((c) => String(c.id) === courseId) ?? null,
    [courseId, courses],
  )

  function addUser(userIdValue: string) {
    const user = users.find((u) => String(u.id) === userIdValue)
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
        deadline: deadline ? new Date(deadline).toISOString() : null,
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
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select online course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCourse && (
              <p className="text-xs text-muted-foreground">
                Status: <span className="capitalize">{selectedCourse.status}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Users</Label>
            <Select value={userId} onValueChange={addUser}>
              <SelectTrigger>
                <SelectValue placeholder="Add user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="space-y-1.5">
            <Label htmlFor="assign-deadline" className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Deadline (optional)
            </Label>
            <Input
              id="assign-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
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
