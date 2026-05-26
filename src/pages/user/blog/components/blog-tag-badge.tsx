// ─── BlogTagBadge ─────────────────────────────────────────────────────────────
// Shared inline tag chip used across all blog card variants.

interface BlogTagBadgeProps {
  tag: string
}

export function BlogTagBadge({ tag }: BlogTagBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/40 transition-colors hover:border-white/20 hover:text-white/70">
      #{tag}
    </span>
  )
}
