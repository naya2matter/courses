import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const glass = `
  bg-white/5
  backdrop-blur-xl
  border border-white/10
  shadow-[0_8px_32px_rgba(0,0,0,0.3)]
`

/**
 * Convert rich HTML (from the admin editor) into a plain-text excerpt.
 * Use for compact cards/list rows where rendering markup would leak tags.
 * For full detail views, render the HTML with `dangerouslySetInnerHTML` instead.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ""
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}
