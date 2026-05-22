// ─── EvaluationFormDialog ─────────────────────────────────────────────────────
// Dialog for creating a new evaluation.
// User selection → course type → course selection → dynamic scores.

import { useState, useEffect } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { getAllDepartments } from "@/pages/admin/user-management/departments/service/department.service"
import type { Department } from "@/pages/admin/user-management/departments/types/department.types"
import { createEvaluation, getEvaluationUsers, getUserAssignedCourses } from "../service/evaluation.service"
import { ScoreRowsEditor } from "./score-rows-editor"
import type { EvaluationScorePayload, EvaluationUserWithCourses, AssignedCourse, CourseType } from "../types/evaluation.types"
import type { EvaluationType } from "./score-rows-editor"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTypes: EvaluationType[]
  onSuccess: () => void
}

export function EvaluationFormDialog({ open, onOpenChange, availableTypes, onSuccess }: Props) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [users, setUsers] = useState<EvaluationUserWithCourses[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [courseType, setCourseType] = useState<CourseType>("regular")
  const [availableCourses, setAvailableCourses] = useState<AssignedCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [scores, setScores] = useState<EvaluationScorePayload[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset all state when dialog opens/closes
  useEffect(() => {
    if (!open) return
    setSelectedDepartmentId("")
    setSelectedUserId("")
    setCourseType("regular")
    setAvailableCourses([])
    setSelectedCourseId("")
    setScores([])
    setApiError(null)
    setUsers([])

    setLoadingDepartments(true)
    getAllDepartments()
      .then(setDepartments)
      .catch(() => {
        setApiError("Failed to load departments.")
      })
      .finally(() => setLoadingDepartments(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!selectedDepartmentId) {
      setUsers([])
      setSelectedUserId("")
      setAvailableCourses([])
      setSelectedCourseId("")
      setLoadingUsers(false)
      return
    }

    setLoadingUsers(true)
    setSelectedUserId("")
    setAvailableCourses([])
    setSelectedCourseId("")
    getEvaluationUsers({ department_id: selectedDepartmentId })
      .then(setUsers)
      .catch(() => {
        setApiError("Failed to load users for the selected department.")
      })
      .finally(() => setLoadingUsers(false))
  }, [open, selectedDepartmentId])

  // Load courses when user or course type changes
  useEffect(() => {
    if (!selectedUserId) {
      setAvailableCourses([])
      setSelectedCourseId("")
      return
    }
    setLoadingCourses(true)
    setAvailableCourses([])
    setSelectedCourseId("")
    getUserAssignedCourses(Number(selectedUserId), courseType)
      .then((res) => {
        const list = courseType === "regular" ? res.regular_courses : res.online_courses
        setAvailableCourses(list ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false))
  }, [selectedUserId, courseType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    if (!selectedDepartmentId) {
      setApiError("Please select a department.")
      return
    }
    if (!selectedUserId) {
      setApiError("Please select a user.")
      return
    }
    if (!selectedCourseId) {
      setApiError("Please select a course.")
      return
    }
    if (scores.length === 0 || scores.some((s) => !s.evaluation_type_id)) {
      setApiError("Please add at least one score row with a valid type.")
      return
    }

    setIsSubmitting(true)
    try {
      await createEvaluation({
        user_id: Number(selectedUserId),
        department_id: Number(selectedDepartmentId),
        course_type: courseType,
        ...(courseType === "regular"
          ? { course_id: Number(selectedCourseId) }
          : { course_online_id: Number(selectedCourseId) }),
        scores,
      })
      toast.success("Evaluation created successfully.")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Failed to create evaluation."
      if (isApiError(err)) {
        if (err.status === 422) {
          const data = err.data as { errors?: Record<string, string[]>; message?: string }
          const fieldErrors = data?.errors
          if (fieldErrors) {
            msg = Object.values(fieldErrors).flat().join(" ")
          } else {
            msg = data?.message ?? msg
          }
        } else {
          msg = err.message ?? msg
        }
      }
      setApiError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full flex flex-col overflow-y-auto sm:max-w-2xl border-l border-white/10 bg-[oklch(0.18_0.02_260)] text-white">
        <SheetHeader>
          <SheetTitle>New Evaluation</SheetTitle>
          <SheetDescription>Fill in the details to create a new evaluation.</SheetDescription>
        </SheetHeader>

        <form id="evaluation-form" onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-6 py-4">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select
              value={selectedDepartmentId || "__none__"}
              onValueChange={(value) => setSelectedDepartmentId(value === "__none__" ? "" : value)}
              disabled={loadingDepartments}
            >
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                {loadingDepartments ? (
                  <span className="flex items-center gap-2 text-white/50">
                    <Loader2Icon className="h-4 w-4 animate-spin" /> Loading departments…
                  </span>
                ) : (
                  <SelectValue placeholder="Select department…" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select department —</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User selector */}
          <div className="space-y-1.5">
            <Label>User</Label>
            <Select
              value={selectedUserId || "__none__"}
              onValueChange={(v) => setSelectedUserId(v === "__none__" ? "" : v)}
              disabled={!selectedDepartmentId || loadingUsers}
            >
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                {!selectedDepartmentId ? (
                  <span className="text-white/40">Select a department first…</span>
                ) : loadingUsers ? (
                  <span className="flex items-center gap-2 text-white/50">
                    <Loader2Icon className="h-4 w-4 animate-spin" /> Loading users…
                  </span>
                ) : (
                  <SelectValue placeholder="Select user…" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select user —</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                    {u.department && (
                      <span className="ml-1 text-white/40">({u.department.name})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDepartmentId && !loadingUsers && users.length === 0 && (
              <p className="text-xs text-amber-400">No users found for this department.</p>
            )}
          </div>

          {/* Course type */}
          <div className="space-y-1.5">
            <Label>Course Type</Label>
            <Select
              value={courseType}
              onValueChange={(v) => setCourseType(v as CourseType)}
            >
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course selector */}
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select
              value={selectedCourseId || "__none__"}
              onValueChange={(v) => setSelectedCourseId(v === "__none__" ? "" : v)}
              disabled={!selectedUserId || loadingCourses}
            >
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                {loadingCourses ? (
                  <span className="flex items-center gap-2 text-white/50">
                    <Loader2Icon className="h-4 w-4 animate-spin" /> Loading courses…
                  </span>
                ) : (
                  <SelectValue placeholder="Select course…" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select course —</SelectItem>
                {availableCourses.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUserId && !loadingCourses && availableCourses.length === 0 && (
              <p className="text-xs text-amber-400">No {courseType} courses assigned to this user.</p>
            )}
          </div>

          {/* Scores */}
          <div className="space-y-1.5">
            <Label>Scores</Label>
            <ScoreRowsEditor
              rows={scores}
              availableTypes={availableTypes}
              onChange={setScores}
              disabled={isSubmitting}
            />
          </div>

          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
        </form>

        <SheetFooter className="px-6 pb-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} form="evaluation-form">
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Create Evaluation
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
