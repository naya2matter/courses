// ─── ResendLinksSummaryCards ──────────────────────────────────────────────────
// 5 stat cards summarising the expired-links dataset.

import {
  LinkIcon,
  MailWarningIcon,
  ClockAlertIcon,
  UsersIcon,
  BookOpenIcon,
} from "lucide-react"
import type { ExpiredLinkAssignment } from "../types/resend-links.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

interface CardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  sublabel?: string
}

function StatCard({ label, value, icon, sublabel }: CardProps) {
  return (
    <div className="flex flex-col items-center justify-between text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        {icon}
      </div>
      <p className="text-4xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ResendLinksSummaryCardsProps {
  items: ExpiredLinkAssignment[]
  /** Overall total from pagination meta */
  total?: number
}

export function ResendLinksSummaryCards({ items, total }: ResendLinksSummaryCardsProps) {
  const neverSent = items.filter((i) => i.user.link_expires_at === null).length
  const expired = items.filter((i) => i.user.link_expires_at !== null).length
  const uniqueUsers = new Set(items.map((i) => i.user_id)).size
  const uniqueCourses = new Set(items.map((i) => i.course_id)).size

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Total Pending"
        value={total ?? items.length}
        sublabel="Need a new link"
        icon={<LinkIcon className="h-4 w-4 text-amber-400" />}
      />
      <StatCard
        label="Never Sent"
        value={neverSent}
        sublabel="Link not generated"
        icon={<MailWarningIcon className="h-4 w-4 text-rose-400" />}
      />
      <StatCard
        label="Expired"
        value={expired}
        sublabel="Link past expiry"
        icon={<ClockAlertIcon className="h-4 w-4 text-orange-400" />}
      />
      <StatCard
        label="Unique Users"
        value={uniqueUsers}
        sublabel="On this page"
        icon={<UsersIcon className="h-4 w-4 text-sky-400" />}
      />
      <StatCard
        label="Courses Affected"
        value={uniqueCourses}
        sublabel="On this page"
        icon={<BookOpenIcon className="h-4 w-4 text-violet-400" />}
      />
    </div>
  )
}
