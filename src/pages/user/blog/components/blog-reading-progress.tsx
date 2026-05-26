// ─── BlogReadingProgress ─────────────────────────────────────────────────────
// Fixed 2 px gradient bar at the top of the viewport that tracks how far down
// the reader has scrolled on the current page.

import { useEffect, useState } from "react"

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const docEl = document.documentElement
      const total = docEl.scrollHeight - docEl.clientHeight
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[2px] bg-gradient-to-r from-primary via-primary/80 to-primary/40 transition-none"
      style={{ width: `${progress}%` }}
    />
  )
}
