// ─── Quiz Types ───────────────────────────────────────────────────────────────
// All TypeScript shapes for the Quiz Management feature.

export type QuizStatus = "draft" | "published" | "archived"
export type QuestionType = "radio" | "checkbox" | "text"
export type ShowCorrectAnswers = "never" | "after_pass" | "after_max_attempts" | "always"

// ── Resource shapes ───────────────────────────────────────────────────────────

export interface QuizQuestion {
  id?: number
  question_text: string
  type: QuestionType
  points: number | null
  options?: string[]
  correct_answer?: string[]
  correct_answer_explanation?: string | null
  order?: number | null
  quiz_id?: number
  created_at?: string | null
  updated_at?: string | null
}

export interface QuizResource {
  id: number
  title: string
  description?: string | null
  course_id?: number | null
  course_online_id?: number | null
  module_id?: number | null
  required_to_proceed?: boolean | null
  max_attempts?: number | null
  retry_delay_hours?: number | null
  show_correct_answers?: ShowCorrectAnswers | null
  deadline?: string | null
  time_limit_minutes?: number | null
  status?: QuizStatus | null
  pass_threshold?: number | null
  questions?: QuizQuestion[]
  questions_count?: number | null
  created_at?: string | null
  updated_at?: string | null
}

// ── Create/update payloads ────────────────────────────────────────────────────

export interface CreateQuizQuestion {
  question_text: string
  type: QuestionType
  points: number | null
  options?: string[]
  correct_answer?: string[]
  correct_answer_explanation?: string | null
  order?: number | null
}

export interface CreateQuizPayload {
  title: string
  description?: string | null
  course_id?: number | null
  course_online_id?: number | null
  module_id?: number | null
  required_to_proceed?: boolean | null
  max_attempts?: number | null
  retry_delay_hours?: number | null
  show_correct_answers?: ShowCorrectAnswers | null
  deadline?: string | null
  time_limit_minutes?: number | null
  status?: QuizStatus | null
  pass_threshold?: number | null
  questions?: CreateQuizQuestion[]
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface QuizListFilters {
  status?: QuizStatus | ""
  course_id?: number | null
  page?: number
  per_page?: number
}

// ── Laravel pagination ────────────────────────────────────────────────────────

export interface LaravelMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface LaravelPaginatedQuizzes {
  data: QuizResource[]
  meta: LaravelMeta
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

// ── Question payloads ────────────────────────────────────────────────────────

export interface CreateQuestionPayload {
  question_text: string
  type: QuestionType
  points: number | null
  options?: string[]
  correct_answer?: string[]
  correct_answer_explanation?: string | null
  order?: number | null
}

export interface UpdateQuestionPayload {
  question_text?: string
  type?: QuestionType
  points?: number | null
  options?: string[]
  correct_answer?: string[]
  correct_answer_explanation?: string | null
  order?: number
}

// ── Grading ───────────────────────────────────────────────────────────────────

export interface GradeAnswerPayload {
  points_earned: number
}

export interface QuizAnswerAdminResource {
  id: number
  quiz_attempt_id: number
  quiz_question_id: number
  answer: string | null
  points_earned: number | null
  is_correct: boolean | null
  graded_at?: string | null
  question?: {
    id: number
    question_text: string
    type: QuestionType
    points: number | null
  }
  created_at?: string | null
  updated_at?: string | null
}

// ── Attempts ──────────────────────────────────────────────────────────────────

export interface QuizAttemptUser {
  id: number
  name: string
  email: string
}

export interface QuizAttemptAdminResource {
  id: number
  quiz_id: number
  user_id: number
  user?: QuizAttemptUser
  started_at?: string | null
  submitted_at?: string | null
  score?: number | null
  total_points?: number | null
  passed?: boolean | null
  answers?: QuizAnswerAdminResource[]
  created_at?: string | null
  updated_at?: string | null
}

// ── Zustand store state ───────────────────────────────────────────────────────

export interface QuizState {
  items: QuizResource[]
  meta: LaravelMeta | null
  isLoading: boolean
  error: string | null
  filters: QuizListFilters
  fetchQuizzes: (filters?: QuizListFilters) => Promise<void>
  setFilters: (filters: QuizListFilters) => void
  clearError: () => void
}
