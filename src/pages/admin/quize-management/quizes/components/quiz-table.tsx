// ─── Quiz Table ───────────────────────────────────────────────────────────────
// Renders the list of quizzes in a styled table with action links.

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  EyeIcon,
  PlusIcon,
  ClockIcon,
  TargetIcon,
  ListChecksIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  EllipsisVerticalIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { deleteQuiz } from "../service/quiz.service"
import { isApiError } from "@/lib/api"
import type { QuizResource, QuizStatus } from "../types/quiz.types"

// ── Status badge helpers ──────────────────────────────────────────────────────

const STATUS_STYLES: Record<QuizStatus, string> = {
  draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived: "bg-slate-500/15 text-slate-400 border-slate-500/30",
}

const STATUS_LABELS: Record<QuizStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "draft") as QuizStatus
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[s] ?? STATUS_STYLES.draft}`}
    >
      {STATUS_LABELS[s] ?? status}
    </span>
  )
}

// ── QuizTable ─────────────────────────────────────────────────────────────────

interface QuizTableProps {
  quizzes: QuizResource[]
  isLoading: boolean
  onDeleted?: (id: number) => void
}

export function QuizTable({ quizzes, isLoading, onDeleted }: QuizTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/2 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                {["Title", "Status", "Questions", "Pass %", "Time (min)", "Max Attempts", "Deadline", "Actions"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-30" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Row-level delete state ─────────────────────────────────────────────
  // We declare this inside a wrapper so hooks run unconditionally.
  return <QuizTableBody quizzes={quizzes} onDeleted={onDeleted} />

  if (quizzes.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/2 py-16 text-center">
        <ListChecksIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-base font-medium text-muted-foreground">No quizzes found</p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          Adjust your filters or create a new quiz.
        </p>
        <Button asChild className="mt-5">
          <Link to="/admin/quiz-management/quizzes/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Quiz
          </Link>
        </Button>
      </div>
    )
  }
}

// ── Inner table body (needs hooks so must be its own component) ──────────────────

function QuizTableBody({
  quizzes,
  onDeleted,
}: {
  quizzes: QuizResource[]
  onDeleted?: (id: number) => void
}) {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<QuizResource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteQuiz(deleteTarget.id)
      toast.success(`"${deleteTarget.title}" deleted.`)
      onDeleted?.(deleteTarget.id)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let message = "Failed to delete quiz."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message
      toast.error(message)
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (quizzes.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/2 py-16 text-center">
        <ListChecksIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-base font-medium text-muted-foreground">No quizzes found</p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          Adjust your filters or create a new quiz.
        </p>
        <Button asChild className="mt-5">
          <Link to="/admin/quiz-management/quizzes/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Quiz
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/2 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Questions</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pass %</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" /> Time (min)
                </span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Max Attempts</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => {
              const questionCount =
                quiz.questions_count ?? quiz.questions?.length ?? 0
              const deadline = quiz.deadline
                ? new Date(quiz.deadline).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"

              return (
                <tr
                  key={quiz.id}
                  className="border-b border-white/5 cursor-pointer"
                  onClick={(event) => {
                    const target = event.target as HTMLElement
                    if (target.closest("button, a")) return
                    navigate(`/admin/quiz-management/quizzes/${quiz.id}`)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return
                    const target = event.target as HTMLElement
                    if (target.closest("button, a")) return
                    event.preventDefault()
                    navigate(`/admin/quiz-management/quizzes/${quiz.id}`)
                  }}
                  tabIndex={0}
                  role="button"
                >
                  {/* Title */}
                  <td className="px-4 py-3">
                    <div className="max-w-55">
                      <p className="font-medium text-foreground truncate" title={quiz.title}>
                        {quiz.title}
                      </p>
                      {quiz.description && (
                        <p
                          className="mt-0.5 text-xs text-muted-foreground/70 truncate"
                          title={quiz.description}
                        >
                          {quiz.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={quiz.status} />
                  </td>

                  {/* Questions */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ListChecksIcon className="h-3.5 w-3.5 shrink-0" />
                      {questionCount}
                    </span>
                  </td>

                  {/* Pass threshold */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <TargetIcon className="h-3.5 w-3.5 shrink-0" />
                      {quiz.pass_threshold != null ? `${quiz.pass_threshold}%` : "—"}
                    </span>
                  </td>

                  {/* Time limit */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {quiz.time_limit_minutes != null ? quiz.time_limit_minutes : "—"}
                  </td>

                  {/* Max attempts */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {quiz.max_attempts != null ? quiz.max_attempts : "—"}
                  </td>

                  {/* Deadline */}
                  <td className="px-4 py-3 text-muted-foreground text-xs">{deadline}</td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-white/10"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <EllipsisVerticalIcon className="h-4 w-4" />
                          <span className="sr-only">Quiz actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/admin/quiz-management/quizzes/${quiz.id}`)
                          }}
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/admin/quiz-management/quizzes/${quiz.id}/edit`)
                          }}
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeleteTarget(quiz)
                          }}
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete{" "}
              <span className="font-medium text-foreground">{deleteTarget?.title}</span>.
              It will no longer be visible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
              ) : (
                "Yes, delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
