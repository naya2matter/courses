// ─── Breadcrumb override context ──────────────────────────────────────────────
// Lets a detail page replace the generic leaf crumb (e.g. "Course Details") with
// a live entity name (e.g. the actual course title) once its data has loaded.
//
//   function MyPage() {
//     const { data } = useQuery(...)
//     useDynamicBreadcrumb(data?.title)   // header leaf shows the real title
//   }
//
// The override clears automatically when the page unmounts.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

interface BreadcrumbContextValue {
  /** Current leaf-label override, or null when the route default should show. */
  override: string | null
  setOverride: (label: string | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState<string | null>(null)
  const value = useMemo(() => ({ override, setOverride }), [override])
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

export function useBreadcrumbContext(): BreadcrumbContextValue {
  const ctx = useContext(BreadcrumbContext)
  // Safe no-op fallback so the hook never throws outside a provider.
  return ctx ?? { override: null, setOverride: () => {} }
}

/**
 * Override the current page's leaf breadcrumb with a live label. Pass a falsy
 * value (while loading) to keep the route's default label until data arrives.
 */
export function useDynamicBreadcrumb(label: string | null | undefined): void {
  const { setOverride } = useBreadcrumbContext()
  const stable = useCallback(setOverride, [setOverride])

  useEffect(() => {
    stable(label && label.trim() ? label.trim() : null)
    return () => stable(null)
  }, [label, stable])
}
