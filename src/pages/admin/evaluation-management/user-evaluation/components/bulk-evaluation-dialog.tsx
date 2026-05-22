// ─── BulkEvaluationDialog ────────────────────────────────────────────────────
// Dialog with two modes: Form mode (add multiple evaluations) and JSON mode.

import { useState, useEffect } from "react"
import { PlusIcon, Trash2Icon, Loader2Icon } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function BulkEvaluationDialog({ open, onOpenChange, availableTypes, onSuccess }: Props) {
  const [tab, setTab] = useState<"form" | "json">("form")
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  // Form mode state
  const [entries, setEntries] = useState<FormEntry[]>([])

  // JSON mode state
  const [jsonText, setJsonText] = useState("")

  const [apiError, setApiError] = useState<string | null>(null)
  const [result, setResult] = useState<EvaluationBulkCreateResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset on open
  useEffect(() => {
    if (!open) {
      setDepartments([])
      setEntries([])
      setJsonText("")
      setApiError(null)
      setResult(null)
      return
    }

    setLoadingDepartments(true)
    getAllDepartments()
      .then(({ departments }) => setDepartments(flattenDepartmentTree(departments)))
      .catch(() => {
        setApiError("Failed to load departments.")
      })
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
    updateEntry(key, {
      departmentId,
      userId: "",
      courseId: "",
      users: [],
      courses: [],
      loadingUsers: !!departmentId,
      loadingCourses: false,
    })

    if (!departmentId) {
      updateEntry(key, { loadingUsers: false })
      return
    }

    try {
      const users = await getEvaluationUsers({ department_id: departmentId })
      updateEntry(key, { users, loadingUsers: false })
    } catch {
      updateEntry(key, { users: [], loadingUsers: false })
    }
  }

  async function handleUserChange(key: number, userId: string, courseType: CourseType) {
    updateEntry(key, { userId, courseId: "", courses: [], loadingCourses: true })
    if (!userId) {
      updateEntry(key, { loadingCourses: false })
      return
    }
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
    return entries.map((entry) => {
      return {
        user_id: Number(entry.userId),
        department_id: Number(entry.departmentId),
        course_type: entry.courseType,
        ...(entry.courseType === "regular"
          ? { course_id: Number(entry.courseId) }
          : { course_online_id: Number(entry.courseId) }),
        scores: entry.scores,
      }
    })
  }

  async function handleSubmit() {
    setApiError(null)
    setResult(null)

    let evaluations: EvaluationCreatePayload[]

    if (tab === "json") {
      try {
        const parsed = JSON.parse(jsonText)
        evaluations = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        setApiError("Invalid JSON — please check your input.")
        return
      }
    } else {
      if (entries.length === 0) {
        setApiError("Add at least one evaluation entry.")
        return
      }
      if (entries.some((e) => !e.departmentId || !e.userId || !e.courseId)) {
        setApiError("All entries must have a department, user, and course selected.")
        return
      }
      evaluations = buildFormPayload()
    }

    setIsSubmitting(true)
    try {
      const res = await bulkCreateEvaluations({ evaluations })
      setResult(res)
      toast.success(`Bulk create done — ${res.created} created, ${res.updated} updated, ${res.failed} failed.`)
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
      <SheetContent side="right" className="w-full flex flex-col overflow-y-auto sm:max-w-3xl border-l border-white/10 bg-[oklch(0.18_0.02_260)] text-white">
        <SheetHeader>
          <SheetTitle>Bulk Create Evaluations</SheetTitle>
          <SheetDescription>Import multiple evaluations using the form or JSON payload.</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "form" | "json")} className="mt-4">
            <TabsList className="border border-white/10 bg-white/5">
              <TabsTrigger value="form" className="data-[state=active]:bg-white/10 text-white">
                Form Mode
              </TabsTrigger>
              <TabsTrigger value="json" className="data-[state=active]:bg-white/10 text-white">
                JSON Mode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="mt-4 space-y-4">
              {entries.map((entry) => (
                <div key={entry.key} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/60">Entry</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/40 hover:text-red-400"
                      onClick={() => removeEntry(entry.key)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Department</Label>
                    <Select
                      value={entry.departmentId || "__none__"}
                      onValueChange={(value) =>
                        handleDepartmentChange(entry.key, value === "__none__" ? "" : value)
                      }
                      disabled={loadingDepartments}
                    >
                      <SelectTrigger className="border-white/10 bg-white/5 text-white">
                        {loadingDepartments ? (
                          <span className="flex items-center gap-1 text-white/50">
                            <Loader2Icon className="h-3 w-3 animate-spin" /> Loading departments…
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

                  <div className="space-y-1">
                    <Label className="text-xs">User</Label>
                    <Select
                      value={entry.userId || "__none__"}
                      onValueChange={(v) =>
                        handleUserChange(entry.key, v === "__none__" ? "" : v, entry.courseType)
                      }
                      disabled={!entry.departmentId || entry.loadingUsers}
                    >
                      <SelectTrigger className="border-white/10 bg-white/5 text-white">
                        {!entry.departmentId ? (
                          <span className="text-white/40">Select a department first…</span>
                        ) : entry.loadingUsers ? (
                          <span className="flex items-center gap-1 text-white/50">
                            <Loader2Icon className="h-3 w-3 animate-spin" /> Loading users…
                          </span>
                        ) : (
                          <SelectValue placeholder="Select user…" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Select user —</SelectItem>
                        {entry.users.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {entry.departmentId && !entry.loadingUsers && entry.users.length === 0 && (
                      <p className="text-xs text-amber-400">No users found for this department.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Course Type</Label>
                      <Select
                        value={entry.courseType}
                        onValueChange={(v) =>
                          handleCourseTypeChange(entry.key, entry.userId, v as CourseType)
                        }
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

                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Course</Label>
                      <Select
                        value={entry.courseId || "__none__"}
                        onValueChange={(v) =>
                          updateEntry(entry.key, { courseId: v === "__none__" ? "" : v })
                        }
                        disabled={!entry.userId || entry.loadingCourses}
                      >
                        <SelectTrigger className="border-white/10 bg-white/5 text-white">
                          {entry.loadingCourses ? (
                            <span className="flex items-center gap-1 text-white/50">
                              <Loader2Icon className="h-3 w-3 animate-spin" /> Loading…
                            </span>
                          ) : (
                            <SelectValue placeholder="Select course…" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Select course —</SelectItem>
                          {entry.courses.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Scores</Label>
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
                className="gap-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <PlusIcon className="h-4 w-4" />
                Add Entry
              </Button>
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <div className="space-y-2">
                <Label>Paste JSON array of evaluation objects</Label>
                <Textarea
                  rows={12}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`[\n  {\n    "user_id": 1,\n    "department_id": 2,\n    "course_type": "regular",\n    "course_id": 3,\n    "scores": [{ "evaluation_type_id": 1, "score_given": 4 }]\n  }\n]`}
                  className="border-white/10 bg-white/5 font-mono text-xs text-white placeholder:text-white/20"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {result && (
          <div className="px-6">
            <Alert className="border-emerald-500/30 bg-emerald-500/10">
              <AlertDescription className="text-emerald-300">
                Created: {result.created} · Updated: {result.updated} · Failed: {result.failed}
                {result.failed > 0 && result.errors && (
                  <pre className="mt-1 text-xs text-red-300 whitespace-pre-wrap">
                    {JSON.stringify(result.errors, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {apiError && (
          <div className="px-6 mt-4">
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          </div>
        )}

        <SheetFooter className="px-6 pb-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Close
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
