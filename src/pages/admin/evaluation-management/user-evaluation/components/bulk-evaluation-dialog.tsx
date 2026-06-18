// ─── BulkEvaluationDialog ────────────────────────────────────────────────────
// Dialog (not Sheet) for bulk-creating multiple evaluations using the form.

import { useState, useEffect, useMemo } from "react"
import { PlusIcon, Trash2Icon, Loader2Icon, Users2Icon, SearchIcon } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { isApiError } from "@/lib/api"
import { getAllDepartments } from "@/pages/admin/user-management/departments/service/department.service"
import type { Department } from "@/pages/admin/user-management/departments/types/department.types"
import { bulkCreateEvaluations, getEvaluationUsers, getUserAssignedCourses } from "../service/evaluation.service"
import type {
  EvaluationCreatePayload,
  EvaluationBulkCreateResponse,
  EvaluationUserWithCourses,
  AssignedCourse,
  CourseType,
  EvaluationScorePayload,
} from "../types/evaluation.types"
import type { EvaluationType } from "./score-rows-editor"
import { ScoreRowsEditor } from "./score-rows-editor"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTypes: EvaluationType[]
  onSuccess: () => void
}

interface FormEntry {
  key: number
  departmentId: string
  userId: string
  courseType: CourseType
  courseId: string
  users: EvaluationUserWithCourses[]
  loadingUsers: boolean
  scores: EvaluationScorePayload[]
  courses: AssignedCourse[]
  loadingCourses: boolean
}

let keyCounter = 0
function nextKey() {
  return ++keyCounter
}

function flattenDepartmentTree(nodes: Department[]): Department[] {
  const items: Department[] = []
  for (const node of nodes) {
    items.push(node)
    if (node.children?.length) {
      items.push(...flattenDepartmentTree(node.children))
    }
  }
  return items
}

// ── Searchable select (sticky search inside the dropdown) ─────────────────────

interface Option {
  value: string
  label: string
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
  loading,
  loadingLabel = "Loading…",
}: {
  value: string
  onValueChange: (v: string) => void
  options: Option[]
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
}) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  return (
    <Select
      value={value || "__none__"}
      onValueChange={(v) => onValueChange(v === "__none__" ? "" : v)}
      disabled={disabled}
      onOpenChange={(o) => { if (!o) setSearch("") }}
    >
      <SelectTrigger className="h-9 text-sm">
        {loading ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> {loadingLabel}
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent className="max-h-[320px]" position="popper" sideOffset={4}>
        <div className="sticky top-0 z-10 bg-popover px-2 pt-2 pb-1">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
            />
          </div>
        </div>
        <SelectItem value="__none__">{placeholder}</SelectItem>
        {filtered.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">No results found.</p>
        )}
      </SelectContent>
    </Select>
  )
}

export function BulkEvaluationDialog({ open, onOpenChange, availableTypes, onSuccess }: Props) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [entries, setEntries] = useState<FormEntry[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [result, setResult] = useState<EvaluationBulkCreateResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset and load departments on open
  useEffect(() => {
    if (!open) {
      setEntries([])
      setApiError(null)
      setResult(null)
      return
    }
    setLoadingDepartments(true)
    getAllDepartments()
      .then(({ departments }) => setDepartments(flattenDepartmentTree(departments)))
      .catch(() => setApiError("Failed to load departments."))
      .finally(() => setLoadingDepartments(false))
  }, [open])

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      {
        key: nextKey(),
        departmentId: "",
        userId: "",
        courseType: "regular",
        courseId: "",
        users: [],
        loadingUsers: false,
        scores: [],
        courses: [],
        loadingCourses: false,
      },
    ])
  }

  function removeEntry(key: number) {
    setEntries((prev) => prev.filter((e) => e.key !== key))
  }

  function updateEntry(key: number, patch: Partial<FormEntry>) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)))
  }

  async function handleDepartmentChange(key: number, departmentId: string) {
    updateEntry(key, { departmentId, userId: "", courseId: "", users: [], courses: [], loadingUsers: !!departmentId })
    if (!departmentId) { updateEntry(key, { loadingUsers: false }); return }
    try {
      const users = await getEvaluationUsers({ department_id: departmentId })
      updateEntry(key, { users, loadingUsers: false })
    } catch {
      updateEntry(key, { users: [], loadingUsers: false })
    }
  }

  async function handleUserChange(key: number, userId: string, courseType: CourseType) {
    updateEntry(key, { userId, courseId: "", courses: [], loadingCourses: true })
    if (!userId) { updateEntry(key, { loadingCourses: false }); return }
    try {
      const res = await getUserAssignedCourses(Number(userId), courseType)
      const list = courseType === "regular" ? res.regular_courses : res.online_courses
      updateEntry(key, { courses: list ?? [], loadingCourses: false })
    } catch {
      updateEntry(key, { loadingCourses: false })
    }
  }

  async function handleCourseTypeChange(key: number, userId: string, courseType: CourseType) {
    updateEntry(key, { courseType, courseId: "", courses: [], loadingCourses: !!userId })
    if (!userId) return
    try {
      const res = await getUserAssignedCourses(Number(userId), courseType)
      const list = courseType === "regular" ? res.regular_courses : res.online_courses
      updateEntry(key, { courses: list ?? [], loadingCourses: false })
    } catch {
      updateEntry(key, { loadingCourses: false })
    }
  }

  function buildFormPayload(): EvaluationCreatePayload[] {
    return entries.map((entry) => ({
      user_id: Number(entry.userId),
      department_id: Number(entry.departmentId),
      course_type: entry.courseType,
      ...(entry.courseType === "regular"
        ? { course_id: Number(entry.courseId) }
        : { course_online_id: Number(entry.courseId) }),
      scores: entry.scores,
    }))
  }

  async function handleSubmit() {
    setApiError(null)
    setResult(null)
    if (entries.length === 0) { setApiError("Add at least one evaluation entry."); return }
    if (entries.some((e) => !e.departmentId || !e.userId || !e.courseId)) {
      setApiError("All entries must have a department, user, and course selected.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await bulkCreateEvaluations({ evaluations: buildFormPayload() })
      setResult(res)
      toast.success(`Done — ${res.created} created, ${res.updated} updated, ${res.failed} failed.`)
      onSuccess()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Bulk create failed."
      if (isApiError(err)) msg = err.message ?? msg
      setApiError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        {/* Header */}
        <SheetHeader className="shrink-0 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Users2Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">Bulk Create Evaluations</SheetTitle>
              <SheetDescription className="text-xs">
                Add multiple evaluation entries and submit them all at once.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body (native overflow — reliable height handling) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {entries.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center text-muted-foreground">
                <Users2Icon className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">No entries yet. Click "Add Entry" to begin.</p>
              </div>
            )}

            {entries.map((entry, idx) => (
              <div key={entry.key} className="rounded-xl border bg-card/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Entry {idx + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeEntry(entry.key)}
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Separator />

                {/* Department */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Department</Label>
                  <SearchableSelect
                    value={entry.departmentId}
                    onValueChange={(v) => handleDepartmentChange(entry.key, v)}
                    options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
                    placeholder="Select department…"
                    searchPlaceholder="Search departments…"
                    disabled={loadingDepartments}
                    loading={loadingDepartments}
                  />
                </div>

                {/* User */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">User</Label>
                  <SearchableSelect
                    value={entry.userId}
                    onValueChange={(v) => handleUserChange(entry.key, v, entry.courseType)}
                    options={entry.users.map((u) => ({
                      value: String(u.id),
                      label: u.email ? `${u.name} (${u.email})` : u.name,
                    }))}
                    placeholder={entry.departmentId ? "Select user…" : "Select a department first"}
                    searchPlaceholder="Search users…"
                    disabled={!entry.departmentId || entry.loadingUsers}
                    loading={entry.loadingUsers}
                    loadingLabel="Loading users…"
                  />
                  {entry.departmentId && !entry.loadingUsers && entry.users.length === 0 && (
                    <p className="text-xs text-amber-500">No users found for this department.</p>
                  )}
                </div>

                {/* Course type + Course */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Course Type</Label>
                    <Select
                      value={entry.courseType}
                      onValueChange={(v) =>
                        handleCourseTypeChange(entry.key, entry.userId, v as CourseType)
                      }
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Course</Label>
                    <SearchableSelect
                      value={entry.courseId}
                      onValueChange={(v) => updateEntry(entry.key, { courseId: v })}
                      options={entry.courses.map((c) => ({ value: String(c.id), label: c.name }))}
                      placeholder={entry.userId ? "Select course…" : "Select a user first"}
                      searchPlaceholder="Search courses…"
                      disabled={!entry.userId || entry.loadingCourses}
                      loading={entry.loadingCourses}
                    />
                  </div>
                </div>

                {/* Scores */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Scores</Label>
                  <ScoreRowsEditor
                    rows={entry.scores}
                    availableTypes={availableTypes}
                    onChange={(rows) => updateEntry(entry.key, { scores: rows })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEntry}
              className="gap-1.5"
            >
              <PlusIcon className="h-4 w-4" />
              Add Entry
            </Button>

            {/* Result */}
            {result && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10">
                <AlertDescription className="text-emerald-600 dark:text-emerald-300">
                  Created: {result.created} · Updated: {result.updated} · Failed: {result.failed}
                  {result.failed > 0 && result.errors && (
                    <pre className="mt-1 text-xs text-red-500 whitespace-pre-wrap">
                      {JSON.stringify(result.errors, null, 2)}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {apiError && (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Submit Bulk
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
