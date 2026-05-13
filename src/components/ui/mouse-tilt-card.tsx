import React, { useEffect, useRef } from "react"

type Props = React.HTMLAttributes<HTMLDivElement> & {
  maxTilt?: number
  scale?: number
  perspective?: number
  transitionMs?: number
}

export default function MouseTiltCard({
  children,
  className = "",
  maxTilt = 2,
  scale = 1.01,
  perspective = 900,
  transitionMs = 600,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const state = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0, hovering: false })

  const update = () => {
    const el = ref.current
    if (!el) return
    const s = state.current as typeof state.current

    // Lerp smoothing - higher value tracks target faster (more responsive)
    const smoothing = 0.16
    s.currentX += (s.targetX - s.currentX) * smoothing
    s.currentY += (s.targetY - s.currentY) * smoothing

    // current values become the rotation in degrees
    const rotateY = s.currentX
    const rotateX = s.currentY
    const sc = s.hovering ? scale : 1

    el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${sc})`
    // Quick, responsive transform while moving; slower, gentle return when leaving
    el.style.transition = s.hovering ? "transform 120ms linear" : `transform ${transitionMs}ms cubic-bezier(.2,.8,.2,1)`
    el.style.willChange = "transform"

    if (Math.abs(s.currentX - s.targetX) > 0.01 || Math.abs(s.currentY - s.targetY) > 0.01 || s.hovering) {
      rafRef.current = requestAnimationFrame(update)
    } else {
      rafRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height

    const tx = (relX - 0.5) * 2 * maxTilt
    const ty = (0.5 - relY) * 2 * maxTilt

    state.current.targetX = tx
    state.current.targetY = ty
    state.current.hovering = true

    if (!rafRef.current) rafRef.current = requestAnimationFrame(update)
  }

  const onMouseEnter = () => {
    state.current.hovering = true
    if (!rafRef.current) rafRef.current = requestAnimationFrame(update)
  }

  const onMouseLeave = () => {
    state.current.targetX = 0
    state.current.targetY = 0
    state.current.hovering = false
    if (!rafRef.current) rafRef.current = requestAnimationFrame(update)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={className}
      {...rest}
    >
      {children}
    </div>
  )
}
