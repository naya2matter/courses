// ─── Departments Entry Point ──────────────────────────────────────────────────
// Re-exports the full DepartmentsPageContent as the default export so that
// App.tsx and the router continue to import from this path without changes.

import { DepartmentsPageContent } from "./pages/departments-page"

export default function DepartmentsPage() {
  return <DepartmentsPageContent />
}
