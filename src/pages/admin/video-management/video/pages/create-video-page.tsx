// ─── Create Video Page ────────────────────────────────────────────────────────
// Standalone page for uploading a new video.
// Wraps CreateVideoPanel in a full-page layout with breadcrumb navigation.

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useVideoStore } from "../store/video.store"
import { CreateVideoPanel } from "../components/create-video-sheet"
import { getVideoCategories } from "../../categories/service/category.service"
import type { VideoCategory } from "../../categories/types/category.types"

export function CreateVideoPage() {
  const navigate = useNavigate()
  const { createVideo } = useVideoStore()

  const [categories, setCategories] = useState<VideoCategory[]>([])

  useEffect(() => {
    getVideoCategories({ per_page: 200 })
      .then((r) => setCategories(r.items))
      .catch(() => {/* best-effort */})
  }, [])

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Video</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a new video file, complete the metadata, and publish it in one flow.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/admin/video-management/video")}
          className="w-fit"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
      </div>

      {/* ── Upload panel ──────────────────────────────────────────────────── */}
      <CreateVideoPanel
        onClose={() => navigate("/admin/video-management/video")}
        onSuccess={() => {
          toast.success("Video created successfully.")
          navigate("/admin/video-management/video")
        }}
        categories={categories}
        onCreate={createVideo}
      />
    </div>
  )
}
