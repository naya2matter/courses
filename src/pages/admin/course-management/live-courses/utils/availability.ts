import type { AvailabilityPayload } from "../types/course.types"

export interface CourseAvailabilityDisplay extends AvailabilityPayload {
  available_spots?: number
  is_full?: boolean
}

export function parseAvailabilities(availabilities: unknown): CourseAvailabilityDisplay[] {
  if (!availabilities) return []
  try {
    let parsed = availabilities
    if (typeof availabilities === "string") {
      parsed = JSON.parse(availabilities)
    }
    
    if (Array.isArray(parsed)) {
      return parsed as CourseAvailabilityDisplay[]
    }
    
    if (typeof parsed === "object" && parsed !== null) {
      return [parsed as CourseAvailabilityDisplay]
    }
  } catch {
    return []
  }
  return []
}
