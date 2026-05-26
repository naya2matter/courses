// ─── ResendLinksTable ─────────────────────────────────────────────────────────
// Desktop table + mobile cards + pagination + resend dialog for expired links.

import { useState, useMemo } from "react"
import {
  SendIcon,
  LinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LinkStatusBadge } from "./shared/link-status-badge"
import { ResendLinksFiltersToolbar } from "./resend-links-filters-toolbar"
import { ResendLinksMobileCard } from "./resend-links-mobile-card"
import { ResendLinkConfirmDialog } from "./resend-link-confirm-dialog"
import type {
  ExpiredLinkAssignment,
  ExpiredLinksFilters,
  PaginationMeta,
} from "../types/resend-links.types"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResendLinksTableProps {
  items: ExpiredLinkAssignment[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: ExpiredLinksFilters
  onPageChange: (page: number) => void
  onFilterChange: (partial: Partial<ExpiredLinksFilters>) => void
  onClearAll: () => void
  onMutated: () => void
}

const SKELETON_ROWS = 8

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function isExpired(linkExpiresAt: string | null): boolean {
  if (linkExpiresAt === null) return false
  return new Date(linkExpiresAt) < new Date()
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ResendLinksTable({
  items,
  meta,
  isLoading,
  filters,
  onPageChange,
  onFilterChange,
  onClearAll,
  onMutated,
}: ResendLinksTableProps) {
  // ── Local state ───────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("")
  const [resendTarget, setResendTarget] = useState<ExpiredLinkAssignment | null>(null)
  const [resendOpen, setResendOpen] = useState(false)

  // ── Client-side filtering ─────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let out = items

    if (filters.linkStatus) {
      out = out.filter((i) =>
        filters.linkStatus === "never_sent"
          ? i.user.link_expires_at === null
          : isExpired(i.user.link_expires_at),
      )
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      out = out.filter(
        (i) =>
          i.user.name.toLowerCase().includes(q) ||
          i.user.email.toLowerCase().includes(q) ||
          i.course.name.toLowerCase().includes(q),
      )
    }

    return out
  }, [items, filters.linkStatus, searchText])

  // ── Pagination ────────────────────────────────────────────────────────────
  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1

  // ── Helpers ───────────────────────────────────────────────────────────────
  const hasActiveFilters = Boolean(filters.linkStatus || searchText.trim())

  function handleClearAll() {
    setSearchText("")
    onClearAll()
  }

  const resultCount = meta
    ? { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total }
    : null

  function openResend(a: ExpiredLinkAssignment) {
    setResendTarget(a)
    setResendOpen(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Toolbar */}
        <ResendLinksFiltersToolbar
          filters={filters}
          searchText={searchText}
          resultCount={resultCount}
          onSearchTextChange={setSearchText}
          onFilterChange={onFilterChange}
          onClearAll={handleClearAll}
        />

        {/* ── Desktop table ─────────────────────────────────────────────────── */}
        <div className="hidden md:block rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">User</TableHead>
                <TableHead className="min-w-[200px]">Course</TableHead>
                <TableHead>Link Status</TableHead>
                <TableHead>Expired / Not Sent</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : displayed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
                      <LinkIcon className="h-8 w-8 opacity-30" />
                      <p className="text-sm font-medium">
                        {hasActiveFilters
                          ? "No results match your filters."
                          : "No expired or unsent login links found."}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={handleClearAll}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayed.map((a) => (
                  <TableRow key={a.id} className="group">
                    <TableCell>
                      <p className="font-medium text-sm">{a.user.name}</p>
                      <p className="text-xs text-muted-foreground">{a.user.email}</p>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <p className="text-sm line-clamp-2">{a.course.name}</p>
                    </TableCell>
                    <TableCell>
                      <LinkStatusBadge linkExpiresAt={a.user.link_expires_at} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {a.user.link_expires_at === null ? (
                        <span className="italic text-rose-400/70">Never sent</span>
                      ) : (
                        formatDate(a.user.link_expires_at)
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(a.assigned_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.assigned_by_user.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openResend(a)}
                          >
                            <SendIcon className="mr-1.5 h-3.5 w-3.5" />
                            Resend Link
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Send a fresh 72-hour login link to {a.user.name}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Mobile cards ──────────────────────────────────────────────────── */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <LinkIcon className="h-8 w-8 opacity-30" />
              <p className="text-sm">
                {hasActiveFilters
                  ? "No results match your filters."
                  : "No expired or unsent login links found."}
              </p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            displayed.map((a) => (
              <ResendLinksMobileCard
                key={a.id}
                assignment={a}
                onResend={() => openResend(a)}
              />
            ))
          )}
        </div>

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {lastPage}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= lastPage || isLoading}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Resend dialog ─────────────────────────────────────────────────── */}
        <ResendLinkConfirmDialog
          assignment={resendTarget}
          open={resendOpen}
          onOpenChange={setResendOpen}
          onResent={() => {
            setResendOpen(false)
            onMutated()
          }}
        />
      </div>
    </TooltipProvider>
  )
}
