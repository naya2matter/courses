// ─── BlogMediaBadge ───────────────────────────────────────────────────────────
// Shared media-type pill used across all blog card variants.

import { FileTextIcon, FilmIcon, MicIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BlogMediaBadgeProps {
  mediaType: "Video" | "Audio" | null
  size?: "sm" | "md"
  /** When true, Video/Audio labels include the "OE" suffix (e.g. "Video OE"). */
  showOE?: boolean
}

export function BlogMediaBadge({ mediaType, size = "md", showOE = false }: BlogMediaBadgeProps) {
  const iconCls = size === "sm" ? "size-2.5" : "size-3"
  const textCls = size === "sm" ? "text-[10px]" : "text-[11px]"

  if (mediaType === "Video") {
    return (
      <Badge
        className={`gap-1 border-violet-500/30 bg-violet-500/20 text-violet-200 ${textCls} font-medium`}
      >
        <FilmIcon className={iconCls} />
        {showOE ? "Video OE" : "Video"}
      </Badge>
    )
  }

  if (mediaType === "Audio") {
    return (
      <Badge
        className={`gap-1 border-amber-500/30 bg-amber-500/20 text-amber-200 ${textCls} font-medium`}
      >
        <MicIcon className={iconCls} />
        {showOE ? "Audio OE" : "Audio"}
      </Badge>
    )
  }

  return (
    <Badge
      className={`gap-1 border-sky-500/30 bg-sky-500/15 text-sky-300 ${textCls} font-medium`}
    >
      <FileTextIcon className={iconCls} />
      Article
    </Badge>
  )
}
