import { isApiError } from "@/lib/api"

export function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

export function extractCourseErrorMessage(err: unknown, fallback: string): string {
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      const messages = Object.values(err.data.errors as Record<string, string[]>)
        .flat()
        .filter(Boolean)
      if (messages.length > 0) return messages.join(" • ")
    }

    return err.message || fallback
  }

  if (err instanceof Error) return err.message || fallback
  return fallback
}
