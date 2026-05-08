// ─── User Audio Detail / Player Page ─────────────────────────────────────────
// Route: /user/audio/:id

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  Loader2Icon,
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  VolumeXIcon,
  CheckCircle2Icon,
  ClockIcon,
  MusicIcon,
  SkipBackIcon,
  SkipForwardIcon,
  RepeatIcon,
  GaugeIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { isApiError } from "@/lib/api"

import {
  getUserAudioById,
  getAudioStreamBlobUrl,
  updateAudioProgress,
  formatDuration,
  getThumbnailUrl,
} from "./service/user-audio.service"
import type {
  UserAudioItem,
  UserAudioProgressDetail,
  ProgressChunk,
} from "./types/user-audio.types"

const FLUSH_INTERVAL_MS = 10_000
const MAX_CHUNKS = 300
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, "0")
}

function playerTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground font-semibold">{value ?? '—'}</span>
    </div>
  )
}

function PlayerSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto mt-8">
      <Skeleton className="h-8 w-48 rounded-xl bg-muted" />
      <Skeleton className="h-80 w-full rounded-3xl bg-card" />
    </div>
  )
}

export function UserAudioDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const audioId = Number(id)

  const [audio, setAudio] = useState<UserAudioItem | null>(null)
  const [progress, setProgress] = useState<UserAudioProgressDetail | null>(null)
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)

  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isLoadingStream, setIsLoadingStream] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLooping, setIsLooping] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)
  const playSegmentStartRef = useRef(0)
  const accumulatedListenedRef = useRef(0)
  const chunksBufferRef = useRef<ProgressChunk[]>([])

  const isValidId = Number.isInteger(audioId) && audioId > 0

  useEffect(() => {
    if (!isValidId) {
      setMetaError('Invalid audio ID.')
      setIsLoadingMeta(false)
      return
    }

    async function loadMeta() {
      setIsLoadingMeta(true)
      setMetaError(null)
      try {
        const result = await getUserAudioById(audioId)
        setAudio(result.data.audio)
        setProgress(result.data.progress)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (isApiError(err)) {
          setMetaError(
            err.status === 404
              ? 'Audio not found or not assigned to you.'
              : err.message || 'Failed to load audio.'
          )
        } else if (err instanceof Error) {
          setMetaError(err.message)
        } else {
          setMetaError('Failed to load audio.')
        }
      } finally {
        setIsLoadingMeta(false)
      }
    }
    void loadMeta()
  }, [audioId, isValidId])

  useEffect(() => {
    if (!audio?.has_audio_file) return
    let revoked = false
    async function loadStream() {
      setIsLoadingStream(true)
      setStreamError(null)
      try {
        const url = await getAudioStreamBlobUrl(audioId)
        if (!revoked) setBlobUrl(url)
      } catch (err) {
        if (revoked) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = isApiError(err)
          ? (err.status === 403 ? 'You are not authorised to stream this audio.' : err.message || 'Failed to load audio stream.')
          : err instanceof Error ? err.message : 'Failed to load audio stream.'
        setStreamError(message)
      } finally {
        if (!revoked) setIsLoadingStream(false)
      }
    }
    void loadStream()
    return () => {
      revoked = true
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [audio?.has_audio_file, audioId])

  useEffect(() => {
    if (!blobUrl || !audioRef.current || !progress) return
    const savedTime = progress.current_time ?? 0
    if (savedTime > 0) {
      audioRef.current.currentTime = savedTime
      setCurrentTime(savedTime)
    }
  }, [blobUrl, progress])

  const flushProgress = useCallback(async () => {
    if (!isValidId) return
    let total = accumulatedListenedRef.current
    if (isPlayingRef.current) {
      const inFlightSec = (Date.now() - playSegmentStartRef.current) / 1000
      total += Math.max(0, inFlightSec)
      playSegmentStartRef.current = Date.now()
    }
    const listenedSeconds = Math.round(Math.min(total, 3600))
    if (listenedSeconds <= 0) return

    accumulatedListenedRef.current = 0
    const currentAudioTime = audioRef.current?.currentTime ?? 0

    const chunk: ProgressChunk = {
      current_time: currentAudioTime,
      listened_time: listenedSeconds,
      batch_key: `batch_${Date.now()}`
    }
    chunksBufferRef.current.push(chunk)
    const toSend = chunksBufferRef.current.splice(0, MAX_CHUNKS)

    try {
      const result = await updateAudioProgress(audioId, { chunks: toSend })
      setProgress(result.data)
    } catch {
      chunksBufferRef.current.unshift(...toSend)
    }
  }, [audioId, isValidId])

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlayingRef.current) void flushProgress()
    }, FLUSH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [flushProgress])

  useEffect(() => {
    return () => { void flushProgress() }
  }, [flushProgress])

  function handlePlay() {
    isPlayingRef.current = true
    playSegmentStartRef.current = Date.now()
    setIsPlaying(true)
  }

  function handlePause() {
    if (isPlayingRef.current) {
      const segmentSec = (Date.now() - playSegmentStartRef.current) / 1000
      accumulatedListenedRef.current += Math.max(0, segmentSec)
      isPlayingRef.current = false
    }
    setIsPlaying(false)
    void flushProgress()
  }

  function handleEnded() {
    handlePause()
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = 0
      void audioRef.current.play()
    }
  }

  function handleSeeked() {
    if (isPlayingRef.current) {
      const segmentSec = (Date.now() - playSegmentStartRef.current) / 1000
      accumulatedListenedRef.current += Math.max(0, segmentSec)
      playSegmentStartRef.current = Date.now()
    }
  }

  function handleTimeUpdate() {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
  }

  function handleLoadedMetadata() {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }

  function togglePlayPause() {
    const el = audioRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }

  function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current
    if (!el) return
    const time = Number(e.target.value)
    el.currentTime = time
    setCurrentTime(time)
  }

  function toggleMute() {
    const el = audioRef.current
    if (!el) return
    el.muted = !el.muted
    setIsMuted(el.muted)
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current
    if (!el) return
    const vol = Number(e.target.value)
    el.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  function skipFixed(seconds: number) {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min(duration, el.currentTime + seconds))
    setCurrentTime(el.currentTime)
  }

  function cycleSpeed() {
    const el = audioRef.current
    if (!el) return
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length
    const newSpeed = PLAYBACK_SPEEDS[nextIndex]
    el.playbackRate = newSpeed
    setPlaybackRate(newSpeed)
  }

  const completionPct = Math.round(progress?.completion_percentage ?? 0)
  const isCompleted = progress?.is_completed ?? false
  const thumbnailUrl = getThumbnailUrl(audio?.thumbnail_path)
  const title = audio?.name ?? `Audio #${audioId}`
  const totalDuration = duration > 0 ? duration : (audio?.duration ?? 0)
  const seekMax = totalDuration > 0 ? totalDuration : 100

  return (
    <div className="min-h-[calc(100vh-4rem)]  p-4 md:p-8 font-sans text-foreground pb-24">
      <div className="max-w-full">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user/audio')}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2 rounded-full"
          >
            <ArrowLeftIcon className="size-4" />
            My Audio
          </Button>
        </div>

        {isLoadingMeta && <PlayerSkeleton />}

        {!isLoadingMeta && metaError && (
          <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-500">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{metaError}</AlertDescription>
          </Alert>
        )}

        {!isLoadingMeta && !metaError && audio && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            
            <div className="flex flex-col rounded-3xl bg-card border border-border/40 overflow-hidden shadow-2xl">
              
              <div className="relative w-full aspect-video md:aspect-[21/9] bg-muted overflow-hidden flex items-center justify-center">
                {thumbnailUrl ? (
                  <>
                    <div 
                      className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-30" 
                      style={{ backgroundImage: `url('${thumbnailUrl}')` }} 
                    />
                    <img
                      src={thumbnailUrl}
                      alt={title}
                      className="relative z-10 h-full w-full object-contain backdrop-blur-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <MusicIcon className="hidden absolute z-0 size-24 text-muted-foreground/30" />
                  </>
                ) : (
                  <MusicIcon className="size-24 text-muted-foreground/30" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 z-20">
                   <div className="flex items-end justify-between gap-4">
                     <div>
                       <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-md">
                         {title}
                       </h1>
                       <p className="text-sm md:text-base font-medium text-muted-foreground/90 mt-1 drop-shadow">
                         {audio.audio_category?.name || 'Unknown Category'}
                       </p>
                     </div>
                     {isCompleted && (
                       <Badge className="shrink-0 gap-1.5 bg-emerald-500/15 text-emerald-500 border-emerald-500/20">
                         <CheckCircle2Icon className="size-3.5" />
                         Completed
                       </Badge>
                     )}
                   </div>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col gap-6">
                {streamError && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500">
                    <AlertCircleIcon className="size-4" />
                    <AlertTitle>Stream unavailable</AlertTitle>
                    <AlertDescription>{streamError}</AlertDescription>
                  </Alert>
                )}

                {audio.has_audio_file && !streamError && (
                  <div className="flex flex-col gap-6">
                    {blobUrl && (
                      <audio
                        ref={audioRef}
                        src={blobUrl}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onEnded={handleEnded}
                        onSeeked={handleSeeked}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        preload="auto"
                      />
                    )}

                    {isLoadingStream ? (
                      <div className="flex items-center justify-center py-8 gap-3 text-sm text-muted-foreground">
                        <Loader2Icon className="size-5 animate-spin" />
                        Preparing audio stream...
                      </div>
                    ) : blobUrl ? (
                      <>
                        <div className="flex flex-col gap-2">
                          <input
                            type="range"
                            min={0}
                            max={seekMax}
                            step={0.5}
                            value={currentTime}
                            onChange={handleSeekChange}
                            aria-label="Seek"
                            className="
                              h-1.5 w-full cursor-pointer appearance-none rounded-full
                              bg-secondary accent-primary transition-all
                              [&::-webkit-slider-thumb]:size-3.5
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-primary
                              [&::-webkit-slider-thumb]:shadow-md
                              hover:[&::-webkit-slider-thumb]:scale-125
                            "
                          />
                          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground tabular-nums tracking-wider">
                            <span>{playerTime(currentTime)}</span>
                            <span>{playerTime(totalDuration)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          
                          <div className="flex items-center gap-1 md:gap-3 w-1/4">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={cycleSpeed}
                              className="text-muted-foreground hover:text-foreground rounded-full size-10"
                              title="Playback Speed"
                            >
                              <span className="text-xs font-bold leading-none">{playbackRate}x</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setIsLooping(!isLooping)}
                              className={`rounded-full size-10 transition-colors ${isLooping ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                              title="Toggle Loop"
                            >
                              <RepeatIcon className="size-4.5" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-center gap-3 md:gap-6 flex-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => skipFixed(-15)}
                              className="text-muted-foreground hover:text-foreground rounded-full size-10 md:size-12 hover:bg-secondary"
                              title="Skip Backward 15s"
                            >
                              <SkipBackIcon className="size-5" fill="currentColor" />
                            </Button>

                            <button
                              type="button"
                              onClick={togglePlayPause}
                              className="flex size-14 md:size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
                            >
                              {isPlaying ? (
                                <PauseIcon className="size-6" fill="currentColor" />
                              ) : (
                                <PlayIcon className="size-6 translate-x-[2px]" fill="currentColor" />
                              )}
                            </button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => skipFixed(15)}
                              className="text-muted-foreground hover:text-foreground rounded-full size-10 md:size-12 hover:bg-secondary"
                              title="Skip Forward 15s"
                            >
                              <SkipForwardIcon className="size-5" fill="currentColor" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-end gap-2 w-1/4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={toggleMute}
                              className="text-muted-foreground hover:text-foreground rounded-full size-10 shrink-0"
                            >
                              {isMuted || volume === 0 ? (
                                <VolumeXIcon className="size-4.5" />
                              ) : (
                                <Volume2Icon className="size-4.5" />
                              )}
                            </Button>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              className="
                                hidden md:block h-1 w-20 cursor-pointer appearance-none rounded-full
                                bg-secondary accent-primary
                                [&::-webkit-slider-thumb]:size-3
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-primary
                              "
                            />
                          </div>

                        </div>
                      </>
                    ) : null}
                  </div>
                )}

                {!audio.has_audio_file && (
                  <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-5 py-4 text-sm text-muted-foreground">
                    <MusicIcon className="size-5 opacity-40" />
                    No audio file is available for this item yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-3xl bg-card border border-border/40 p-6 shadow-xl flex flex-col items-center text-center gap-5">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <GaugeIcon className="size-5 text-primary" />
                  Your Progress
                </h2>

                <div className="flex flex-col items-center justify-center py-4 mb-6 relative">
                   <div className="size-40 rounded-full border-[12px] border-secondary flex flex-col items-center justify-center absolute" />
                   <div className="z-10 flex flex-col items-center">
                     <span className={`text-5xl font-black tracking-tighter ${isCompleted ? 'text-emerald-500' : 'text-primary'}`}>
                       {completionPct}%
                     </span>
                     <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                       {isCompleted ? 'Complete' : 'Progress'}
                     </span>
                   </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mb-8">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>

                <div className="flex flex-col gap-5">
                  <InfoRow
                    label="Total Listened"
                    value={
                      progress ? (
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="size-4 text-primary opacity-80" />
                          {formatDuration(progress.total_listened_time)}
                        </span>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <Separator className="bg-border/40" />
                  <InfoRow
                    label="Duration"
                    value={audio.duration ? formatDuration(audio.duration) : '—'}
                  />
                  <Separator className="bg-border/40" />
                  <InfoRow
                    label="Last Played"
                    value={
                      progress?.last_accessed_at
                        ? new Date(progress.last_accessed_at).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Never accessed'
                    }
                  />
                  {audio.description && (
                    <>
                      <Separator className="bg-border/40" />
                      <div className="flex flex-col gap-2">
                         <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</span>
                         <p className="text-sm text-foreground/80 leading-relaxed">{audio.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
