import { Loader2 } from "lucide-react"
import faviconUrl from "@/assets/favicon.svg"

/**
 * Full-viewport loading screen shown while the app bootstraps (e.g. auth
 * hydration on a hard refresh) so the user never sees a blank white page.
 * Matches the app's dark indigo theme.
 */
export function FullPageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex h-screen w-full flex-col items-center justify-center gap-5 bg-[#0b0b13] text-white"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative flex flex-col items-center gap-5">
        <img
          src={faviconUrl}
          alt="The Development Zone"
          className="size-14 rounded-xl object-contain"
        />
        <Loader2 className="size-7 animate-spin text-indigo-400" />
        <p className="text-sm font-medium text-white/50">{label}</p>
      </div>
    </div>
  )
}
