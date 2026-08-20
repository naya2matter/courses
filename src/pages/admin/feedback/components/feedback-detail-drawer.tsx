// ─── FeedbackDetailDrawer ─────────────────────────────────────────────────────
// Sheet drawer displaying all details of a single feedback entry.

import {
  CalendarIcon,
  FileTextIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  UserIcon,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { FeedbackStatusBadge } from "./shared/feedback-status-badge"
import { FeedbackTypeBadge } from "./shared/feedback-type-badge"
import type { Feedback } from "../types/feedback.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-sm text-foreground break-words">{children}</div>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </div>
      {children}
    </section>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface FeedbackDetailDrawerProps {
  feedback: Feedback | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FeedbackDetailDrawer({
  feedback,
  open,
  onOpenChange,
}: FeedbackDetailDrawerProps) {
  if (!feedback) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-[680px] lg:max-w-[760px]"
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* ── Hero header ──────────────────────────────────────────────── */}
          <SheetHeader className="shrink-0 space-y-0 border-b border-white/10 bg-gradient-to-b from-violet-500/8 to-transparent px-6 pb-5 pt-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
                <MessagesSquareIcon className="h-5 w-5 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg leading-snug">{feedback.title}</SheetTitle>
                <SheetDescription className="mt-0.5">
                  Feedback #{feedback.id}
                </SheetDescription>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <FeedbackTypeBadge type={feedback.type} />
                  <FeedbackStatusBadge status={feedback.status} />
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* ── Body ─────────────────────────────────────────────────────── */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Submitter + date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatTile icon={<UserIcon className="h-3.5 w-3.5" />} label="Submitted By">
                <span className="font-medium">
                  {feedback.user?.name ?? "Unknown user"}
                </span>
                {feedback.user?.department && (
                  <span className="block text-xs text-muted-foreground">
                    {feedback.user.department.name}
                  </span>
                )}
              </StatTile>

              <StatTile icon={<CalendarIcon className="h-3.5 w-3.5" />} label="Created">
                {formatDate(feedback.created_at)}
              </StatTile>
            </div>

            {/* Description */}
            <Section icon={<FileTextIcon className="h-3.5 w-3.5" />} title="Description">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {feedback.description}
              </div>
            </Section>

            {/* Admin response */}
            {feedback.admin_response && (
              <Section
                icon={<MessageSquareIcon className="h-3.5 w-3.5 text-emerald-400" />}
                title="Admin Response"
              >
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {feedback.admin_response}
                </div>
              </Section>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
