// ─── BlogStatusBadge ─────────────────────────────────────────────────────────

import type { BlogPostStatus } from "../../types/blog.types"

const STATUS_CLASSES: Record<BlogPostStatus, string> = {
  draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
}

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "Draft",
  published: "Published",
}

export function BlogStatusBadge({ status }: { status: BlogPostStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
