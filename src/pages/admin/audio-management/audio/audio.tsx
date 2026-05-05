// ─── Audio Entry Point ────────────────────────────────────────────────────────
// Re-exports AudioPageContent as the default export so the router works
// without any route configuration changes.

import { AudioPageContent } from "./pages/audio-page"

export default function AudioManagementPage() {
  return <AudioPageContent />
}
