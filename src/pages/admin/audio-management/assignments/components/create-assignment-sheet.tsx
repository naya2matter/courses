// ─── Create Assignment Sheet ────────────────────────────────────────────────
// Form sheet for creating audio assignments.
// Backend contract requires: audio_id + user_ids[].

import { useEffect, useMemo, useState } from "react"
import { Loader2Icon, AlertCircleIcon, UsersIcon, HeadphonesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { isApiError } from "@/lib/api"
import { getAllAudio } from "../../audio/service/audio.service"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import type { AudioResource } from "../../audio/types/audio.types"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"
import type { CreateAssignmentPayload, CreateAssignmentResult } from "../types/assignment.types"

interface CreateAssignmentSheetProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateAssignmentPayload) => Promise<CreateAssignmentResult>
}

export function CreateAssignmentSheet({ open, onClose, onSubmit }: CreateAssignmentSheetProps) {
  const [audioOptions, setAudioOptions] = useState<AudioResource[]>([])
  const [userOptions, setUserOptions] = useState<UserListResource[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  const [audioId, setAudioId] = useState<string>("")
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [sendNotification, setSendNotification] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Load audio/user options each time sheet opens so data stays fresh.
  useEffect(() => {
    if (!open) return

    async function loadOptions() {
      setIsLoadingOptions(true)
      setSubmitError(null)
      try {
        const [audiosResponse, usersResponse] = await Promise.all([
          getAllAudio({ page: 1, per_page: 100 }),
          getAllUsers({ page: 1, per_page: 100 }),
        ])

        setAudioOptions(audiosResponse.data)
        setUserOptions(usersResponse.data)
      } catch (err) {
        // Ignore only canceled requests.
        if (err instanceof DOMException && err.name === "AbortError") return

        if (isApiError(err)) setSubmitError(err.message || "Failed to load form options.")
        else if (err instanceof Error) setSubmitError(err.message)
        else setSubmitError("Failed to load form options.")
      } finally {
        setIsLoadingOptions(false)
      }
    }

    // Reset local form state each open.
    setAudioId("")
    setSelectedUserIds([])
    setUserSearch("")
    setSendNotification(true)
    setSubmitSuccess(null)

    loadOptions()
  }, [open])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return userOptions
    return userOptions.filter((user) =>
      user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q),
    )
  }, [userOptions, userSearch])

  function toggleUser(userId: number) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    const parsedAudioId = Number.parseInt(audioId, 10)
    if (!Number.isFinite(parsedAudioId) || parsedAudioId <= 0) {
      setSubmitError("Please select an audio item.")
      return
    }
    if (selectedUserIds.length === 0) {
      setSubmitError("Please select at least one user.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await onSubmit({
        audio_id: parsedAudioId,
        user_ids: selectedUserIds,
        send_notification: sendNotification,
      })

      const skipped = result.skippedUserIds.length
      setSubmitSuccess(
        skipped > 0
          ? `Assignment created. ${skipped} user(s) were already assigned and skipped.`
          : "Assignment created successfully.",
      )

      // Close after successful create to keep flow quick.
      onClose()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return

      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const first = Object.values(err.data.errors as Record<string, string[]>)[0]
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
      <SheetContent className="sm:max-w-xl p-6 sm:p-8">
        <SheetHeader>
          <SheetTitle>Create Audio Assignment</SheetTitle>
          <SheetDescription>
            Assign one audio item to one or more users.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert>
              <AlertDescription>{submitSuccess}</AlertDescription>
            </Alert>
          )}

          {/* Audio selector */}
          <div className="space-y-2">
            <Label className="inline-flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
              Audio
            </Label>
            <Select value={audioId} onValueChange={setAudioId} disabled={isLoadingOptions || isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingOptions ? "Loading audio..." : "Select audio"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {audioOptions.map((audio) => (
                  <SelectItem key={audio.id} value={String(audio.id)}>
                    {audio.title ?? audio.name ?? `Audio #${audio.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">Available: {audioOptions.length}</p>
          </div>

          {/* User multi-select with search */}
          <div className="space-y-2">
            <Label className="inline-flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              Users
            </Label>
            <Input
              className="w-full"
              placeholder="Search users by name or email"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              disabled={isLoadingOptions || isSubmitting}
            />

            <div className="max-h-72 overflow-auto rounded-lg border p-4">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found.</p>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => {
                    const checked = selectedUserIds.includes(user.id)
                    return (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleUser(user.id)}
                          disabled={isSubmitting}
                        />
                        <span className="text-sm">
                          <span className="block font-medium">{user.name}</span>
                          <span className="text-muted-foreground">{user.email}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} users · Selected: {selectedUserIds.length}
            </p>
          </div>

          {/* Notification toggle */}
          <label className="flex items-center gap-3 rounded-md border px-4 py-3 text-sm">
            <Checkbox
              checked={sendNotification}
              onCheckedChange={(value) => setSendNotification(Boolean(value))}
              disabled={isSubmitting}
            />
            Send assignment notification emails
          </label>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Create Assignment
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
