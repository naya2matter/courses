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
