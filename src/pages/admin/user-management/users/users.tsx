// ─── Users Entry Point ────────────────────────────────────────────────────────
// Re-exports UsersPageContent as the default so the router keeps working
// without any route configuration changes.

import { UsersPageContent } from "./pages/users-page"

export default function UsersPage() {
  return <UsersPageContent />
}
