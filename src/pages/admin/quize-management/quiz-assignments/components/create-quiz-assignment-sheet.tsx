// ─── Create Quiz Assignment Sheet ────────────────────────────────────────────
// Form sheet for assigning a quiz to one or more users.
// Backend: POST /admin/quiz-assignments/create
//   body: { quiz_id, user_ids[], send_notification }

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircleIcon,
  CheckIcon,
  CheckSquareIcon,
  ClipboardListIcon,
  Loader2Icon,
  SquareIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { isApiError } from "@/lib/api"
import { getAllQuizzes } from "../../quizes/service/quiz.service"
import { getAllUsersUnpaginated } from "@/pages/admin/user-management/users/service/user.service"
import type { QuizResource } from "../../quizes/types/quiz.types"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"
import type {
  CreateQuizAssignmentPayload,
  CreateQuizAssignmentResult,
} from "../types/quiz-assignment.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreateQuizAssignmentSheetProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateQuizAssignmentPayload) => Promise<CreateQuizAssignmentResult>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateQuizAssignmentSheet({
  open,
  onClose,
  onSubmit,
}: CreateQuizAssignmentSheetProps) {
  const [quizOptions, setQuizOptions] = useState<QuizResource[]>([])
  const [userOptions, setUserOptions] = useState<UserListResource[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const [quizId, setQuizId] = useState<string>("")
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [sendNotification, setSendNotification] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load options whenever the sheet opens.
  useEffect(() => {
    if (!open) return

    // Reset form state.
    setQuizId("")
    setSelectedUserIds([])
    setUserSearch("")
    setSendNotification(true)
    setSubmitError(null)

    async function loadOptions() {
      setIsLoadingOptions(true)
      try {
        const [quizzesResponse, users] = await Promise.all([
          getAllQuizzes({ page: 1, per_page: 100, status: "published" }),
          getAllUsersUnpaginated(),
        ])
        setQuizOptions(quizzesResponse.data)
        setUserOptions(users)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        if (isApiError(err)) setSubmitError(err.message || "Failed to load form data.")
        else if (err instanceof Error) setSubmitError(err.message)
        else setSubmitError("Failed to load form data.")
      } finally {
        setIsLoadingOptions(false)
      }
    }

    loadOptions()
  }, [open])

  // Filter the user list by search query.
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return userOptions
    return userOptions.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [userOptions, userSearch])

  function toggleUser(userId: number) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  function toggleAll() {
    const filteredIds = filteredUsers.map((u) => u.id)
    const allSelected = filteredIds.every((id) => selectedUserIds.includes(id))
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)))
    } else {
      setSelectedUserIds((prev) => [...new Set([...prev, ...filteredIds])])
    }
  }

  const selectedQuiz = quizOptions.find((q) => String(q.id) === quizId) ?? null
  const filteredAllSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUserIds.includes(u.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const parsedQuizId = Number.parseInt(quizId, 10)
    if (!Number.isFinite(parsedQuizId) || parsedQuizId <= 0) {
      setSubmitError("Please select a quiz.")
      return
    }
    if (selectedUserIds.length === 0) {
      setSubmitError("Please select at least one user.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await onSubmit({
        quiz_id: parsedQuizId,
        user_ids: selectedUserIds,
        send_notification: sendNotification,
      })

      const skipped = result.skippedUserIds.length
      if (skipped > 0) {
        // Don't close — show info so admin is aware.
        setSubmitError(null)
      }
      onClose()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return

      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const first = Object.values(
            err.data.errors as Record<string, string[]>,
          )[0]
          setSubmitError(Array.isArray(first) ? first[0] : "Validation error.")
        } else {
          setSubmitError(err.message || "Failed to create assignment.")
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message)
      } else {
        setSubmitError("Failed to create assignment.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0 border-l border-white/10">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 py-5 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ClipboardListIcon className="h-5 w-5 text-primary" />
            Assign Quiz
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Select a quiz and one or more users to assign. Optionally send a
            notification.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* ── Error alert ────────────────────────────────────────────── */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <div className="flex w-full items-start justify-between gap-2">
                  <AlertDescription>{submitError}</AlertDescription>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 -mt-0.5"
                    onClick={() => setSubmitError(null)}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Alert>
            )}

            {/* ── Quiz selector ───────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <ClipboardListIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Quiz
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={quizId}
                onValueChange={setQuizId}
                disabled={isLoadingOptions || isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingOptions ? "Loading quizzes…" : "Select a quiz"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {quizOptions.map((quiz) => (
                    <SelectItem key={quiz.id} value={String(quiz.id)}>
                      <span className="truncate">{quiz.title}</span>
                    </SelectItem>
                  ))}
                  {quizOptions.length === 0 && !isLoadingOptions && (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      No published quizzes available.
                    </div>
                  )}
                </SelectContent>
              </Select>

              {selectedQuiz && (
                <div className="rounded-lg bg-muted/50 border px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                  {selectedQuiz.questions_count != null && (
                    <p>{selectedQuiz.questions_count} question(s)</p>
                  )}
                  {selectedQuiz.time_limit_minutes != null && (
                    <p>Time limit: {selectedQuiz.time_limit_minutes} min</p>
                  )}
                  {selectedQuiz.pass_threshold != null && (
                    <p>Pass threshold: {selectedQuiz.pass_threshold}%</p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* ── User selector ───────────────────────────────────────────── */}
            <div className="space-y-2 flex flex-col min-h-0">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  Users
                  <span className="text-destructive">*</span>
                </Label>
                {selectedUserIds.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedUserIds.length} selected
                  </Badge>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users…"
                  className="pl-8 h-8 text-sm"
                  disabled={isLoadingOptions || isSubmitting}
                />
              </div>

              {/* Select all row */}
              {filteredUsers.length > 0 && (
                <div
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/60 select-none"
                  onClick={toggleAll}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggleAll()}
                >
                  {filteredAllSelected ? (
                    <CheckSquareIcon className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <SquareIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {filteredAllSelected ? "Deselect" : "Select"} all (
                    {filteredUsers.length})
                  </span>
                </div>
              )}

              {/* User list */}
              <div className="h-56 overflow-y-auto rounded-lg border bg-muted/20">
                {isLoadingOptions ? (
                  <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Loading users…
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No users match your search.
                  </div>
                ) : (
                  <div className="p-1">
                    {filteredUsers.map((user) => {
                      const selected = selectedUserIds.includes(user.id)
                      return (
                        <div
                          key={user.id}
                          className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors select-none ${
                            selected
                              ? "bg-primary/10 hover:bg-primary/15"
                              : "hover:bg-muted/60"
                          }`}
                          onClick={() => !isSubmitting && toggleUser(user.id)}
                          role="checkbox"
                          aria-checked={selected}
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" && !isSubmitting && toggleUser(user.id)
                          }
                        >
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              selected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {selected && (
                              <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-tight">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground leading-tight">
                              {user.email}
                            </p>
                          </div>
                          {selected && (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* ── Notification toggle ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
              <Checkbox
                id="send-notification"
                type="button"
                checked={sendNotification}
                onCheckedChange={(checked) => setSendNotification(!!checked)}
                disabled={isSubmitting}
              />
              <div className="space-y-0.5">
                <Label htmlFor="send-notification" className="text-sm font-medium cursor-pointer">
                  Send Notification
                </Label>
                <p className="text-xs text-muted-foreground">
                  Notify users by email after assignment.
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <SheetFooter className="px-6 py-4 border-t border-white/10 mt-auto bg-background/50 backdrop-blur-sm">
            <div className="flex w-full items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {selectedUserIds.length > 0 ? (
                  <span>
                    Assigning to{" "}
                    <span className="font-medium text-foreground">
                      {selectedUserIds.length}
                    </span>{" "}
                    user{selectedUserIds.length !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span>Select at least one user</span>
                )}
              </div>
              <div className="flex justify-end gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isLoadingOptions ||
                    !quizId ||
                    selectedUserIds.length === 0
                  }
                  className="min-w-[100px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Assigning…
                    </>
                  ) : (
                    <>
                      <CheckIcon className="mr-2 h-4 w-4" />
                      Assign Quiz
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
