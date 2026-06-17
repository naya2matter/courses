// ─── User Audio Detail / Player Page ─────────────────────────────────────────
// Route: /user/audio/:id

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  Loader2Icon,
  CheckCircle2Icon,
  ClockIcon,
  MusicIcon,
  GaugeIcon,
  CalendarIcon,
  TimerIcon,
  HeadphonesIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import {
  getUserAudioById,
  getAudioStreamBlobUrl,
  formatDuration,
  getThumbnailUrl,
} from "./service/user-audio.service"
import type {
  UserAudioItem,
  UserAudioProgressDetail,
} from "./types/user-audio.types"
import { useAudioPlayer } from "./hooks/use-audio-player"
import { AudioPlayer } from "./components/audio-player"

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClockIcon
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="flex items-center gap-2 text-sm text-white/45">
        <Icon className="size-4 shrink-0 text-white/25" />
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value ?? "—"}</span>
    </div>
  )
}

export function UserAudioDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const audioId = Number(id)
  const isValidId = Number.isInteger(audioId) && audioId > 0

  const [audio, setAudio] = useState<UserAudioItem | null>(null)
  const [progress, setProgress] = useState<UserAudioProgressDetail | null>(null)
  const [isLoadingMeta, setIsLoadingMeta] = useState(isValidId)
  const [metaError, setMetaError] = useState<string | null>(
    isValidId ? null : "Invalid audio ID.",
  )

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isLoadingStream, setIsLoadingStream] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  const handleProgress = useCallback(
    (next: UserAudioProgressDetail) => setProgress(next),
    [],
  )
  const { audioRef, audioProps, controls } = useAudioPlayer({
    audioId,
    initialTime: progress?.current_time,
    onProgress: handleProgress,
  })

  // Load metadata
  useEffect(() => {
    if (!isValidId) return
    let cancelled = false
    async function loadMeta() {
      setIsLoadingMeta(true)
      setMetaError(null)
      try {
        const result = await getUserAudioById(audioId)
        if (cancelled) return
        setAudio(result.data.audio)
        setProgress(result.data.progress)
      } catch (err) {
        if (cancelled) return
        if (isApiError(err)) {
          setMetaError(
            err.status === 404
              ? "Audio not found or not assigned to you."
              : err.message || "Failed to load audio.",
          )
        } else if (err instanceof Error) {
          setMetaError(err.message)
        } else {
          setMetaError("Failed to load audio.")
        }
      } finally {
        if (!cancelled) setIsLoadingMeta(false)
      }
    }
    void loadMeta()
    return () => { cancelled = true }
  }, [audioId, isValidId])

  // Download protected stream
  useEffect(() => {
    if (!audio?.has_audio_file) return
    let revoked = false
    let createdUrl: string | null = null
    async function loadStream() {
      setIsLoadingStream(true)
      setStreamError(null)
      try {
        const url = await getAudioStreamBlobUrl(audioId)
        createdUrl = url
        if (!revoked) setBlobUrl(url)
        else URL.revokeObjectURL(url)
      } catch (err) {
        if (revoked) return
        const message = isApiError(err)
          ? err.status === 403
            ? "You are not authorised to stream this audio."
            : err.message || "Failed to load audio stream."
          : err instanceof Error
            ? err.message
            : "Failed to load audio stream."
        setStreamError(message)
      } finally {
        if (!revoked) setIsLoadingStream(false)
      }
    }
    void loadStream()
    return () => {
      revoked = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
      setBlobUrl(null)
    }
  }, [audio?.has_audio_file, audioId])

  // Keyboard shortcuts
  useEffect(() => {
    if (!blobUrl) return
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
      switch (e.key) {
        case " ": case "k": e.preventDefault(); controls.togglePlay(); break
        case "ArrowLeft": controls.skip(-5); break
        case "ArrowRight": controls.skip(5); break
        case "ArrowUp": e.preventDefault(); controls.setVolume(Math.min(1, controls.volume + 0.1)); break
        case "ArrowDown": e.preventDefault(); controls.setVolume(Math.max(0, controls.volume - 0.1)); break
        case "m": controls.toggleMute(); break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [blobUrl, controls])

  const completionPct = Math.round(progress?.completion_percentage ?? 0)
  const isCompleted = progress?.is_completed ?? false
  const thumbnailUrl = getThumbnailUrl(audio?.thumbnail_path)
  const title = audio?.name ?? `Audio #${audioId}`
  const category = audio?.audio_category?.name ?? null
  const ringColor = isCompleted ? "#10b981" : "#6366f1"

  return (
    <div className="flex flex-col gap-5 pb-8 text-white">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/user/audio")}
        className="-ml-2 w-fit gap-2 rounded-full text-white/50 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeftIcon className="size-4" />
        Back to Audio
      </Button>

      {/* Loading skeleton */}
      {isLoadingMeta && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <Skeleton className="h-56 w-full bg-white/5 sm:h-64 md:h-72" />
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-4 w-24 rounded-full bg-white/5" />
              <Skeleton className="h-6 w-48 rounded-lg bg-white/5" />
              <Skeleton className="mt-2 h-16 w-full rounded-xl bg-white/5" />
            </div>
          </div>
          <Skeleton className="h-72 w-full rounded-2xl bg-white/5" />
        </div>
      )}

      {/* Error */}
      {!isLoadingMeta && metaError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          <AlertCircleIcon className="size-5 shrink-0" />
          {metaError}
        </div>
      )}

      {/* Main content */}
      {!isLoadingMeta && !metaError && audio && (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* ── Left column ── */}
          <div className="flex min-w-0 flex-col gap-5">

            {/* Now-playing card */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">

              {/* Artwork hero — full width, fixed height, never overflows */}
              <div className="relative h-52 w-full overflow-hidden bg-[#0d0d1a] sm:h-60 md:h-68 lg:h-64 xl:h-72">
                {thumbnailUrl ? (
                  <>
                    {/* Blurred fill so no letter-boxing */}
                    <div
                      className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-xl"
                      style={{ backgroundImage: `url('${thumbnailUrl}')` }}
                    />
                    {/* Sharp centred artwork */}
                    <img
                      src={thumbnailUrl}
                      alt={title}
                      className="relative z-10 mx-auto h-full w-auto max-w-full object-contain"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).style.display = "none"
                      }}
                    />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <MusicIcon className="size-20 text-white/10" />
                  </div>
                )}

                {/* Bottom gradient so title is always legible */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/60 to-transparent" />

                {/* Title area overlaid on artwork */}
                <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-4 sm:p-5">
                  <div className="min-w-0">
                    {category && (
                      <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 backdrop-blur-sm">
                        <HeadphonesIcon className="size-3" />
                        {category}
                      </span>
                    )}
                    <h1 className="line-clamp-2 text-lg font-bold tracking-tight text-white drop-shadow sm:text-xl md:text-2xl">
                      {title}
                    </h1>
                  </div>
                  {isCompleted && (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 backdrop-blur-sm">
                      <CheckCircle2Icon className="size-3.5" />
                      Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Player controls — full width below artwork */}
              <div className="p-4 sm:p-5 md:p-6">
                {streamError ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <AlertCircleIcon className="size-4 shrink-0" />
                    {streamError}
                  </div>
                ) : !audio.has_audio_file ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/40">
                    <MusicIcon className="size-4 shrink-0 opacity-50" />
                    No audio file is available for this item yet.
                  </div>
                ) : isLoadingStream || !blobUrl ? (
                  <div className="flex items-center justify-center gap-3 py-5 text-sm text-white/40">
                    <Loader2Icon className="size-4 animate-spin" />
                    Preparing audio stream…
                  </div>
                ) : (
                  <AudioPlayer controls={controls} fallbackDuration={audio.duration ?? 0} />
                )}

                {/* Hidden audio element */}
                {blobUrl && (
                  <audio ref={audioRef} src={blobUrl} preload="auto" {...audioProps} />
                )}
              </div>
            </div>

            {/* Description card */}
            {audio.description && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                  Description
                </p>
                <p className="text-sm leading-relaxed text-white/65">
                  {audio.description}
                </p>
              </div>
            )}
          </div>

          {/* ── Right column: progress ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-white/65">
              <GaugeIcon className="size-4 text-indigo-400" />
              Your Progress
            </h2>

            {/* Conic-gradient ring */}
            <div className="mb-6 flex items-center justify-center">
              <div
                className="flex size-36 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${ringColor} ${completionPct * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
                }}
              >
                <div className="flex size-[116px] flex-col items-center justify-center rounded-full bg-[#0c0c16]">
                  <span className="text-3xl font-black tracking-tight" style={{ color: ringColor }}>
                    {completionPct}%
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    {isCompleted ? "Complete" : "Listened"}
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/8">
              <StatRow
                icon={ClockIcon}
                label="Total listened"
                value={progress ? formatDuration(progress.total_listened_time) : "—"}
              />
              <StatRow
                icon={TimerIcon}
                label="Duration"
                value={audio.duration ? formatDuration(audio.duration) : "—"}
              />
              <StatRow
                icon={CalendarIcon}
                label="Last played"
                value={
                  progress?.last_accessed_at
                    ? new Date(progress.last_accessed_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Never"
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
