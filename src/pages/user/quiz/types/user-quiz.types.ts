// ─── User Quiz Types ──────────────────────────────────────────────────────────
// TypeScript shapes for all user-side quiz API responses and request bodies.

export type QuizStatus = "draft" | "published" | "archived"
export type QuestionType = "radio" | "checkbox" | "text"
export type ShowCorrectAnswers = "never" | "after_pass" | "after_max_attempts" | "always"

// ── Question shape (without correct answers) ─────────────────────────────────

export interface UserQuizQuestion {
  id: number
  question_text: string
  type: QuestionType
  points: number | null
  options?: string[]
  order?: number | null
  // correct_answer is intentionally omitted — not returned by user endpoints
}

// ── Quiz list item ────────────────────────────────────────────────────────────

export interface UserQuizListItem {
  id: number
  title: string
  description?: string | null
  total_points?: number | null
  max_attempts?: number | null
  retry_delay_hours?: number | null
  time_limit_minutes?: number | null
  status?: QuizStatus | null
  pass_threshold?: number | null
  deadline?: string | null
  questions_count?: number | null
  show_correct_answers?: ShowCorrectAnswers | null
  created_at?: string | null
  updated_at?: string | null
  // attempt summary included in list
  attempts_count?: number | null
  last_attempt?: UserQuizAttemptSummary | null
  /** True when the latest attempt has open-text answers awaiting manual grading. */
  user_result_pending?: boolean
}

// ── Full quiz (returned by getById) ─────────────────────────────────────────

export interface UserQuizDetail extends UserQuizListItem {
  questions?: UserQuizQuestion[]
  user_passed?: boolean | null
  user_total_score?: number | null
}

// ── Answer item inside an attempt ────────────────────────────────────────────

export interface UserQuizAnswer {
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
    options?: string[]
    correct_answer?: string[]
    correct_answer_explanation?: string | null
  }
}

// ── Attempt summary (embedded in list items) ─────────────────────────────────

export interface UserQuizAttemptSummary {
  id: number
  status?: string | null
  started_at?: string | null
  submitted_at?: string | null
  score?: number | null
  total_points?: number | null
  passed?: boolean | null
}

// ── Full attempt resource (returned by start/submit/result) ──────────────────

export interface UserQuizAttemptResource {
  id: number
  quiz_id: number
  user_id: number
  attempt_number?: number | null
  status?: string | null
  started_at?: string | null
  completed_at?: string | null
  submitted_at?: string | null
  score?: number | null
  manual_score?: number | null
  total_score?: number | null
  total_points?: number | null
  passed?: boolean | null
  answers?: UserQuizAnswer[]
  quiz?: UserQuizDetail
  created_at?: string | null
  updated_at?: string | null
}

// ── Submit payload ────────────────────────────────────────────────────────────

export interface SubmitAnswerItem {
  quiz_question_id: number
  answer: string
}

export interface SubmitQuizPayload {
  answers: SubmitAnswerItem[]
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface UserQuizListResponse {
  data: UserQuizListItem[]
  meta?: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
  links?: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

export interface UserQuizDetailResponse {
  data: UserQuizDetail
}

export interface UserQuizAttemptResponse {
  data: UserQuizAttemptResource
}
