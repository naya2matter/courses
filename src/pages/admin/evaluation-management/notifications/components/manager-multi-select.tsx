// ─── ManagerMultiSelect ───────────────────────────────────────────────────────
// Scrollable checkbox list of users loaded from the existing users API.
// Lets admin select multiple managers to receive evaluation reports.

import { useEffect, useState } from "react"
import { CheckIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import { isApiError } from "@/lib/api"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface ManagerMultiSelectProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
  error?: string | null
  /** When set, only users in this department are loaded (server-side filter). */
  departmentId?: number | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ManagerMultiSelect({
  selectedIds,
  onChange,
  error,
  departmentId = null,
}: ManagerMultiSelectProps) {
  const [users, setUsers] = useState<UserListResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    getAllUsers({ per_page: 100, ...(departmentId ? { department_id: departmentId } : {}) })
      .then((res) => {
        if (!cancelled) setUsers(res.data ?? [])
      })
      .catch((err) => {
        if (cancelled) return
        let msg = "Failed to load users."
        if (isApiError(err)) msg = err.message ?? msg
        else if (err instanceof Error) msg = err.message
        setLoadError(msg)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [departmentId])

  const filtered = users.filter((u) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.department?.name ?? "").toLowerCase().includes(term)
    )
  })

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function clearAll() {
    onChange([])
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users…"
          className="pl-9 h-8 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Selection info */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{selectedIds.length} selected</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={clearAll}
          >
            <XIcon className="size-3" />
            Clear
          </Button>
        </div>
      )}

      {/* List */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/5">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : loadError ? (
          <p className="p-3 text-xs text-red-400">{loadError}</p>
        ) : filtered.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">No users found.</p>
        ) : (
          filtered.map((user) => {
            const isSelected = selectedIds.includes(user.id)
            return (
              <button
                key={user.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => toggle(user.id)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  isSelected ? "bg-primary/10" : ""
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/30 bg-transparent"
                  }`}
                >
                  {isSelected && <CheckIcon className="size-2.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-muted-foreground">{user.email}</p>
                </div>
                {user.department && (
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] bg-white/10 text-white/60">
                    {user.department.name}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Loading indicator for async */}
      {isLoading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2Icon className="size-3 animate-spin" />
          Loading users…
        </p>
      )}

      {/* Validation error */}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
