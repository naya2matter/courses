// ─── BlogSummaryCards ─────────────────────────────────────────────────────────
// Six editorial glass stat cards — totals derived from the current page.
// Total Posts sourced from meta.total (server-side count).

import type { ReactNode } from "react"
import {
  CalendarIcon,
  FileTextIcon,
  FilmIcon,
  HeartIcon,
  MessageSquareIcon,
  MicIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PublicBlogPost, PaginationMeta } from "../types/user-blog.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SummaryCard {
  key: string
  label: string
  value: string
  icon: ReactNode
  accentBg: string
  accentGlow: string
}

interface BlogSummaryCardsProps {
  items: PublicBlogPost[]
  meta: PaginationMeta
  isLoading: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogSummaryCards({
  items,
  meta,
  isLoading,
}: BlogSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
          >
            <Skeleton className="mb-3.5 h-9 w-9 rounded-xl" />
            <Skeleton className="mb-1.5 h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    )
  }

  const videoCount = items.filter((p) => p.media_type === "Video").length
  const audioCount = items.filter((p) => p.media_type === "Audio").length
  const totalLikes = items.reduce((sum, p) => sum + p.like_count, 0)
  const totalComments = items.reduce((sum, p) => sum + p.comment_count, 0)

  const latestPost = items.reduce<PublicBlogPost | null>((latest, p) => {
    if (!latest) return p
    return new Date(p.published_at).getTime() >
      new Date(latest.published_at).getTime()
      ? p
      : latest
  }, null)

  const cards: SummaryCard[] = [
    {
      key: "total",
      label: "Total Posts",
      value: meta.total.toLocaleString(),
      icon: <FileTextIcon className="size-4 text-white" />,
      accentBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      accentGlow: "bg-blue-500",
    },
    {
      key: "video",
      label: "Video Posts",
      value: videoCount.toLocaleString(),
      icon: <FilmIcon className="size-4 text-white" />,
      accentBg: "bg-gradient-to-br from-violet-500 to-purple-700",
      accentGlow: "bg-violet-500",
    },
    {
      key: "audio",
      label: "Audio Posts",
      value: audioCount.toLocaleString(),
      icon: <MicIcon className="size-4 text-white" />,
      accentBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      accentGlow: "bg-amber-500",
    },
    {
      key: "likes",
      label: "Total Likes",
      value: totalLikes.toLocaleString(),
      icon: <HeartIcon className="size-4 text-white" />,
      accentBg: "bg-gradient-to-br from-rose-500 to-pink-700",
      accentGlow: "bg-rose-500",
    },
    {
      key: "comments",
      label: "Comments",
      value: totalComments.toLocaleString(),
      icon: <MessageSquareIcon className="size-4 text-white" />,
      accentBg: "bg-gradient-to-br from-sky-500 to-blue-600",
      accentGlow: "bg-sky-500",
    },
    {
      key: "latest",
      label: "Latest Published",
      value: formatDate(latestPost?.published_at),
      icon: <CalendarIcon className="size-4 text-white" />,
      accentBg: "bg-gradient-to-br from-emerald-500 to-teal-700",
      accentGlow: "bg-emerald-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.key}
          className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-lg hover:shadow-black/20"
        >
          {/* Glow orb */}
          <div
            className={`pointer-events-none absolute -right-4 -top-4 size-20 rounded-full opacity-[0.08] blur-2xl ${card.accentGlow}`}
          />

          {/* Icon */}
          <div
            className={`mb-3.5 flex size-9 items-center justify-center rounded-xl shadow-md ${card.accentBg}`}
          >
            {card.icon}
          </div>

          {/* Label */}
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/40">
            {card.label}
          </p>

          {/* Value */}
          <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
