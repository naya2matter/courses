import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  Loader2Icon,
  Music2Icon,
  Clock3Icon,
  PencilIcon,
  UsersIcon,
  TrendingUpIcon,
  HeadphonesIcon,
  GaugeIcon,
  FileAudioIcon,
  RefreshCwIcon,
  HashIcon,
  CalendarClockIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { isApiError } from "@/lib/api"
import { getAdminAudioStreamBlobUrl, getAudioById } from "../service/audio.service"
import { formatDuration, formatFileSize } from "../service/audio-metadata"
import type { AudioResource } from "../types/audio.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBoolean(value?: boolean | null) {
  if (value == null) return "—"
  return value ? "Yes" : "No"
}

function formatTimestamp(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—"
}

function fmtPct(value?: number | string | null) {
  if (value == null || value === "") return "—"
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return String(value)
  return `${Math.round(num)}%`
}

function pctValue(value?: number | string | null): number {
  if (value == null) return 0
  const num = typeof value === "number" ? value : Number(value)
  return Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : 0
}

// Compact stat tile
function StatTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// Labelled key/value row inside a detail panel
function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">
        {value ?? <span className="italic text-muted-foreground/60">—</span>}
      </span>
    </div>
  )
}

// Thin progress bar
function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
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
    if (typeof audio?.duration === "string" && audio.duration.trim()) return audio.duration
    if (typeof audio?.duration === "number") return formatDuration(audio.duration)
    return "—"
  }, [audio?.duration])

  const resolvedFileSize = useMemo(() => {
    if (typeof audio?.file_size === "string" && audio.file_size.trim()) return audio.file_size
    if (typeof audio?.file_size === "number") return formatFileSize(audio.file_size)
    return "—"
  }, [audio?.file_size])

  const title = useMemo(
    () => audio?.title || audio?.name || `Audio #${audioId}`,
    [audio?.name, audio?.title, audioId],
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audio Details</h1>
            <p className="text-sm text-muted-foreground">Read-only overview for the selected audio item.</p>
          </div>
        </div>
        {audio && (
          <Button asChild variant="outline" size="sm" className="w-fit gap-1.5">
            <Link to={`/admin/audio-management/audio/edit/${audio.id}`} state={{ audio }}>
              <PencilIcon className="h-3.5 w-3.5" />
              Edit Audio
            </Link>
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-2xl border bg-card/50 py-24">
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
        <div className="space-y-6">
          {/* ── Hero ── */}
          <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/8 via-card to-card">
            <div className="flex flex-col gap-6 p-6 sm:flex-row">
              {/* Thumbnail */}
              <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-background">
                {thumbnailUrl ? (
                  <img className="h-full w-full object-cover" src={thumbnailUrl} alt={`Thumbnail for ${title}`} />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/50">
                    <Music2Icon className="h-10 w-10" />
                    <span className="text-xs">No thumbnail</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Music2Icon className="h-3.5 w-3.5" />
                    Audio
                  </span>
                  {statusValue ? (
                    <Badge variant={statusValue === "active" ? "default" : "secondary"} className={`capitalize ${statusBadgeClass}`}>
                      {statusValue}
                    </Badge>
                  ) : statusObject ? (
                    <Badge variant="outline" className="border-sky-500/20 capitalize text-sky-300">Active summary</Badge>
                  ) : null}
                  {audioCategoryName && (
                    <Badge variant="outline" className="border-white/15 text-muted-foreground">
                      {audioCategoryName}
                    </Badge>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><HashIcon className="h-3 w-3" />{audio.id}</span>
                    <span className="inline-flex items-center gap-1"><Clock3Icon className="h-3 w-3" />{resolvedDuration}</span>
                  </p>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {audio.description || "No description available for this audio item."}
                </p>

                {/* Inline player */}
                <div className="mt-auto pt-2">
                  {isLoadingStream && (
                    <p className="text-sm text-muted-foreground">Preparing audio stream…</p>
                  )}
                  {streamError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircleIcon className="size-4" />
                      <AlertDescription>{streamError}</AlertDescription>
                    </Alert>
                  )}
                  {streamUrl && (
                    <div className="flex items-center gap-2">
                      <audio controls src={streamUrl} className="h-10 w-full max-w-md rounded-lg" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => {
                          setStreamUrl("")
                          setStreamError(null)
                          setStreamReloadCount((v) => v + 1)
                        }}
                        disabled={isLoadingStream}
                        aria-label="Reload stream"
                      >
                        <RefreshCwIcon className={`h-4 w-4 ${isLoadingStream ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  )}
                  {!isLoadingStream && !streamUrl && !streamError && (
                    <p className="text-sm text-muted-foreground">No audio preview available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick stats ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              icon={UsersIcon}
              label="Total Listeners"
              value={statusObject?.total_listeners ?? listeners.length ?? "—"}
              color="text-indigo-400"
            />
            <StatTile
              icon={TrendingUpIcon}
              label="Completion Rate"
              value={fmtPct(statusObject?.completion_rate)}
              color="text-emerald-400"
            />
            <StatTile
              icon={GaugeIcon}
              label="Avg Progress"
              value={fmtPct(statusObject?.average_progress)}
              color="text-sky-400"
            />
            <StatTile
              icon={HeadphonesIcon}
              label="Hours Listened"
              value={statusObject?.total_hours_listened ?? "—"}
              color="text-amber-400"
            />
          </div>

          {/* ── Detail panels ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Media details */}
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <FileAudioIcon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Media Details</p>
              </div>
              <div className="divide-y divide-white/5">
                <MetaRow label="Name" value={audio.name} />
                <MetaRow label="Category" value={audioCategoryName} />
                <MetaRow label="Duration" value={resolvedDuration} />
                <MetaRow label="Has audio file" value={hasAudioFileLabel} />
                <MetaRow label="File size" value={resolvedFileSize} />
                <MetaRow label="MIME type" value={resolvedMimeType || "—"} />
                <MetaRow
                  label="Stream URL"
                  value={
                    resolvedStreamUrl ? (
                      <a className="break-all text-primary underline" href={resolvedStreamUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : "—"
                  }
                />
              </div>
            </div>

            {/* Timeline + progress */}
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-2 flex items-center gap-2">
                  <CalendarClockIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Timeline</p>
                </div>
                <div className="divide-y divide-white/5">
                  <MetaRow label="Course" value={audio.course} />
                  <MetaRow label="Created" value={formatTimestamp(audio.created_at)} />
                  <MetaRow label="Updated" value={formatTimestamp(audio.updated_at)} />
                </div>
              </div>

              {progress && (
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
                  <p className="mb-3 text-sm font-semibold text-sky-200">Playback Progress</p>
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-sky-100/80">
                      <span>Completion</span>
                      <span className="font-semibold">{fmtPct(progress.completion_percentage)}</span>
                    </div>
                    <ProgressBar value={pctValue(progress.completion_percentage)} />
                  </div>
                  <div className="divide-y divide-white/5">
                    <MetaRow label="Current time (sec)" value={progress.current_time ?? "—"} />
                    <MetaRow label="Total listened (sec)" value={progress.total_listened_time ?? "—"} />
                    <MetaRow label="Completed" value={formatBoolean(progress.is_completed ?? null)} />
                    <MetaRow label="Last accessed" value={formatTimestamp(progress.last_accessed_at)} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Listeners ── */}
          {listeners.length > 0 && (
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Listeners</p>
                </div>
                <Badge variant="outline" className="border-white/15 text-muted-foreground">
                  {listeners.length}
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Progress</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-right text-xs">Listening (min)</TableHead>
                      <TableHead className="text-right text-xs">Last accessed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listeners.map((listener, index) => {
                      const pct = pctValue(listener.progress_percentage)
                      const name = listener.user?.name ?? listener.user?.email ?? "Unknown user"
                      const initials = name.slice(0, 2).toUpperCase()
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                                {listener.user?.email && (
                                  <p className="truncate text-xs text-muted-foreground">{listener.user.email}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-36">
                            <div className="flex items-center gap-2">
                              <ProgressBar value={pct} />
                              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                {fmtPct(listener.progress_percentage)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {listener.status ? (
                              <Badge
                                variant="outline"
                                className={`capitalize ${
                                  listener.status === "completed"
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                    : "border-white/15 text-muted-foreground"
                                }`}
                              >
                                {listener.status}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground/60">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                            {listener.listening_time_minutes ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatTimestamp(listener.last_accessed_at)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
