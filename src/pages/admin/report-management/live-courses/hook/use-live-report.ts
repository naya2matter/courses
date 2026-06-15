// ─── useLiveReport Hook ───────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react"
import { isApiError } from "@/lib/api"
import {
  getCourseRegistrations,
  getAttendance,
  getCourseCompletion,
} from "../service/live-report.service"
import type {
  CourseRegistration,
  AttendanceRecord,
  CourseCompletion,
  RegistrationFilters,
  AttendanceFilters,
  CompletionFilters,
  PaginationMeta,
} from "../types/live-report.types"

export type LiveTab = "registrations" | "attendance" | "completion"

export const DEFAULT_REG_FILTERS: RegistrationFilters = {
  date_from: "", date_to: "", department_id: "", course_id: "", status: "", page: 1, per_page: 15,
}
export const DEFAULT_ATT_FILTERS: AttendanceFilters = {
  date_from: "", date_to: "", department_id: "", course_id: "", page: 1, per_page: 15,
}
export const DEFAULT_COMP_FILTERS: CompletionFilters = {
  date_from: "", date_to: "", department_id: "", course_id: "", page: 1, per_page: 15,
}

function makeSlice<T>(initial: T[]) {
  return {
    data: initial,
    meta: null as PaginationMeta | null,
    isLoading: true,
    error: null as string | null,
  }
}

function extractError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") return ""
  if (isApiError(err)) return err.message ?? "Request failed."
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

export function useLiveReport() {
  // ── Registrations ──────────────────────────────────────────────────────────
  const [regFilters, setRegFilters] = useState<RegistrationFilters>(DEFAULT_REG_FILTERS)
  const [regs, setRegs] = useState(makeSlice<CourseRegistration>([]))

  const fetchRegs = useCallback(async (f: RegistrationFilters) => {
    setRegs((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getCourseRegistrations(f)
      setRegs({ data: res.data ?? [], meta: res.meta ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setRegs((p) => ({ ...p, isLoading: false })); return }
      setRegs((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])

  useEffect(() => { fetchRegs(regFilters) }, [regFilters, fetchRegs])

  // ── Attendance ─────────────────────────────────────────────────────────────
  const [attFilters, setAttFilters] = useState<AttendanceFilters>(DEFAULT_ATT_FILTERS)
  const [att, setAtt] = useState(makeSlice<AttendanceRecord>([]))

  const fetchAtt = useCallback(async (f: AttendanceFilters) => {
    setAtt((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getAttendance(f)
      setAtt({ data: res.data ?? [], meta: res.meta ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setAtt((p) => ({ ...p, isLoading: false })); return }
      setAtt((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])

  useEffect(() => { fetchAtt(attFilters) }, [attFilters, fetchAtt])

  // ── Completion ─────────────────────────────────────────────────────────────
  const [compFilters, setCompFilters] = useState<CompletionFilters>(DEFAULT_COMP_FILTERS)
  const [comp, setComp] = useState(makeSlice<CourseCompletion>([]))

  const fetchComp = useCallback(async (f: CompletionFilters) => {
    setComp((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getCourseCompletion(f)
      setComp({ data: res.data ?? [], meta: res.meta ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setComp((p) => ({ ...p, isLoading: false })); return }
      setComp((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])

  useEffect(() => { fetchComp(compFilters) }, [compFilters, fetchComp])

  return {
    regs, regFilters, setRegFilters,
    setRegPage: (page: number) => setRegFilters((p) => ({ ...p, page })),
    refetchRegs: () => fetchRegs(regFilters),

    att, attFilters, setAttFilters,
    setAttPage: (page: number) => setAttFilters((p) => ({ ...p, page })),
    refetchAtt: () => fetchAtt(attFilters),

    comp, compFilters, setCompFilters,
    setCompPage: (page: number) => setCompFilters((p) => ({ ...p, page })),
    refetchComp: () => fetchComp(compFilters),
  }
}
