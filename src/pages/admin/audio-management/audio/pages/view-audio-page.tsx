import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  Loader2Icon,
  Music2Icon,
  CalendarClockIcon,
  TagIcon,
  Clock3Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { getAdminAudioStreamBlobUrl, getAudioById } from "../service/audio.service"
import { formatDuration, formatFileSize } from "../service/audio-metadata"
import type { AudioResource } from "../types/audio.types"

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card/50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-sm text-foreground">
        {value ?? <span className="italic text-muted-foreground/70">—</span>}
      </p>
    </div>
  )
}

function formatBoolean(value?: boolean | null) {
  if (value == null) return "—"
  return value ? "Yes" : "No"
}

function formatTimestamp(value?: string | null) {
  return value ? <span className="inline-flex items-center gap-2"><CalendarClockIcon className="h-4 w-4 text-muted-foreground" />{new Date(value).toLocaleString()}</span> : null
}

function renderLink(value?: string | null) {
  if (!value?.trim()) return "—"
  return (
    <a className="text-primary underline break-all" href={value} target="_blank" rel="noreferrer">
      {value}
    </a>
  )
}

export function ViewAudioPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const audioId = Number(id)

  const [audio, setAudio] = useState<AudioResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stream state for the protected admin audio preview endpoint.
  const [streamUrl, setStreamUrl] = useState<string>("")
  const [isLoadingStream, setIsLoadingStream] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [streamReloadCount, setStreamReloadCount] = useState(0)

  const audioCategoryName = audio?.audio_category?.name ?? audio?.category

  useEffect(() => {
    if (!Number.isInteger(audioId) || audioId <= 0) {
      setError("Invalid audio id.")
      setIsLoading(false)
      return
    }

    async function run() {
      setIsLoading(true)
      setError(null)
      try {
        const detail = await getAudioById(audioId)
        setAudio(detail)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        if (isApiError(err)) {
          setError(err.status === 404 ? "Audio not found." : (err.message || "Failed to load audio."))
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Failed to load audio.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    run()
  }, [audioId])

  useEffect(() => {
    let activeObjectUrl: string | null = null
    const controller = new AbortController()

    const audioIdForStream = audio?.id
    if (audioIdForStream === undefined) {
      return
    }

    // Load the protected audio stream from the backend and create an
    // object URL that can be used in the native <audio> player.
    async function loadStream(audioId: number) {
      setIsLoadingStream(true)
      setStreamError(null)

      try {
        const url = await getAdminAudioStreamBlobUrl(audioId, controller.signal)
        activeObjectUrl = url
        setStreamUrl(url)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return

        if (isApiError(err)) {
          setStreamError(
            err.status === 404
              ? "Audio stream unavailable."
              : err.message || "Failed to load audio stream.",
          )
        } else if (err instanceof Error) {
          setStreamError(err.message)
        } else {
          setStreamError("Failed to load audio stream.")
        }
      } finally {
        setIsLoadingStream(false)
      }
    }

    loadStream(audioIdForStream)

    return () => {
      controller.abort()
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl)
      }
    }
  }, [audio?.id, streamReloadCount])

  const statusValue = typeof audio?.status === "string" ? audio.status.trim() : ""
  const statusObject = audio?.status && typeof audio.status !== "string" ? audio.status : null
  const resolvedMimeType = typeof audio?.mime_type === "string" ? audio.mime_type.trim() : ""
  const hasAudioFileLabel = formatBoolean(audio?.has_audio_file ?? null)
  const resolvedStreamUrl = typeof audio?.stream_url === "string" ? audio.stream_url.trim() : ""
  const thumbnailUrl = typeof audio?.thumbnail_path === "string" ? audio.thumbnail_path.trim() : ""
  const progress = audio?.progress ?? null
  const listeners = Array.isArray(audio?.listeners) ? audio.listeners : []
  const statusBadgeClass = statusValue === "active"
    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
    : statusValue === "completed"
    ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
    : ""

  const resolvedDuration = useMemo(() => {
    if (typeof audio?.duration === "string" && audio.duration.trim()) {
      return audio.duration
    }
    if (typeof audio?.duration === "number") {
      return formatDuration(audio.duration)
    }
    return "—"
  }, [audio?.duration])

  const resolvedFileSize = useMemo(() => {
    if (typeof audio?.file_size === "string" && audio.file_size.trim()) {
      return audio.file_size
    }
    if (typeof audio?.file_size === "number") {
      return formatFileSize(audio.file_size)
    }
    return "—"
  }, [audio?.file_size])

  const title = useMemo(
    () => audio?.title || audio?.name || `Audio #${audioId}`,
    [audio?.name, audio?.title, audioId],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audio Details</h1>
          <p className="mt-1 text-muted-foreground">Read-only overview for the selected audio item.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-fit">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>


      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border bg-card/50 py-20">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && audio && (
        <div className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Music2Icon className="h-3.5 w-3.5" />
                Audio
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground">ID #{audio.id}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {statusValue ? (
                <Badge variant={statusValue === "active" ? "default" : "secondary"} className={`capitalize ${statusBadgeClass}`}>
                  {statusValue}
                </Badge>
              ) : statusObject ? (
                <Badge variant="outline" className="capitalize text-sky-300 border-sky-500/20">
                  Status summary
                </Badge>
              ) : (
                <Badge variant="outline">No status</Badge>
              )}

              <Button asChild variant="outline" size="sm">
                <Link to={`/admin/audio-management/audio/edit/${audio.id}`} state={{ audio }}>
                  Edit Audio
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.9fr_1fr]">
            <div className="space-y-6 rounded-2xl border bg-card p-6">
              <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="rounded-3xl border border-white/10 bg-background p-2">
                  {thumbnailUrl ? (
                    <img
                      className="h-full w-full rounded-3xl object-cover"
                      src={thumbnailUrl}
                      alt={`Thumbnail for ${title}`}
                    />
                  ) : (
                    <div className="flex h-full min-h-55 items-center justify-center rounded-3xl bg-slate-950/50 text-sm text-muted-foreground">
                      No thumbnail available
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Overview</p>
                        <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {statusValue ? (
                          <Badge variant={statusValue === "active" ? "default" : "secondary"} className={`capitalize ${statusBadgeClass}`}>
                            {statusValue}
                          </Badge>
                        ) : statusObject ? (
                          <Badge variant="outline" className="capitalize text-sky-300 border-sky-500/20">
                            Status summary
                          </Badge>
                        ) : (
                          <Badge variant="outline">No status</Badge>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/admin/audio-management/audio/edit/${audio.id}`} state={{ audio }}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {audio.description || "No description available for this audio item."}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailRow label="Name" value={audio.name} />
                    <DetailRow label="Category" value={audioCategoryName} />
                    <DetailRow label="Duration" value={<span className="inline-flex items-center gap-2"><Clock3Icon className="h-4 w-4 text-muted-foreground" />{resolvedDuration}</span>} />
                    <DetailRow label="Has audio file" value={hasAudioFileLabel} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Created" value={audio.created_at ? formatTimestamp(audio.created_at) : null} />
                <DetailRow label="Updated" value={audio.updated_at ? formatTimestamp(audio.updated_at) : null} />
                <DetailRow label="Course" value={audio.course} />
                <DetailRow label="Category ID" value={audio.audio_category_id ?? "—"} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-6">
                <p className="text-sm font-semibold text-foreground mb-4">Media details</p>
                <div className="grid gap-4">
                  <DetailRow label="File size" value={resolvedFileSize} />
                  <DetailRow label="File size bytes" value={audio.file_size_bytes ?? "—"} />
                  <DetailRow label="MIME type" value={resolvedMimeType ? <span className="inline-flex items-center gap-2"><TagIcon className="h-4 w-4 text-muted-foreground" />{resolvedMimeType}</span> : "—"} />
                  <DetailRow label="Stream URL" value={renderLink(resolvedStreamUrl)} />
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm">
                <p className="text-sm font-semibold text-emerald-200 mb-4">Quick stats</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Total listeners" value={statusObject?.total_listeners ?? "—"} />
                  <DetailRow label="Completion rate" value={statusObject?.completion_rate ?? "—"} />
                  <DetailRow label="Average progress" value={statusObject?.average_progress ?? "—"} />
                  <DetailRow label="Hours listened" value={statusObject?.total_hours_listened ?? "—"} />
                </div>
              </div>
            </div>
          </div>

          {progress && (
            <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-sky-200">Progress details</p>
                  <p className="text-sm text-sky-100/80">Playback progress and last access metadata.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <DetailRow label="Current time (sec)" value={progress.current_time ?? "—"} />
                <DetailRow label="Total listened (sec)" value={progress.total_listened_time ?? "—"} />
                <DetailRow label="Completion %" value={progress.completion_percentage ?? "—"} />
                <DetailRow label="Completed" value={formatBoolean(progress.is_completed ?? null)} />
                <DetailRow label="Last accessed" value={formatTimestamp(progress.last_accessed_at)} />
              </div>
            </div>
          )}

          {listeners.length > 0 && (
            <div className="mt-6 rounded-2xl border bg-card/50 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Listeners</p>
                  <p className="text-sm text-muted-foreground">Recent engagement details for each listener.</p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {listeners.map((listener, index) => (
                  <div key={index} className="rounded-2xl border bg-card p-4">
                    <p className="text-sm font-semibold text-foreground mb-3">Listener #{index + 1}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow
                        label="User"
                        value={listener.user ? `${listener.user.name ?? listener.user.email ?? "Unknown user"} (${listener.user.id ?? "#?"})` : "—"}
                      />
                      <DetailRow label="Progress %" value={listener.progress_percentage ?? "—"} />
                      <DetailRow label="Current position (sec)" value={listener.current_position_seconds ?? "—"} />
                      <DetailRow label="Total duration (sec)" value={listener.total_duration_seconds ?? "—"} />
                      <DetailRow label="Status" value={listener.status ?? "—"} />
                      <DetailRow label="Listening time (min)" value={listener.listening_time_minutes ?? "—"} />
                      <DetailRow label="Last accessed" value={formatTimestamp(listener.last_accessed_at)} />
                      <DetailRow label="Assigned at" value={formatTimestamp(listener.assigned_at)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-card/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-white">Stream preview</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStreamUrl("")
                  setStreamError(null)
                  setStreamReloadCount((value) => value + 1)
                }}
                disabled={isLoadingStream || !audio?.id}
              >
                {isLoadingStream ? "Loading…" : "Reload stream"}
              </Button>
            </div>

            {isLoadingStream && (
              <p className="mt-3 text-sm text-muted-foreground">
                Preparing audio stream from the admin endpoint…
              </p>
            )}

            {streamError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{streamError}</AlertDescription>
              </Alert>
            )}

            {!isLoadingStream && !streamUrl && !streamError && (
              <p className="mt-3 text-sm text-muted-foreground">
                No audio preview available for this item.
              </p>
            )}

            {streamUrl && (
              <audio
                controls
                src={streamUrl}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-background p-3"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
