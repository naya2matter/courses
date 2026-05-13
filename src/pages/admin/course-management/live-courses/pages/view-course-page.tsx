// ─── View Course Page ────────────────────────────────────────────────────────
// Displays detailed information for a single course

import { useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  GraduationCapIcon,
  Loader2Icon,
  LockIcon,
  UnlockIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { useCourseStore } from "../store/course.store"

function getLevelLabel(level: string | { id: number; name: string } | null | undefined): string {
  if (!level) return "Unknown"
  return typeof level === "string" ? level : level.name
}
import { parseAvailabilities } from "../utils/availability"

/**
 * Format duration from minutes to human-readable string
 */
function formatDuration(minutes: number | null): string {
  if (!minutes) return "N/A"

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins} minutes`
  if (mins === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`

  return `${hours} ${hours === 1 ? "hour" : "hours"} ${mins} minutes`
}

/**
 * Get badge variant based on course status
 */
function getStatusVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case "active":
      return "default"
    case "draft":
      return "secondary"
    case "archived":
      return "destructive"
    default:
      return "outline"
  }
}

/**
 * Format date string to readable format
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateString
  }
}

/**
 * Display course availabilities in a nice detailed list
 */
function CourseAvailabilitiesList({ availabilities }: { availabilities: unknown }) {
  const parsed = parseAvailabilities(availabilities)
  if (!parsed.length) return <span className="text-muted-foreground">N/A</span>

  return (
    <div className="space-y-4 w-full">
      {parsed.map((slot, i) => {
        const capacity = Number(slot.capacity) || 0
        const availableSpots = Number(slot.available_spots)
        const used = !isNaN(availableSpots) ? capacity - availableSpots : 0

        return (
          <div key={slot.id || i} className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {slot.start_date ? formatDate(slot.start_date) : "TBD"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {slot.end_date ? `Ends ${formatDate(slot.end_date)}` : "TBD"}
                  </span>
                </div>
                {slot.days_of_week && slot.days_of_week.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Days:</span>
                    <div className="flex flex-wrap gap-1">
                      {slot.days_of_week.map((day) => (
                        <Badge key={day} variant="secondary" className="capitalize text-[10px]">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">
                      {!isNaN(availableSpots) ? `${used} / ${capacity} filled` : `${capacity} slots`}
                    </span>
                  </div>
                  {!isNaN(availableSpots) && capacity > 0 && (
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, (used / capacity) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
                {slot.notes && (
                  <div className="text-sm text-muted-foreground bg-background rounded-md p-2 border">
                    <span className="font-medium text-foreground block mb-1">Notes:</span>
                    {slot.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ViewCoursePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const lastErrorToastRef = useRef<string | null>(null)

  const { currentCourse, isLoadingCourse, courseError, fetchCourseById, clearCourseError } =
    useCourseStore()

  /**
   * Fetch course data on mount or when ID changes
   */
  useEffect(() => {
    const courseId = Number(id)
    if (!isNaN(courseId)) {
      fetchCourseById(courseId)
    }
  }, [id, fetchCourseById])

  useEffect(() => {
    if (!courseError) {
      lastErrorToastRef.current = null
      return
    }

    if (lastErrorToastRef.current === courseError) return
    lastErrorToastRef.current = courseError
    toast.error(courseError)
  }, [courseError])

  /**
   * Navigate back to courses list
   */
  function handleBack() {
    navigate("/admin/course-management/live-courses")
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full shadow-sm border bg-background hover:bg-muted">
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Back to Live Courses</h1>
        </div>
      </div>

      {/* ─── Error Alert ─────────────────────────────────────────────────────── */}
      {courseError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <div>
              <AlertTitle>Failed to load course</AlertTitle>
              <AlertDescription>{courseError}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={clearCourseError}
              aria-label="Dismiss error"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* ─── Loading State ───────────────────────────────────────────────────── */}
      {isLoadingCourse && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* ─── Course Content ──────────────────────────────────────────────────── */}
      {!isLoadingCourse && currentCourse && (
        <div className="space-y-8">
          {/* ─── Hero Header ─────────────────────────────────────────────────── */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-lg border border-border/50 bg-muted group">
            {/* Background Image / Fallback */}
            {currentCourse.image_path ? (
              <div className="absolute inset-0">
                <img
                  src={currentCourse.image_path}
                  alt={currentCourse.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-in-out"
                />
                {/* Advanced dual-gradient for perfect text readability while maintaining image vibrancy */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent opacity-80" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
            )}

            {/* Content Overlay */}
            <div className="relative z-10 p-8 sm:p-10 flex flex-col justify-end min-h-[400px]">
              <div className="flex flex-col gap-5 max-w-4xl">
                {/* Badges / Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90">
                  <Badge 
                    variant={getStatusVariant(currentCourse.status)} 
                    className="shadow-none border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-black/60 capitalize"
                  >
                    {currentCourse.status || "Unknown"}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1.5 shadow-none border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-black/60 capitalize"
                  >
                    {currentCourse.privacy === "private" ? (
                      <><LockIcon className="h-3 w-3" /> Private</>
                    ) : (
                      <><UnlockIcon className="h-3 w-3" /> Public</>
                    )}
                  </Badge>
                  <span className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                    ID: {currentCourse.id}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  {currentCourse.name}
                </h1>

                {/* Description */}
                {currentCourse.description && (
                  <p className="text-lg sm:text-xl text-white/80 leading-relaxed font-light mt-1 max-w-3xl">
                    {currentCourse.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Course Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Level Card */}
            {currentCourse.level && (
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCapIcon className="h-5 w-5 text-purple-500" />
                    <CardTitle className="text-base">Level</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{getLevelLabel(currentCourse.level)}</p>
                  {typeof currentCourse.level !== "string" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Level ID: {currentCourse.level.id}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Duration Card */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Duration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{formatDuration(currentCourse.duration)}</p>
                {currentCourse.duration && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentCourse.duration} minutes total
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Availabilities Card */}
          {currentCourse.availabilities && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Availabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <CourseAvailabilitiesList availabilities={currentCourse.availabilities} />
              </CardContent>
            </Card>
          )}

          {/* Timestamps Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-base mt-1">{formatDate(currentCourse.created_at)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-base mt-1">{formatDate(currentCourse.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Not Found State ─────────────────────────────────────────────────── */}
      {!isLoadingCourse && !currentCourse && !courseError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpenIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Course not found</p>
            <p className="text-sm text-muted-foreground">
              The course you're looking for doesn't exist or has been removed.
            </p>
            <Button variant="outline" onClick={handleBack} className="mt-4">
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
