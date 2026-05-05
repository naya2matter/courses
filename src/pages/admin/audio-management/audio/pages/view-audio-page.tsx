import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  Loader2Icon,
  ExternalLinkIcon,
  Music2Icon,
  CalendarClockIcon,
  TagIcon,
  Clock3Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { getAudioById } from "../service/audio.service"
import {
  extractAudioMetadata,
  extractAudioMetadataFromUrl,
  formatDuration,
  formatFileSize,
  type AudioMetadata,
} from "../service/audio-metadata"
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

export function ViewAudioPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const audioId = Number(id)

  const [audio, setAudio] = useState<AudioResource | null>(null)
  const [metadata, setMetadata] = useState<AudioMetadata>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedFile = useMemo(() => {
    const state = (location.state ?? {}) as {
      file?: unknown
      audioFile?: unknown
      selectedFile?: unknown
    }

    const candidates = [state.file, state.audioFile, state.selectedFile]
    const fileCandidate = candidates.find((candidate) => candidate instanceof File)
    return fileCandidate instanceof File ? fileCandidate : undefined
  }, [location.state])

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
    let isMounted = true
    let objectUrlToRevoke: string | null = null

    async function runMetadataExtraction() {
      setMetadata({})

      if (selectedFile) {
        const extracted = await extractAudioMetadata(selectedFile)

        if (!isMounted) {
          if (extracted.url?.startsWith("blob:")) {
            URL.revokeObjectURL(extracted.url)
          }
          return
        }

        if (extracted.url?.startsWith("blob:")) {
          objectUrlToRevoke = extracted.url
        }

        setMetadata(extracted)
        return
      }

      const remoteUrl = typeof audio?.url === "string" ? audio.url.trim() : ""
      if (remoteUrl) {
        const extracted = await extractAudioMetadataFromUrl(remoteUrl)
        if (isMounted) {
          setMetadata(extracted)
        }
      }
    }

    runMetadataExtraction()

    return () => {
      isMounted = false
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke)
      }
    }
  }, [audio?.url, selectedFile])

  const statusValue = audio?.status?.trim() || ""
  const resolvedUrl = (audio?.url?.trim() || metadata.url?.trim() || "")
  const resolvedMimeType = (audio?.mime_type?.trim() || metadata.mimeType?.trim() || "")

  const resolvedDuration = useMemo(() => {
    if (typeof audio?.duration === "string" && audio.duration.trim()) {
      return audio.duration
    }
    if (typeof audio?.duration === "number") {
      return formatDuration(audio.duration)
    }
    return metadata.durationFormatted || "—"
  }, [audio?.duration, metadata.durationFormatted])

  const resolvedFileSize = useMemo(() => {
    if (typeof audio?.file_size === "string" && audio.file_size.trim()) {
      return audio.file_size
    }
    if (typeof audio?.file_size === "number") {
      return formatFileSize(audio.file_size)
    }
    return metadata.fileSizeFormatted || "—"
  }, [audio?.file_size, metadata.fileSizeFormatted])

  const title = useMemo(() => audio?.title ?? audio?.name ?? `Audio #${audioId}`, [audio, audioId])

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
                <Badge variant={statusValue === "active" ? "default" : "secondary"} className="capitalize">
                  {statusValue}
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

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailRow label="Title" value={audio.title ?? audio.name} />
            <DetailRow label="Category" value={audio.category} />
            <DetailRow label="Description" value={audio.description} />
            <DetailRow label="Status" value={statusValue || "—"} />
            <DetailRow label="Duration" value={<span className="inline-flex items-center gap-2"><Clock3Icon className="h-4 w-4 text-muted-foreground" />{resolvedDuration}</span>} />
            <DetailRow label="Created" value={audio.created_at ? <span className="inline-flex items-center gap-2"><CalendarClockIcon className="h-4 w-4 text-muted-foreground" />{new Date(audio.created_at).toLocaleString()}</span> : null} />
            <DetailRow label="Updated" value={audio.updated_at ? <span className="inline-flex items-center gap-2"><CalendarClockIcon className="h-4 w-4 text-muted-foreground" />{new Date(audio.updated_at).toLocaleString()}</span> : null} />
            <DetailRow label="File size" value={resolvedFileSize} />
            <DetailRow label="MIME type" value={resolvedMimeType ? <span className="inline-flex items-center gap-2"><TagIcon className="h-4 w-4 text-muted-foreground" />{resolvedMimeType}</span> : "—"} />
          </div>

          <div className="mt-4">
            <DetailRow
              label="URL"
              value={
                resolvedUrl ? (
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 break-all text-primary underline-offset-4 hover:underline"
                  >
                    {resolvedUrl}
                    <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : "—"
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
