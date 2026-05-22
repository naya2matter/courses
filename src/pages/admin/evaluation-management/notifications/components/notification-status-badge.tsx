// ─── NotificationStatusBadge ──────────────────────────────────────────────────
// Displays a status pill for a notification batch.
// Doesn't rely solely on color — always shows a text label.

interface NotificationStatusBadgeProps {
  status: string
  className?: string
}

function styleFor(status: string): string {
  switch (status) {
    case "sent":
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
    case "partial":
      return "bg-amber-500/15 border-amber-500/30 text-amber-300"
    case "failed":
      return "bg-red-500/15 border-red-500/30 text-red-300"
    default:
      return "bg-white/10 border-white/20 text-white/60"
  }
}

function labelFor(status: string): string {
  switch (status) {
    case "sent":
      return "Sent"
    case "partial":
      return "Partial"
    case "failed":
      return "Failed"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function NotificationStatusBadge({
  status,
  className = "",
}: NotificationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styleFor(status)} ${className}`}
      aria-label={`Status: ${labelFor(status)}`}
    >
      {labelFor(status)}
    </span>
  )
}
