// ─── Online Courses Page Content ──────────────────────────────────────────────
// Admin page for browsing and managing online courses.

import {
  AlertCircleIcon,
  ClipboardListIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useOnlineCourses } from "../hook/use-online-courses"
import { OnlineCourseSummaryCards } from "../components/online-course-summary-cards"
import { OnlineCourseGrid } from "../components/online-course-grid"

// ── Page component ────────────────────────────────────────────────────────────

export function OnlineCoursesPageContent() {
  const navigate = useNavigate()
  const {
    items,
    meta,
    summaryCards,
    isLoading,
    error,
    filters,
    fetchCourses,
    setFilters,
    clearError,
  } = useOnlineCourses()

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Online Courses</h1>
          <p className="mt-1 text-muted-foreground">
            Browse and manage all self-paced online courses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate("/admin/course-management/online-courses/assignments")
            }
            className="gap-2"
          >
            <ClipboardListIcon className="h-4 w-4" />
            Assignments
          </Button>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => fetchCourses()}
          >
            {isLoading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() =>
              navigate("/admin/course-management/online-courses/create")
            }
            className="gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Create Course
          </Button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <OnlineCourseSummaryCards cards={summaryCards} />

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <XIcon className="size-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Course grid ──────────────────────────────────────────────────────── */}
      <OnlineCourseGrid
        items={items}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  )
}
