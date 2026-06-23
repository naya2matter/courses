import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { 
  AlertCircleIcon, 
  PlusIcon, 
  Trash2Icon, 
  XIcon,
  VideoIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  SaveIcon,
  Image as ImageIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateTimePickerField } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useCourse } from "../hook/use-course"
import type { AvailabilityPayload } from "../types/course.types"
import { extractCourseErrorMessage, isCanceledError } from "../utils/course-feedback"

// Internal availability row state
interface AvailRow {
  id?: number
  start_date: string
  end_date: string
  capacity: string
  days_of_week: string[]
  notes: string
  sessions: string
  duration_weeks: string
  session_time_shift_1: string
  session_time_shift_2: string
  session_time_shift_3: string
  session_duration_minutes: string
}

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

function emptyAvailRow(): AvailRow {
  return {
    start_date: "",
    end_date: "",
    capacity: "",
    days_of_week: [],
    notes: "",
    sessions: "",
    duration_weeks: "",
    session_time_shift_1: "",
    session_time_shift_2: "",
    session_time_shift_3: "",
    session_duration_minutes: "",
  }
}

function normalizeTimeShift(value: unknown): string {
  if (typeof value !== "string") return ""
  const trimmed = value.trim()
  if (!trimmed) return ""

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return ""

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return ""
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return ""

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export default function CourseFormPage() {
  const { id } = useParams()
  const isEditMode = !!id
  const navigate = useNavigate()
  
  const { 
    currentCourse, 
    fetchCourseById, 
    createCourse, 
    updateCourse,
    isLoadingCourse
  } = useCourse()

  // Base setup
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [level, setLevel] = useState<string>("")
  const [duration, setDuration] = useState("")
  const [status, setStatus] = useState("draft")
  const [privacy, setPrivacy] = useState("private")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [availRows, setAvailRows] = useState<AvailRow[]>([emptyAvailRow()])

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPublicConfirm, setShowPublicConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePrivacyChange(nextPrivacy: string) {
    if (nextPrivacy === "public" && privacy !== "public") {
      setShowPublicConfirm(true)
      return
    }
    setPrivacy(nextPrivacy)
  }

  function confirmPublicPrivacy() {
    setPrivacy("public")
    setShowPublicConfirm(false)
    toast.info("Course privacy set to Public.")
  }

  // Load existing course if Edit Mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchCourseById(Number(id))
    }
  }, [isEditMode, id])

  // Populate data when fetched
  useEffect(() => {
    if (isEditMode && currentCourse) {
      setName(currentCourse.name ?? "")
      setDescription(currentCourse.description ?? "")
      const lvl = typeof currentCourse.level === "object" && currentCourse.level !== null
          ? (currentCourse.level as { name: string }).name?.toLowerCase()
          : (currentCourse.level as string | null) ?? ""
      setLevel(lvl)
      setDuration(String(currentCourse.duration ?? ""))
      setStatus(currentCourse.status ?? "draft")
      setPrivacy(currentCourse.privacy ?? "public")
      setImageFile(null)
      setImagePreview(currentCourse.image_path ?? null)
      
      const rawAvail = currentCourse.availabilities
      if (Array.isArray(rawAvail) && rawAvail.length > 0) {
        setAvailRows(
          rawAvail.map((a: Record<string, unknown>) => ({
            id: (a.id as number | undefined),
            start_date: String(a.start_date ?? ""),
            end_date: String(a.end_date ?? ""),
            capacity: String(a.capacity ?? ""),
            days_of_week: Array.isArray(a.days_of_week) ? (a.days_of_week as string[]) : [],
            notes: String(a.notes ?? ""),
            sessions: a.sessions != null ? String(a.sessions) : "",
            duration_weeks: a.duration_weeks != null ? String(a.duration_weeks) : "",
            session_time_shift_1: normalizeTimeShift(String(a.session_time_shift_1 ?? "")),
            session_time_shift_2: normalizeTimeShift(String(a.session_time_shift_2 ?? "")),
            session_time_shift_3: normalizeTimeShift(String(a.session_time_shift_3 ?? "")),
            session_duration_minutes: a.session_duration_minutes != null ? String(a.session_duration_minutes) : "",
          })),
        )
      } else {
        setAvailRows([emptyAvailRow()])
      }
    } else {
      setImagePreview(null)
    }
  }, [isEditMode, currentCourse])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(null)
    }
  }

  function addAvailRow() { setAvailRows((rows) => [...rows, emptyAvailRow()]) }
  function removeAvailRow(index: number) { setAvailRows((rows) => rows.filter((_, i) => i !== index)) }
  function updateAvailRow(index: number, field: keyof AvailRow, value: unknown) {
    setAvailRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }
  function toggleDay(index: number, day: string) {
    setAvailRows((rows) => rows.map((row, i) => {
      if (i !== index) return row
      const has = row.days_of_week.includes(day)
      return { ...row, days_of_week: has ? row.days_of_week.filter((d) => d !== day) : [...row.days_of_week, day] }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      const message = "Course name is required."
      setError(message)
      toast.error(message)
      return
    }
    if (!status) {
      const message = "Status is required."
      setError(message)
      toast.error(message)
      return
    }
    if (!privacy) {
      const message = "Privacy is required."
      setError(message)
      toast.error(message)
      return
    }
    if (!isEditMode && availRows[0].days_of_week.length === 0) {
      const message = "At least one day of week must be selected."
      setError(message)
      toast.error(message)
      return
    }
    if (!isEditMode && (!availRows[0].start_date || !availRows[0].end_date)) {
      const message = "Start and end dates are required."
      setError(message)
      toast.error(message)
      return
    }
    if (!isEditMode && !availRows[0].capacity) {
      const message = "Capacity is required."
      setError(message)
      toast.error(message)
      return
    }

    setIsSubmitting(true)

    try {
      const availabilities: AvailabilityPayload[] = availRows.map((row) => ({
        id: row.id,
        start_date: row.start_date,
        end_date: row.end_date,
        capacity: Number(row.capacity),
        days_of_week: row.days_of_week,
        notes: row.notes || null,
        sessions: row.sessions ? Number(row.sessions) : null,
        duration_weeks: row.duration_weeks ? Number(row.duration_weeks) : null,
        session_time_shift_1: normalizeTimeShift(row.session_time_shift_1) || null,
        session_time_shift_2: normalizeTimeShift(row.session_time_shift_2) || null,
        session_time_shift_3: normalizeTimeShift(row.session_time_shift_3) || null,
        session_duration_minutes: row.session_duration_minutes ? Number(row.session_duration_minutes) : null,
      }))

      if (isEditMode && id) {
        await updateCourse(Number(id), {
          name: name.trim(),
          description: description.trim() || null,
          level: level || null,
          duration: duration ? Number(duration) : null,
          status,
          privacy,
          image: imageFile,
          availabilities,
        })
        toast.success("Course updated successfully.")
      } else {
        await createCourse({
          name: name.trim(),
          description: description.trim() || null,
          level: level || null,
          duration: duration ? Number(duration) : null,
          status,
          privacy,
          image: imageFile,
          availabilities,
        })
        toast.success("Course created successfully.")
      }

      navigate("/admin/course-management/live-courses")
    } catch (err) {
      if (isCanceledError(err)) return
      const message = extractCourseErrorMessage(err, "Failed to save course. Please try again.")
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditMode && isLoadingCourse) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent flex-shrink-0" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="flex items-start md:items-center gap-5 bg-transparent border-0 p-0 shadow-none overflow-visible relative mb-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-sm border bg-background hover:bg-muted h-10 w-10 shrink-0"
          onClick={() => navigate("/admin/course-management/live-courses")}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest block">
            {isEditMode ? "Manage Course" : "New Course"}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isEditMode ? "Edit Live Course" : "Create Live Course"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {isEditMode 
              ? "Update course details, schedule, and capacity limits." 
              : "Launch a new live training program with multi-day schedules and capacities."}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border border-destructive/50 bg-destructive/10">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <AlertDescription>{error}</AlertDescription>
            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => setError(null)}>
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="border-b bg-muted/40 p-4 shrink-0 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/20 p-1.5 text-primary">
                  <VideoIcon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-foreground">Core Details</h3>
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">Course Title <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. React Native Masterclass"
                  className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief overview of course syllabus and goals..."
                  rows={4}
                  className="w-full rounded-md border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Difficulty Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="bg-muted/30 border-muted-foreground/20">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-semibold">Duration (Minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={0}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 120"
                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="border-b bg-muted/40 p-4 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-indigo-500/20 p-1.5 text-indigo-400">
                  <CalendarDaysIcon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-foreground">Availabilities & Schedule <span className="text-destructive">*</span></h3>
              </div>

            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {availRows.map((row, index) => (
                  <div key={index} className="p-6 relative group transition-colors hover:bg-muted/10">
                    {availRows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeAvailRow(index)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </div>
                      {row.id != null && <span className="text-xs text-muted-foreground/60">(ID: {row.id})</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</Label>
                        <DateTimePickerField
                          value={row.start_date.replace("Z", "").replace("+00:00", "").slice(0, 16)}
                          onChange={(v) => updateAvailRow(index, "start_date", v ? `${v}:00Z` : "")}
                          placeholder="Pick start date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</Label>
                        <DateTimePickerField
                          value={row.end_date.replace("Z", "").replace("+00:00", "").slice(0, 16)}
                          onChange={(v) => updateAvailRow(index, "end_date", v ? `${v}:00Z` : "")}
                          placeholder="Pick end date"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operating Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = row.days_of_week.includes(day)
                          return (
                            <label
                              key={day}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary/50 text-primary' 
                                  : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              <Checkbox 
                                id={`day_${index}_${day}`} 
                                checked={isSelected} 
                                onCheckedChange={() => toggleDay(index, day)} 
                                className="sr-only" 
                              />
                              <span className="capitalize">{day.slice(0, 3)}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 mb-5">
                      <Label htmlFor={`notes_${index}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slot Notes</Label>
                      <textarea
                        id={`notes_${index}`}
                        value={row.notes}
                        onChange={(e) => updateAvailRow(index, "notes", e.target.value)}
                        placeholder="Add a short note for this availability slot"
                        rows={3}
                        className="w-full rounded-xl border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none transition-colors"
                      />
                    </div>

                    {/* ── Capacity & Sessions row ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor={`capacity_${index}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Seats Available <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`capacity_${index}`}
                          type="number"
                          min={1}
                          value={row.capacity}
                          onChange={(e) => updateAvailRow(index, "capacity", e.target.value)}
                          placeholder="e.g. 30"
                          className="bg-muted/30"
                          required={index === 0 || isEditMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`sessions_${index}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sessions</Label>
                        <Input
                          id={`sessions_${index}`}
                          type="number"
                          min={1}
                          value={row.sessions}
                          onChange={(e) => updateAvailRow(index, "sessions", e.target.value)}
                          placeholder="e.g. 12"
                          className="bg-muted/30"
                        />
                      </div>
                    </div>

                    {/* ── Duration row ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor={`duration_weeks_${index}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration (Weeks)</Label>
                        <Input
                          id={`duration_weeks_${index}`}
                          type="number"
                          min={1}
                          value={row.duration_weeks}
                          onChange={(e) => updateAvailRow(index, "duration_weeks", e.target.value)}
                          placeholder="e.g. 8"
                          className="bg-muted/30"
                        />
                        <p className="text-[10px] text-muted-foreground/70">Number of weeks this course runs</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`session_duration_minutes_${index}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Duration (min)</Label>
                        <Input
                          id={`session_duration_minutes_${index}`}
                          type="number"
                          min={1}
                          value={row.session_duration_minutes}
                          onChange={(e) => updateAvailRow(index, "session_duration_minutes", e.target.value)}
                          placeholder="e.g. 90"
                          className="bg-muted/30"
                        />
                        <p className="text-[10px] text-muted-foreground/70">Duration of each session in minutes</p>
                      </div>
                    </div>

                    {/* ── Session Time Shifts ── */}
                    <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 p-4 mb-1 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Time Shifts</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`shift1_${index}`} className="text-xs text-muted-foreground">Shift 1</Label>
                          <Input
                            id={`shift1_${index}`}
                            type="time"
                            value={row.session_time_shift_1}
                            onChange={(e) => updateAvailRow(index, "session_time_shift_1", e.target.value)}
                            className="bg-background/60"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`shift2_${index}`} className="text-xs text-muted-foreground">Shift 2 <span className="text-muted-foreground/50">(optional)</span></Label>
                          <Input
                            id={`shift2_${index}`}
                            type="time"
                            value={row.session_time_shift_2}
                            onChange={(e) => updateAvailRow(index, "session_time_shift_2", e.target.value)}
                            className="bg-background/60"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`shift3_${index}`} className="text-xs text-muted-foreground">Shift 3 <span className="text-muted-foreground/50">(optional)</span></Label>
                          <Input
                            id={`shift3_${index}`}
                            type="time"
                            value={row.session_time_shift_3}
                            onChange={(e) => updateAvailRow(index, "session_time_shift_3", e.target.value)}
                            className="bg-background/60"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-muted/10 border-t">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full rounded-xl border border-dashed border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-primary bg-background hover:bg-primary/5 transition-all shadow-none" 
                  onClick={addAvailRow}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Another Availability Slot
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="border-b bg-muted/40 p-4 shrink-0 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Visibility</h3>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Current Status</Label>
                <div className="flex flex-col gap-2 relative">
                  {/* Subtle track line to bind the controls visually */}
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-border/50 -z-10" />
                  
                  {[
                    { id: 'published', label: 'Published', accent: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
                    { id: 'draft', label: 'Draft', accent: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
                    { id: 'archived', label: 'Archived', accent: 'bg-zinc-500', shadow: 'shadow-zinc-500/20' }
                  ].map(opt => {
                    const isSelected = status === opt.id;
                    return (
                      <button 
                        type="button"
                        key={opt.id} 
                        onClick={() => setStatus(opt.id)}
                        className={`group relative cursor-pointer rounded-2xl border px-4 py-3 min-h-[52px] flex items-center gap-3 text-sm font-medium transition-all duration-300 ${
                          isSelected 
                            ? `bg-background border-primary/30 text-foreground ring-1 ring-primary/20 shadow-md ${opt.shadow}` 
                            : `bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/60`
                        }`}
                      >
                        <div className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${opt.accent} ${isSelected ? 'scale-110 shadow-sm' : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80'}`} />
                        <span className="flex-1 text-left">{opt.label}</span>
                        {isSelected && (
                          <div className="absolute right-3 text-primary opacity-80 shrink-0">
                            {/* Checkmark indicator for selected state */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-sm font-semibold">Privacy</Label>
                <Select value={privacy} onValueChange={handlePrivacyChange}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (Everyone)</SelectItem>
                    <SelectItem value="private">Private (Invite Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="border-b bg-muted/40 p-4 shrink-0 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Media Cover</h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border bg-black/40">
                    <img src={imagePreview} alt="Preview" className="w-full aspect-video object-cover transition-transform" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <Button type="button" variant="destructive" size="sm" onClick={() => { setImageFile(null); setImagePreview(null)}}>
                        Remove Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-primary gap-2"
                  >
                    <ImageIcon className="h-8 w-8 opacity-70" />
                    <span className="text-sm font-medium">Upload thumbnail</span>
                    <span className="text-xs opacity-60">1920x1080 recommended</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-6 mt-8 z-20 flex items-center justify-end gap-3 p-4 rounded-full bg-background/85 border border-border/60 shadow-lg backdrop-blur-xl">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full px-6 hover:bg-muted font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate("/admin/course-management/live-courses")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="rounded-full px-8 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-semibold transition-all h-10"
              disabled={isSubmitting}
            >
               {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  {isEditMode ? "Save Changes" : "Publish Course"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog open={showPublicConfirm} onOpenChange={setShowPublicConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Public Visibility</AlertDialogTitle>
            <AlertDialogDescription>
              Making this course public will make it visible to all users assigned to it.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublicPrivacy}>
              Yes, Make It Public
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
