import { Badge } from "@/components/ui/badge"
import { StarIcon, TrophyIcon } from "lucide-react"

export function EnrollmentStatusBadge({
  status,
  rating,
}: {
  status: string
  rating: number | null | undefined
}) {
  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-2.5 py-0.5 border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 font-medium flex items-center gap-1"
      >
        <TrophyIcon className="size-2.5" />
        Completed
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge
        variant="outline"
        className="text-[10px] px-2.5 py-0.5 border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 font-medium"
      >
        Enrolled
      </Badge>
      {rating != null && (
        <Badge
          variant="outline"
          className="text-[10px] px-2.5 py-0.5 border border-amber-500/25 bg-amber-500/10 text-amber-300 font-medium flex items-center gap-1"
        >
          <StarIcon className="size-2.5" fill="currentColor" />
          Rated
        </Badge>
      )}
    </div>
  )
}
