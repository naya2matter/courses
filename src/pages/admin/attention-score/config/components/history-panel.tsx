// ─── Config Version History Panel ──────────────────────────────────────────────
// Read-only list of every past config version, newest first, with a Restore
// action that clones an old version into a new active one (never edits in place).

import { Loader2Icon, RotateCcwIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AttentionScoreConfigHistoryItem } from "../types/attention-score.types"

interface HistoryPanelProps {
  history: AttentionScoreConfigHistoryItem[]
  isSaving: boolean
  onRestore: (id: number) => void
}

export function HistoryPanel({ history, isSaving, onRestore }: HistoryPanelProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No config versions yet.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Created by</TableHead>
          <TableHead>Created at</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.created_by ?? "—"}</TableCell>
            <TableCell>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</TableCell>
            <TableCell>
              {item.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Archived</Badge>}
            </TableCell>
            <TableCell>
              {!item.is_active && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => onRestore(item.id)}
                >
                  {isSaving ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcwIcon className="mr-2 h-4 w-4" />}
                  Restore
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
