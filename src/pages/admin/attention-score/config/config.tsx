// ─── Attention Score Config Page ───────────────────────────────────────────────
// Lets the client edit every weight/band/threshold in the Attention Score
// formula himself, preview the effect against known worked examples, save
// (which triggers a background recalculation of all historical sessions),
// and browse/restore past versions.

import { useState } from "react"
import { AlertCircleIcon, Loader2Icon, RotateCcwIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ConfigEditorForm } from "./components/config-editor-form"
import { PreviewPanel } from "./components/preview-panel"
import { RecalculationProgress } from "./components/recalculation-progress"
import { HistoryPanel } from "./components/history-panel"
import { SaveConfirmDialog } from "./components/save-confirm-dialog"
import { useAttentionScoreConfig } from "./hook/use-attention-score-config"

export default function AttentionScoreConfigPage() {
  const {
    draftConfig,
    draftName,
    history,
    previewResults,
    recalculationJob,
    isLoading,
    isPreviewing,
    isSaving,
    error,
    setDraftConfig,
    setDraftName,
    resetDraftToActive,
    preview,
    save,
    restore,
    clearError,
  } = useAttentionScoreConfig()

  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleConfirmSave() {
    try {
      await save()
      setConfirmOpen(false)
      toast.success("Config saved. Recalculating historical sessions…")
    } catch {
      // error already surfaced in the store; keep the dialog open so the
      // client can see the failure and retry without losing their edits.
    }
  }

  async function handleRestore(id: number) {
    try {
      await restore(id)
      toast.success("Restored. Recalculating historical sessions…")
    } catch {
      // error already surfaced in the store
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attention Score Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Edit every number the Attention Score formula uses. Saving recalculates all historical
          sessions, reports, and counts automatically.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={clearError}>
            Dismiss
          </Button>
        </Alert>
      )}

      <RecalculationProgress job={recalculationJob} />

      {isLoading || !draftConfig ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="h-4 w-4 animate-spin" /> Loading current config…
        </div>
      ) : (
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6 pt-4">
            <div className="max-w-md space-y-2">
              <Label>Config name</Label>
              <Input
                value={draftName}
                disabled={isSaving}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. August 2026 adjustment"
              />
            </div>

            <ConfigEditorForm config={draftConfig} onChange={setDraftConfig} disabled={isSaving} />

            <PreviewPanel results={previewResults} isPreviewing={isPreviewing} onPreview={preview} />

            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => setConfirmOpen(true)} disabled={isSaving}>
                <SaveIcon className="mr-2 h-4 w-4" /> Save & Recalculate
              </Button>
              <Button type="button" variant="outline" onClick={resetDraftToActive} disabled={isSaving}>
                <RotateCcwIcon className="mr-2 h-4 w-4" /> Discard changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            <HistoryPanel history={history} isSaving={isSaving} onRestore={handleRestore} />
          </TabsContent>
        </Tabs>
      )}

      <SaveConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        isSaving={isSaving}
        onConfirm={handleConfirmSave}
      />
    </div>
  )
}
