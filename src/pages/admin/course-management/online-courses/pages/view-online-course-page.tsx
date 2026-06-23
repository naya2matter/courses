// ─── View Online Course Page ─────────────────────────────────────────────────
// Full page that displays the online course detail tree (modules + contents).
// Also provides Delete (with 422 guard) and Reorder Modules operations.

import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeftIcon,
  Loader2Icon,
  AlertCircleIcon,
  PencilIcon,
  XIcon,
  Trash2Icon,
  GripVerticalIcon,
  CheckIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog"
import { isApiError } from "@/lib/api"

import { deleteOnlineCourse, reorderModules } from "../service/online-course.service"
import { useOnlineCourseStore } from "../store/online-course.store"
import { OnlineCourseDetailView } from "../components/online-course-detail-drawer"
import { OnlineCourseEnrollmentsSection } from "../components/online-course-enrollments-section"
import type { OnlineCourseModule } from "../types/online-course.types"

function statusBadgeClass(status: string): string {
  switch (status) {
    case "published":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    case "draft":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30"
    case "archived":
      return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
    default:
      return "bg-white/10 text-white/60 border-white/10"
  }
}

function SortableModuleRow({ module: mod, index }: { module: OnlineCourseModule; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-4 py-3 ${
        isDragging ? "z-10 opacity-80" : ""
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-xs font-bold tabular-nums">
        {index + 1}
      </span>

      <p className="flex-1 min-w-0 text-sm font-medium truncate">
        {mod.name}
      </p>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 cursor-grab active:cursor-grabbing text-muted-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="h-4 w-4" />
        <span className="sr-only">Drag to reorder module</span>
      </Button>
    </div>
  )
}

export default function ViewOnlineCoursePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const lastErrorToastRef = useRef<string | null>(null)

  const currentCourse = useOnlineCourseStore((s) => s.currentCourse)
  const isLoadingDetail = useOnlineCourseStore((s) => s.isLoadingDetail)
  const detailError = useOnlineCourseStore((s) => s.detailError)
  const fetchCourseById = useOnlineCourseStore((s) => s.fetchCourseById)
  const clearDetailError = useOnlineCourseStore((s) => s.clearDetailError)

  // ── Delete state ────────────────────────────────────────────────────────────
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Reorder state ───────────────────────────────────────────────────────────
  const [isReorderOpen, setIsReorderOpen] = useState(false)
  const [reorderList, setReorderList] = useState<OnlineCourseModule[]>([])
  const [isReorderSaving, setIsReorderSaving] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)

  const reorderSensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
  )

  useEffect(() => {
    const courseId = Number(id)
    if (!isNaN(courseId)) fetchCourseById(courseId)
  }, [id, fetchCourseById])

  useEffect(() => {
    if (!detailError) {
      lastErrorToastRef.current = null
      return
    }
    if (lastErrorToastRef.current === detailError) return
    lastErrorToastRef.current = detailError
    toast.error(detailError)
  }, [detailError])

  // ── Delete handlers ─────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    const courseId = Number(id)
    if (isNaN(courseId)) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteOnlineCourse(courseId)
      toast.success("Course deleted successfully.")
      navigate("/admin/course-management/online-courses")
    } catch (err) {
      let msg = "Failed to delete course. Please try again."
      if (isApiError(err)) {
        msg =
          err.status === 422
            ? "This course has active user assignments. Please unassign all users before deleting."
            : err.message || msg
      } else if (err instanceof Error) {
        msg = err.message
      }
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Reorder handlers ────────────────────────────────────────────────────────

  function openReorder() {
    if (!currentCourse?.modules?.length) return
    const sorted = [...currentCourse.modules].sort(
      (a, b) => a.order_number - b.order_number,
    )
    setReorderList(sorted)
    setReorderError(null)
    setIsReorderOpen(true)
  }

  function handleReorderDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setReorderList((prev) => {
      const oldIndex = prev.findIndex((m) => m.id === Number(active.id))
      const newIndex = prev.findIndex((m) => m.id === Number(over.id))
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  async function handleReorderSave() {
    setIsReorderSaving(true)
    setReorderError(null)
    try {
      const payload = {
        order: reorderList.map((m, i) => ({
          module_id: m.id,
          order_number: i + 1,
        })),
      }
      await reorderModules(payload)
      toast.success("Modules reordered successfully.")
      const courseId = Number(id)
      if (!isNaN(courseId)) fetchCourseById(courseId)
      setIsReorderOpen(false)
    } catch (err) {
      let msg = "Failed to reorder modules. Please try again."
      if (isApiError(err)) msg = err.message || msg
      else if (err instanceof Error) msg = err.message
      setReorderError(msg)
    } finally {
      setIsReorderSaving(false)
    }
  }

  function handleBack() {
    navigate("/admin/course-management/online-courses")
  }

  const canReorder = (currentCourse?.modules?.length ?? 0) >= 2

  return (
    <div className="space-y-6">
      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-5 sm:p-6">
        {/* subtle indigo radial accent */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.10),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mt-0.5 shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
              aria-label="Back to online courses"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white wrap-break-word">
                  {currentCourse ? currentCourse.name : "Online Course"}
                </h1>
                {currentCourse && (
                  <Badge className={`text-[11px] border ${statusBadgeClass(currentCourse.status)}`}>
                    {currentCourse.status}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-white/45">
                Course details and content
              </p>
            </div>
          </div>

          {currentCourse && (
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              {canReorder && (
                <Button
                  variant="outline"
                  onClick={openReorder}
                  className="gap-2 border-white/10 bg-white/5 hover:bg-white/10"
                >
                  <GripVerticalIcon className="h-4 w-4" />
                  Reorder Modules
                </Button>
              )}
              <Button
                onClick={() =>
                  navigate(`/admin/course-management/online-courses/edit/${id}`)
                }
                className="gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Course
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteError(null)
                  setIsDeleteOpen(true)
                }}
                className="gap-2"
              >
                <Trash2Icon className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────────── */}
      {detailError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <div>
              <AlertTitle>Failed to load course</AlertTitle>
              <AlertDescription>{detailError}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={clearDetailError}
              aria-label="Dismiss error"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────────── */}
      {isLoadingDetail && (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Detail view ───────────────────────────────────────────────────────── */}
      <OnlineCourseDetailView
        course={currentCourse}
        isLoading={isLoadingDetail}
        detailError={detailError}
      />

      {/* ── Enrolled Users section ────────────────────────────────────────────── */}
      {currentCourse && !isLoadingDetail && (
        <OnlineCourseEnrollmentsSection courseId={Number(id)} />
      )}

      {/* ── Delete dialog ──────────────────────────────────────────────────────── */}
      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteOpen(false)
            setDeleteError(null)
          }
        }}
        title="Delete this course?"
        description={
          currentCourse
            ? `"${currentCourse.name}" will be permanently removed. If it has active user assignments, deletion will be blocked — unassign all users first.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Course"
        isLoading={isDeleting}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
      />

      {/* ── Reorder Modules dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={isReorderOpen}
        onOpenChange={(open) => {
          if (!open && !isReorderSaving) setIsReorderOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reorder Modules</DialogTitle>
            <DialogDescription>
              Drag modules into the order you want. Changes are saved when you
              click "Save Order".
            </DialogDescription>
          </DialogHeader>

          {/* Module list */}
          <DndContext
            sensors={reorderSensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleReorderDragEnd}
          >
            <SortableContext
              items={reorderList.map((mod) => mod.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-[60vh] overflow-y-auto py-1">
                {reorderList.map((mod, idx) => (
                  <SortableModuleRow key={mod.id} module={mod} index={idx} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Error */}
          {reorderError && (
            <Alert variant="destructive" className="mt-1">
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              <AlertDescription>{reorderError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReorderOpen(false)}
              disabled={isReorderSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReorderSave}
              disabled={isReorderSaving}
              className="gap-2"
            >
              {isReorderSaving ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Save Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
