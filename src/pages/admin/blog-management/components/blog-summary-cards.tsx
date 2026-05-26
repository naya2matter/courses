// ─── BlogSummaryCards ─────────────────────────────────────────────────────────
// Six stat cards derived from the current page of items + pagination meta total.

import {
  FileTextIcon,
  CheckCircle2Icon,
  ClockIcon,
  HeartIcon,
  MessageSquareIcon,
  FilmIcon,
} from "lucide-react"
import type { BlogPost } from "../types/blog.types"

interface BlogSummaryCardsProps {
  items: BlogPost[]
  /** Total across all pages from pagination meta. Falls back to items.length. */
  total?: number
}

interface StatCard {
  key: string
  title: string
  value: number
  icon: React.ElementType
  iconColor: string
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
}: Omit<StatCard, "key">) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/6">
        <Icon className={`size-6 ${iconColor}`} />
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </p>
    </div>
  )
}

export function BlogSummaryCards({ items, total }: BlogSummaryCardsProps) {
  const resolvedTotal = total ?? items.length
  const published = items.filter((p) => p.status === "published").length
  const drafts = items.filter((p) => p.status === "draft").length
  const totalLikes = items.reduce((acc, p) => acc + p.like_count, 0)
  const totalComments = items.reduce((acc, p) => acc + p.comment_count, 0)
  const withMedia = items.filter((p) => p.has_media).length

  const cards: StatCard[] = [
    {
      key: "total",
      title: "Total Posts",
      value: resolvedTotal,
      icon: FileTextIcon,
      iconColor: "text-indigo-400",
    },
    {
      key: "published",
      title: "Published",
      value: published,
      icon: CheckCircle2Icon,
      iconColor: "text-emerald-400",
    },
    {
      key: "drafts",
      title: "Drafts",
      value: drafts,
      icon: ClockIcon,
      iconColor: "text-amber-400",
    },
    {
      key: "likes",
      title: "Total Likes",
      value: totalLikes,
      icon: HeartIcon,
      iconColor: "text-rose-400",
    },
    {
      key: "comments",
      title: "Comments",
      value: totalComments,
      icon: MessageSquareIcon,
      iconColor: "text-sky-400",
    },
    {
      key: "media",
      title: "With Media",
      value: withMedia,
      icon: FilmIcon,
      iconColor: "text-violet-400",
    },
  ]

  return (
    <section className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center">
      {cards.map(({ key, ...rest }) => (
        <SummaryCard key={key} {...rest} />
      ))}
    </section>
  )
}
