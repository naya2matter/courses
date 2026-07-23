// ─── useOnlineReport Hook ─────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react"
import { isApiError } from "@/lib/api"
import {
  getUserCourseDaily,
  getDeptCourseDaily,
  getSessionFact,
  getUserPerformance,
  getUserCourseProgress,
  getDeptEvalPerformance,
} from "../service/online-report.service"
import type {
  UserCourseDailyFilters,
  DeptCourseDailyFilters,
  SessionFactFilters,
  UserPerfFilters,
  UserCourseProgressFilters,
  DeptEvalFilters,
  UserCourseDailyRow,
  DeptCourseDailyRow,
  SessionFactRow,
  UserPerformanceRow,
  UserCourseProgressRow,
  DeptEvalData,
  PaginationMeta,
} from "../types/online-report.types"

export const DEFAULT_UCD: UserCourseDailyFilters = { date_from: "", date_to: "", department_id: "", course_online_id: "", user_id: "", page: 1, per_page: 15 }
export const DEFAULT_DCD: DeptCourseDailyFilters = { date_from: "", date_to: "", department_id: "", course_online_id: "", page: 1, per_page: 15 }
export const DEFAULT_SF: SessionFactFilters = { date_from: "", date_to: "", department_id: "", course_online_id: "", user_id: "", is_suspicious: "", page: 1, per_page: 15 }
export const DEFAULT_UP: UserPerfFilters = { date_from: "", date_to: "", department_id: "", course_online_id: "", page: 1, per_page: 15 }
export const DEFAULT_UCP: UserCourseProgressFilters = { date_from: "", date_to: "", department_id: "", course_online_id: "", status: "", page: 1, per_page: 15 }
export const DEFAULT_DE: DeptEvalFilters = { course_type: "" }

function makeSlice<T>() {
  return { data: [] as T[], meta: null as PaginationMeta | null, isLoading: true, error: null as string | null }
}

function extractError(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") return ""
  if (isApiError(err)) return err.message ?? "Request failed."
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

export type OnlineReportTab = "ucd" | "dcd" | "sf" | "up" | "ucp" | "de"

/**
 * Only the active tab's dataset is fetched (on open and whenever its filters
 * change). This avoids firing all six heavy report queries at once on mount —
 * the load storm that made the page intermittently "fail to fetch".
 */
export function useOnlineReport(activeTab: OnlineReportTab) {
  const [ucdFilters, setUcdFilters] = useState<UserCourseDailyFilters>(DEFAULT_UCD)
  const [ucd, setUcd] = useState(makeSlice<UserCourseDailyRow>())
  const fetchUcd = useCallback(async (f: UserCourseDailyFilters) => {
    setUcd((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getUserCourseDaily(f)
      setUcd({ data: res.data ?? [], meta: res.meta ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setUcd((p) => ({ ...p, isLoading: false })); return }
      setUcd((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])
  useEffect(() => { if (activeTab === "ucd") fetchUcd(ucdFilters) }, [activeTab, ucdFilters, fetchUcd])

  const [dcdFilters, setDcdFilters] = useState<DeptCourseDailyFilters>(DEFAULT_DCD)
  const [dcd, setDcd] = useState(makeSlice<DeptCourseDailyRow>())
  const fetchDcd = useCallback(async (f: DeptCourseDailyFilters) => {
    setDcd((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getDeptCourseDaily(f)
      setDcd({ data: res.data ?? [], meta: res.meta ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setDcd((p) => ({ ...p, isLoading: false })); return }
      setDcd((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])
  useEffect(() => { if (activeTab === "dcd") fetchDcd(dcdFilters) }, [activeTab, dcdFilters, fetchDcd])

  const [sfFilters, setSfFilters] = useState<SessionFactFilters>(DEFAULT_SF)
  const [sf, setSf] = useState(makeSlice<SessionFactRow>())
  const fetchSf = useCallback(async (f: SessionFactFilters) => {
    setSf((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getSessionFact(f)
      setSf({ data: res.data ?? [], meta: res.meta ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setSf((p) => ({ ...p, isLoading: false })); return }
      setSf((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])
  useEffect(() => { if (activeTab === "sf") fetchSf(sfFilters) }, [activeTab, sfFilters, fetchSf])

  const [upFilters, setUpFilters] = useState<UserPerfFilters>(DEFAULT_UP)
  const [up, setUp] = useState(makeSlice<UserPerformanceRow>())
  const fetchUp = useCallback(async (f: UserPerfFilters) => {
    setUp((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getUserPerformance(f)
      setUp({ data: res.data ?? [], meta: res.meta ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setUp((p) => ({ ...p, isLoading: false })); return }
      setUp((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])
  useEffect(() => { if (activeTab === "up") fetchUp(upFilters) }, [activeTab, upFilters, fetchUp])

  const [ucpFilters, setUcpFilters] = useState<UserCourseProgressFilters>(DEFAULT_UCP)
  const [ucp, setUcp] = useState(makeSlice<UserCourseProgressRow>())
  const fetchUcp = useCallback(async (f: UserCourseProgressFilters) => {
    setUcp((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getUserCourseProgress(f)
      setUcp({ data: res.data ?? [], meta: res.meta ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setUcp((p) => ({ ...p, isLoading: false })); return }
      setUcp((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])
  useEffect(() => { if (activeTab === "ucp") fetchUcp(ucpFilters) }, [activeTab, ucpFilters, fetchUcp])

  const [deFilters, setDeFilters] = useState<DeptEvalFilters>(DEFAULT_DE)
  const [de, setDe] = useState<{ data: DeptEvalData | null; isLoading: boolean; error: string | null }>(
    { data: null, isLoading: true, error: null }
  )
  const fetchDe = useCallback(async (f: DeptEvalFilters) => {
    setDe((p) => ({ ...p, isLoading: true, error: null }))
    try {
      const res = await getDeptEvalPerformance(f)
      setDe({ data: res.data ?? null, isLoading: false, error: null })
    } catch (err) {
      const msg = extractError(err)
      if (!msg) { setDe((p) => ({ ...p, isLoading: false })); return }
      setDe((p) => ({ ...p, isLoading: false, error: msg }))
    }
  }, [])
  useEffect(() => { if (activeTab === "de") fetchDe(deFilters) }, [activeTab, deFilters, fetchDe])

  return {
    ucd, ucdFilters, setUcdFilters, setUcdPage: (p: number) => setUcdFilters((f) => ({ ...f, page: p })), refetchUcd: () => fetchUcd(ucdFilters),
    dcd, dcdFilters, setDcdFilters, setDcdPage: (p: number) => setDcdFilters((f) => ({ ...f, page: p })), refetchDcd: () => fetchDcd(dcdFilters),
    sf, sfFilters, setSfFilters, setSfPage: (p: number) => setSfFilters((f) => ({ ...f, page: p })), refetchSf: () => fetchSf(sfFilters),
    up, upFilters, setUpFilters, setUpPage: (p: number) => setUpFilters((f) => ({ ...f, page: p })), refetchUp: () => fetchUp(upFilters),
    ucp, ucpFilters, setUcpFilters, setUcpPage: (p: number) => setUcpFilters((f) => ({ ...f, page: p })), refetchUcp: () => fetchUcp(ucpFilters),
    de, deFilters, setDeFilters, refetchDe: () => fetchDe(deFilters),
  }
}
