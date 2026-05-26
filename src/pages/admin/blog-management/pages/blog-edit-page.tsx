import { ArrowLeftIcon } from "lucide-react"
import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BlogPostFormPage } from "../components/blog-post-form-page"

export function BlogEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const postId = useMemo(() => {
    const parsed = Number(id)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [id])

  if (!postId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">Invalid blog post id.</p>
        <Button variant="outline" onClick={() => navigate("/admin/blog-management/blog")}>Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" className="w-fit" onClick={() => navigate("/admin/blog-management/blog")}> 
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Blog Management
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
          <p className="mt-1 text-muted-foreground">Update the fields you want to change.</p>
        </div>
      </div>

      <BlogPostFormPage
        postId={postId}
        onCancel={() => navigate("/admin/blog-management/blog")}
        onSaved={() => navigate("/admin/blog-management/blog")}
      />
    </div>
  )
}
