// ─── ExportCsvButtons ─────────────────────────────────────────────────────────
// Two export buttons: full CSV and summary CSV.
// Shows a loading spinner while downloading; toasts on success/failure.
// Ignores AbortError (in-flight cancellations) in the UI.

import { useState } from "react"
import { DownloadIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { isApiError } from "@/lib/api"
import {
  exportEvaluationHistoryCsv,
  exportEvaluationHistorySummaryCsv,
} from "../service/evaluation-history.service"
import type { EvaluationHistoryFilters } from "../types/evaluation-history.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExportCsvButtonsProps {
  filters: Partial<EvaluationHistoryFilters>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExportCsvButtons({ filters }: ExportCsvButtonsProps) {
  const [exportingFull, setExportingFull] = useState(false)
  const [exportingSummary, setExportingSummary] = useState(false)

  async function handleExport(type: "full" | "summary") {
    const isFull = type === "full"
    if (isFull) setExportingFull(true)
    else setExportingSummary(true)

    try {
      if (isFull) {
        await exportEvaluationHistoryCsv(filters)
      } else {
        await exportEvaluationHistorySummaryCsv(filters)
      }
      toast.success(
        isFull ? "Evaluation history exported." : "Summary exported.",
      )
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Export failed. Please try again."
      if (isApiError(err)) msg = err.message ?? msg
      else if (err instanceof Error) msg = err.message
      toast.error(msg)
    } finally {
      if (isFull) setExportingFull(false)
      else setExportingSummary(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => handleExport("full")}
        disabled={exportingFull}
      >
        {exportingFull ? (
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <DownloadIcon className="mr-2 h-4 w-4" />
        )}
        Export CSV
      </Button>

      <Button
        variant="outline"
        onClick={() => handleExport("summary")}
        disabled={exportingSummary}
      >
        {exportingSummary ? (
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <DownloadIcon className="mr-2 h-4 w-4" />
        )}
        Export Summary
      </Button>
    </>
  )
}
