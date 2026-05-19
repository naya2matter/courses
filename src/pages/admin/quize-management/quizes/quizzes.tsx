// ─── Quizzes Entry Point ──────────────────────────────────────────────────────
// Re-exports the quiz list page as the default export for the router.

import { QuizzesPageContent } from "./pages/quizzes-page"

export default function QuizzesPage() {
  return <QuizzesPageContent />
}

export { CreateQuizPage } from "./pages/create-quiz-page"
export { ViewQuizPage } from "./pages/view-quiz-page"
export { EditQuizPage } from "./pages/edit-quiz-page"
export { ViewAttemptPage } from "./pages/view-attempt-page"
