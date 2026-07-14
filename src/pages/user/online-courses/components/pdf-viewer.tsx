// ─── Online Course PDF Viewer ─────────────────────────────────────────────────
// Renders the signed PDF URL with react-pdf, one page at a time. Page turns are
// the unit of progress: we track the set of unique pages seen and POST to
// /progress/pdf (debounced). The signed URL needs no auth header.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  AlertCircleIcon,
  ZoomInIcon,
  ZoomOutIcon,
  DownloadIcon,
} from "lucide-react"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import { Button } from "@/components/ui/button"
import { updatePdfProgress } from "../service/user-online-courses.service"

// Resolve the pdf.js worker from the installed pdfjs-dist (version-matched to
// react-pdf, which avoids the "API/Worker version mismatch" error).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const SAVE_DEBOUNCE_MS = 800
const ZOOM_STEP = 0.2
const ZOOM_MIN = 0.6
const ZOOM_MAX = 2.4

interface Props {
  src: string
  courseId: number
  contentId: number
  totalPages: number | null
  resumePage: number
  fileName?: string
  onProgress?: (completionPercentage: number, isCompleted: boolean) => void
}

export function PdfViewer({ src, courseId, contentId, totalPages, resumePage, fileName, onProgress }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [numPages, setNumPages] = useState<number>(totalPages ?? 0)
  const [pageNumber, setPageNumber] = useState<number>(Math.max(1, Math.floor(resumePage) || 1))
  const [width, setWidth] = useState<number>(800)
  const [scale, setScale] = useState<number>(1)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const viewedRef = useRef<Set<number>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Seed the viewed set with everything up to the resume page (already seen).
  useEffect(() => {
    const start = Math.max(1, Math.floor(resumePage) || 1)
    for (let p = 1; p <= start; p++) viewedRef.current.add(p)
  }, [resumePage])

  // Keep the rendered page width in sync with the container.
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(Math.min(Math.floor(w), 1100))
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const effectiveTotal = totalPages ?? numPages

  const flushProgress = useCallback(
    (page: number) => {
      const total = totalPages ?? numPages
      if (!total) return
      void updatePdfProgress({
        content_id: contentId,
        course_online_id: courseId,
        pages_viewed: viewedRef.current.size,
        total_pages: total,
        current_page: page,
      })
        .then((res) => onProgress?.(res.completion_percentage, res.is_completed))
        .catch(() => {
          /* best-effort */
        })
    },
    [contentId, courseId, totalPages, numPages, onProgress],
  )

  const recordPage = useCallback(
    (page: number) => {
      viewedRef.current.add(page)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => flushProgress(page), SAVE_DEBOUNCE_MS)
    },
    [flushProgress],
  )

  // Record the initial / resumed page once the document is ready.
  function onDocumentLoadSuccess({ numPages: n }: { numPages: number }) {
    setNumPages(n)
    setLoadError(null)
    const start = Math.min(Math.max(1, pageNumber), n)
    setPageNumber(start)
    recordPage(start)
  }

  function goToPage(next: number) {
    const total = effectiveTotal || 1
    const clamped = Math.min(Math.max(1, next), total)
    if (clamped === pageNumber) return
    setPageNumber(clamped)
    recordPage(clamped)
  }

  // Flush any pending save on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // react-pdf reloads the document whenever `file`/`options` identity changes —
  // memoize both so a parent re-render doesn't refetch the PDF.
  const file = useMemo(() => ({ url: src }), [src])
  const options = useMemo(() => ({}), [])

  const pagesViewed = viewedRef.current.size
  const viewedPct = effectiveTotal ? Math.round((pagesViewed / effectiveTotal) * 100) : 0

  const handleDownload = useCallback(async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const res = await fetch(src)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const base = (fileName || "document").replace(/[/\\?%*:|"<>]/g, "-").trim()
      const name = base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      // Fall back to opening the signed URL directly in a new tab.
      window.open(src, "_blank", "noopener,noreferrer")
    } finally {
      setIsDownloading(false)
    }
  }, [src, fileName, isDownloading])

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-card/50 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1}
            className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="min-w-[5.5rem] text-center text-xs font-medium tabular-nums text-white/70">
            Page {pageNumber} / {effectiveTotal || "—"}
          </span>
          <Button variant="ghost" size="icon" onClick={() => goToPage(pageNumber + 1)} disabled={!!effectiveTotal && pageNumber >= effectiveTotal}
            className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30">
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-white/40 tabular-nums">{viewedPct}% read</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download PDF"
            className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {isDownloading ? <Loader2Icon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(ZOOM_MIN, +(s - ZOOM_STEP).toFixed(2)))}
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white" title="Zoom out">
              <ZoomOutIcon className="size-4" />
            </Button>
            <span className="w-10 text-center text-[11px] tabular-nums text-white/50">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(ZOOM_MAX, +(s + ZOOM_STEP).toFixed(2)))}
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white" title="Zoom in">
              <ZoomInIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div ref={containerRef} className="flex min-h-[60vh] justify-center overflow-auto rounded-2xl border border-white/8 bg-[#0c0c14] p-4">
        {loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-white/50">
            <AlertCircleIcon className="size-8 text-rose-400/70" />
            <p className="text-sm">{loadError}</p>
          </div>
        ) : (
          <Document
            file={file}
            options={options}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(e) => setLoadError(e?.message || "Failed to load this PDF.")}
            loading={
              <div className="flex items-center gap-2 py-20 text-sm text-white/40">
                <Loader2Icon className="size-5 animate-spin" /> Loading document…
              </div>
            }
            error={
              <div className="flex flex-col items-center gap-2 py-20 text-sm text-rose-400/70">
                <AlertCircleIcon className="size-6" /> Failed to load this PDF.
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={width}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer
              className="overflow-hidden rounded-lg shadow-2xl [&_canvas]:!rounded-lg"
              loading={
                <div className="flex items-center gap-2 py-20 text-sm text-white/40">
                  <Loader2Icon className="size-5 animate-spin" /> Rendering page…
                </div>
              }
            />
          </Document>
        )}
      </div>
    </div>
  )
}
