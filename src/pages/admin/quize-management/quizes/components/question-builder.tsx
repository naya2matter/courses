// ─── Question Builder ─────────────────────────────────────────────────────────
// A dynamic form component for building quiz questions inline.

import { PlusIcon, Trash2Icon, GripVerticalIcon, CheckSquareIcon, CircleDotIcon, TypeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { CreateQuizQuestion, QuestionType } from "../types/quiz.types"

// ── Type helpers ──────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  radio: <CircleDotIcon className="h-3.5 w-3.5" />,
  checkbox: <CheckSquareIcon className="h-3.5 w-3.5" />,
  text: <TypeIcon className="h-3.5 w-3.5" />,
}

const TYPE_LABELS: Record<QuestionType, string> = {
  radio: "Single choice (radio)",
  checkbox: "Multiple choice (checkbox)",
  text: "Open-ended (text)",
}

function createEmptyQuestion(order: number): CreateQuizQuestion {
  return {
    question_text: "",
    type: "radio",
    points: 10,
    options: ["", ""],
    correct_answer: [],
    correct_answer_explanation: "",
    order,
  }
}

// ── Option row ────────────────────────────────────────────────────────────────

interface OptionRowProps {
  option: string
  index: number
  isCorrect: boolean
  disabled?: boolean
  onTextChange: (value: string) => void
  onCorrectToggle: (checked: boolean) => void
  onRemove: () => void
  canRemove: boolean
}

function OptionRow({
  option,
  index,
  isCorrect,
  disabled,
  onTextChange,
  onCorrectToggle,
  onRemove,
  canRemove,
}: OptionRowProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Correct-answer indicator */}
      <Checkbox
        checked={isCorrect}
        onCheckedChange={(checked) => onCorrectToggle(Boolean(checked))}
        disabled={disabled}
        aria-label={`Option ${index + 1} is correct`}
        className="shrink-0"
      />

      <Input
        value={option}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Option ${index + 1}`}
        disabled={disabled}
        className="h-8 text-sm"
      />

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove option"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

// ── Question card ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: CreateQuizQuestion
  index: number
  total: number
  disabled?: boolean
  onChange: (updated: CreateQuizQuestion) => void
  onRemove: () => void
}

function QuestionCard({ question, index, total, disabled, onChange, onRemove }: QuestionCardProps) {
  const needsOptions = question.type === "radio" || question.type === "checkbox"

  function updateField<K extends keyof CreateQuizQuestion>(key: K, value: CreateQuizQuestion[K]) {
    onChange({ ...question, [key]: value })
  }

  function handleTypeChange(type: QuestionType) {
    // Reset options/answers when switching type; text questions are manually graded
    onChange({
      ...question,
      type,
      points: type === "text" ? null : (question.points ?? 10),
      options: type !== "text" ? (question.options?.length ? question.options : ["", ""]) : [],
      correct_answer: [],
    })
  }

  function handleOptionText(optIdx: number, value: string) {
    const opts = [...(question.options ?? [])]
    opts[optIdx] = value
    onChange({ ...question, options: opts })
  }

  function handleCorrectToggle(optIdx: number, checked: boolean) {
    const optionText = (question.options ?? [])[optIdx]
    if (!optionText.trim()) return

    let answers = [...(question.correct_answer ?? [])]
    if (question.type === "radio") {
      answers = checked ? [optionText] : []
    } else {
      if (checked) {
        if (!answers.includes(optionText)) answers.push(optionText)
      } else {
        answers = answers.filter((a) => a !== optionText)
      }
    }
    onChange({ ...question, correct_answer: answers })
  }

  function addOption() {
    onChange({ ...question, options: [...(question.options ?? []), ""] })
  }

  function removeOption(optIdx: number) {
    const opts = (question.options ?? []).filter((_, i) => i !== optIdx)
    const removed = (question.options ?? [])[optIdx]
    const answers = (question.correct_answer ?? []).filter((a) => a !== removed)
    onChange({ ...question, options: opts, correct_answer: answers })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground/40 shrink-0 cursor-grab" />
          <span className="text-sm font-semibold text-muted-foreground">
            Question {index + 1}
          </span>
        </div>
        {total > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove question"
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Question text */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Question text *</Label>
        <Textarea
          value={question.question_text}
          onChange={(e) => updateField("question_text", e.target.value)}
          placeholder="Enter the question…"
          disabled={disabled}
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      {/* Type + Points row */}
      <div className={`grid gap-4 ${
        question.type === "text" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
      }`}>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Type *</Label>
          <Select
            value={question.type}
            onValueChange={(v) => handleTypeChange(v as QuestionType)}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["radio", "checkbox", "text"] as QuestionType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="flex items-center gap-2">
                    {TYPE_ICONS[t]}
                    {TYPE_LABELS[t]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {question.type !== "text" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Points *</Label>
            <Input
              type="number"
              min={0}
              value={question.points ?? ""}
              onChange={(e) =>
                updateField("points", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="e.g. 10"
              disabled={disabled}
              className="h-9 text-sm"
            />
          </div>
        )}
      </div>

      {question.type === "text" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <span className="mt-0.5 text-amber-400">&#9432;</span>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            <span className="font-semibold text-amber-400">Manual grading.</span>{" "}
            The admin will review this answer and assign points after the user submits.
          </p>
        </div>
      )}

      {/* Options (radio / checkbox only) */}
      {needsOptions && (
        <div className="space-y-2.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Options — check the correct answer(s)
          </Label>
          <div className="space-y-2">
            {(question.options ?? []).map((opt, optIdx) => (
              <OptionRow
                key={optIdx}
                option={opt}
                index={optIdx}
                isCorrect={(question.correct_answer ?? []).includes(opt) && opt.trim() !== ""}
                disabled={disabled}
                onTextChange={(val) => handleOptionText(optIdx, val)}
                onCorrectToggle={(checked) => handleCorrectToggle(optIdx, checked)}
                onRemove={() => removeOption(optIdx)}
                canRemove={(question.options ?? []).length > 2}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={addOption}
            disabled={disabled}
          >
            <PlusIcon className="h-3 w-3" />
            Add option
          </Button>
        </div>
      )}

      {/* Explanation */}
      {needsOptions && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Correct answer explanation (optional)
          </Label>
          <Textarea
            value={question.correct_answer_explanation ?? ""}
            onChange={(e) => updateField("correct_answer_explanation", e.target.value)}
            placeholder="Explain why the answer is correct…"
            disabled={disabled}
            rows={2}
            className="resize-none text-sm"
          />
        </div>
      )}
    </div>
  )
}

// ── QuestionBuilder (main export) ─────────────────────────────────────────────

interface QuestionBuilderProps {
  questions: CreateQuizQuestion[]
  disabled?: boolean
  onChange: (questions: CreateQuizQuestion[]) => void
}

export function QuestionBuilder({ questions, disabled, onChange }: QuestionBuilderProps) {
  function addQuestion() {
    onChange([...questions, createEmptyQuestion(questions.length + 1)])
  }

  function updateQuestion(index: number, updated: CreateQuizQuestion) {
    const next = [...questions]
    next[index] = { ...updated, order: index + 1 }
    onChange(next)
  }

  function removeQuestion(index: number) {
    const next = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i + 1 }))
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <QuestionCard
          key={i}
          question={q}
          index={i}
          total={questions.length}
          disabled={disabled}
          onChange={(updated) => updateQuestion(i, updated)}
          onRemove={() => removeQuestion(i)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-dashed border-white/20 hover:border-white/40"
        onClick={addQuestion}
        disabled={disabled}
      >
        <PlusIcon className="h-4 w-4" />
        Add question
      </Button>
    </div>
  )
}
