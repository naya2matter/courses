// ─── Inline Audio Player ──────────────────────────────────────────────────────
// Renders the seek bar + transport controls. Flows inline in the page.
// Pure presentation — the owning page renders the <audio> element.

import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume2Icon,
  Volume1Icon,
  VolumeXIcon,
  RepeatIcon,
  Loader2Icon,
  CheckIcon,
  CloudOffIcon,
  CloudUploadIcon,
} from "lucide-react"

import type { AudioPlayerControls, SaveState } from "../hooks/use-audio-player"

interface AudioPlayerProps {
  controls: AudioPlayerControls
  fallbackDuration?: number
}

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, "0")
}

function clock(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00"
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null
  const cfg: Record<Exclude<SaveState, "idle">, { icon: typeof CheckIcon; label: string; cls: string }> = {
    saving: { icon: CloudUploadIcon, label: "Saving…",   cls: "text-white/40" },
    saved:  { icon: CheckIcon,       label: "Saved",     cls: "text-emerald-400" },
    error:  { icon: CloudOffIcon,    label: "Will retry",cls: "text-amber-400" },
  }
  const { icon: Icon, label, cls } = cfg[state]
  return (
    <span className={`flex items-center gap-1 text-[11px] font-medium ${cls}`}>
      <Icon className="size-3" />
      {label}
    </span>
  )
}

// Shared range input style — used for both seek and volume
const rangeClass = `
  h-1.5 w-full cursor-pointer appearance-none rounded-full
  [&::-webkit-slider-thumb]:size-3.5
  [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:rounded-full
  [&::-webkit-slider-thumb]:bg-white
  [&::-webkit-slider-thumb]:shadow-sm
  [&::-webkit-slider-thumb]:transition-transform
  hover:[&::-webkit-slider-thumb]:scale-125
  [&::-moz-range-thumb]:size-3.5
  [&::-moz-range-thumb]:appearance-none
  [&::-moz-range-thumb]:rounded-full
  [&::-moz-range-thumb]:border-0
  [&::-moz-range-thumb]:bg-white
`

export function AudioPlayer({ controls, fallbackDuration = 0 }: AudioPlayerProps) {
  const {
    isPlaying, isBuffering,
    currentTime, duration,
    volume, isMuted,
    playbackRate, isLooping, saveState,
    togglePlay, seekTo, skip,
    setVolume, toggleMute, cycleSpeed, toggleLoop,
  } = controls

  const total   = duration > 0 ? duration : fallbackDuration
  const seekMax = total > 0 ? total : 100
  const seekPct = total > 0 ? Math.min(100, (currentTime / total) * 100) : 0
  const volPct  = (isMuted ? 0 : volume) * 100
  const VolumeIcon = isMuted || volume === 0 ? VolumeXIcon : volume < 0.5 ? Volume1Icon : Volume2Icon

  const trackBg = (filled: number) =>
    `linear-gradient(to right, rgb(99 102 241) ${filled}%, rgba(255,255,255,0.12) ${filled}%)`

  return (
    <div className="flex w-full flex-col gap-5">

      {/* ── Seek bar ── */}
      <div className="flex items-center gap-3">
        <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/40">
          {clock(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={seekMax}
          step={0.5}
          value={Math.min(currentTime, seekMax)}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Seek"
          className={rangeClass}
          style={{ background: trackBg(seekPct) }}
        />
        <span className="w-9 shrink-0 text-[11px] tabular-nums text-white/40">
          {clock(total)}
        </span>
      </div>

      {/* ── Transport ── */}
      <div className="flex items-center justify-between">

        {/* Speed + Loop */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label="Cycle playback speed"
            className="flex h-8 min-w-[2.5rem] items-center justify-center rounded-full px-2 text-xs font-bold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            {playbackRate}×
          </button>
          <button
            type="button"
            onClick={toggleLoop}
            aria-label="Toggle loop"
            aria-pressed={isLooping}
            className={`flex size-8 items-center justify-center rounded-full transition-colors ${
              isLooping ? "bg-indigo-500/20 text-indigo-300" : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            <RepeatIcon className="size-4" />
          </button>
        </div>

        {/* Skip back · Play/Pause · Skip forward */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => skip(-15)}
            aria-label="Back 15 seconds"
            className="flex size-9 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <SkipBackIcon className="size-4" fill="currentColor" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex size-12 items-center justify-center rounded-full bg-white text-[#0a0a12] shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            {isBuffering
              ? <Loader2Icon className="size-5 animate-spin" />
              : isPlaying
                ? <PauseIcon className="size-5" fill="currentColor" />
                : <PlayIcon  className="size-5 translate-x-px" fill="currentColor" />
            }
          </button>

          <button
            type="button"
            onClick={() => skip(15)}
            aria-label="Forward 15 seconds"
            className="flex size-9 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <SkipForwardIcon className="size-4" fill="currentColor" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="flex size-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <VolumeIcon className="size-4" />
          </button>
          <input
            type="range"
            min={0} max={1} step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className={`hidden w-20 sm:block ${rangeClass}`}
            style={{ background: trackBg(volPct) }}
          />
        </div>
      </div>

      {/* ── Footer: keyboard hint + save state ── */}
      <div className="flex items-center justify-between border-t border-white/8 pt-3">
        <p className="hidden text-[11px] text-white/30 sm:block">
          Space / K · ← → seek · ↑ ↓ volume · M mute
        </p>
        <SaveIndicator state={saveState} />
      </div>
    </div>
  )
}
