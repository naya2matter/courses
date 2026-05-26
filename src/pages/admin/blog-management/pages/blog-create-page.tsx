import { ArrowLeftIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BlogPostFormPage } from "../components/blog-post-form-page"

export function BlogCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" className="w-fit" onClick={() => navigate("/admin/blog-management/blog")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Blog Management
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Blog Post</h1>
          <p className="mt-1 text-muted-foreground">Fill in the details for a new post.</p>
        </div>
      </div>

      <BlogPostFormPage
        onCancel={() => navigate("/admin/blog-management/blog")}
        onSaved={() => navigate("/admin/blog-management/blog")}
      />
    </div>
  )
}
