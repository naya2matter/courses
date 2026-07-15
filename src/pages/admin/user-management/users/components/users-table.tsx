// ─── Users Table ──────────────────────────────────────────────────────────────
// Paginated user list with search, department/level/tier filters,
// inline detail sheet, delete dialog, and pagination.

import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2Icon,
  CalendarClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FilterXIcon,
  LayersIcon,
  Loader2Icon,
  MailIcon,
  PencilIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
  UserCogIcon,
  UserIcon,
  UserRoundIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DatePickerField } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SortableHead, PerPageSelect, nextSort } from "@/components/ui/table-controls"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useDepartmentOptions } from "../hook/use-department-options"
import { useUserLevelTierOptions } from "../hook/use-user-level-tier-options"
import { getUserById } from "../service/user.service"
import type {
  PaginationMeta,
  UserListFilters,
  UserListResource,
  UserResource,
} from "../types/user.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
      {role}
    </Badge>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  )
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[18px_110px_1fr] items-start gap-2 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0 break-words text-foreground">{value}</div>
    </div>
  )
}

const NONE = "__none__"

// ── Props ─────────────────────────────────────────────────────────────────────

interface UsersTableProps {
  users: UserListResource[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: UserListFilters
  onFilterChange: (filters: UserListFilters) => void
  onDeleteUser: (userId: number) => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UsersTable({
  users,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onDeleteUser,
}: UsersTableProps) {
  const navigate = useNavigate()

  // ── Local state ─────────────────────────────────────────────────────────────
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")
  const searchMounted = useRef(false)
  const [userToDelete, setUserToDelete] = useState<UserListResource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Sheet state ──────────────────────────────────────────────────────────────
  const [sheetUserId, setSheetUserId] = useState<number | null>(null)
  const [sheetUser, setSheetUser] = useState<UserResource | null>(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetError, setSheetError] = useState<string | null>(null)

  // ── Filter option hooks ──────────────────────────────────────────────────────
  const { departments, isLoadingOptions: loadingDepts } = useDepartmentOptions()
  const { levels, isLoadingTierOptions: loadingTiers } = useUserLevelTierOptions()

  // All tiers flattened, prefixed with level name for disambiguation
  const allTierOptions = useMemo(
    () =>
      levels.flatMap((l) =>
        l.tiers
          .slice()
          .sort((a, b) => a.tier_order - b.tier_order)
          .map((t) => ({ id: t.id, label: `${l.name} / ${t.tier_name}` })),
      ),
    [levels],
  )

  // Fetch full user when sheet opens
  useEffect(() => {
    if (!sheetUserId) {
      setSheetUser(null)
      setSheetError(null)
      return
    }
    let cancelled = false
    setSheetLoading(true)
    setSheetError(null)

    getUserById(sheetUserId)
      .then((data) => { if (!cancelled) setSheetUser(data) })
      .catch((err) => {
        if (!cancelled)
          setSheetError(err instanceof Error ? err.message : "Failed to load user.")
      })
      .finally(() => { if (!cancelled) setSheetLoading(false) })

    return () => { cancelled = true }
  }, [sheetUserId])

  // Debounce search — skip the initial mount so we don't double-fetch
  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true
      return
    }
    const id = setTimeout(() => {
      onFilterChange({ search: searchDraft, page: 1 })
    }, 400)
    return () => clearTimeout(id)
  }, [searchDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function commitSearch() {
    onFilterChange({ search: searchDraft, page: 1 })
  }

  function goToPage(page: number) {
    onFilterChange({ page })
  }

  function handleView(user: UserListResource) {
    setSheetUserId(user.id)
  }

  function handleEdit(user: UserListResource) {
    navigate(`/admin/user-management/users/edit/${user.id}`)
  }

  function handleDepartmentFilter(value: string) {
    onFilterChange({
      department_id: value === NONE ? null : Number(value),
      page: 1,
    })
  }

  function handleTierFilter(value: string) {
    onFilterChange({
      user_level_tier_id: value === NONE ? null : Number(value),
      page: 1,
    })
  }

  function handleRoleFilter(value: string) {
    onFilterChange({
      role: value === NONE ? "" : (value as UserListResource["role"]),
      page: 1,
    })
  }

  function handleSort(column: string) {
    onFilterChange({ ...nextSort(filters, column), page: 1 })
  }

  function clearAllFilters() {
    setSearchDraft("")
    onFilterChange({
      search: "",
      department_id: null,
      user_level_tier_id: null,
      role: "",
      date_from: "",
      date_to: "",
      page: 1,
    })
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await onDeleteUser(userToDelete.id)
      setUserToDelete(null)
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete user. Please try again.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const hasActiveFilters =
    !!filters.search ||
    filters.department_id != null ||
    filters.user_level_tier_id != null ||
    !!filters.role ||
    !!filters.date_from ||
    !!filters.date_to

  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1
  const total = meta?.total ?? 0
  const from = meta?.from ?? 0
  const to = meta?.to ?? 0

  const sheetTierText = useMemo(() => {
    if (!sheetUser?.tier) return "—"
    const levelName = sheetUser.tier.level?.name ?? sheetUser.tier.level_name
    return levelName
      ? `${sheetUser.tier.tier_name} / ${levelName}`
      : sheetUser.tier.tier_name
  }, [sheetUser?.tier])

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {/* Search + count */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              className="pl-9"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitSearch()}
            />
          </div>
          {meta && (
            <p className="shrink-0 text-sm text-muted-foreground">
              {total === 0
                ? "No users found"
                : `Showing ${from}–${to} of ${total} user${total !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchableSelect
            value={filters.department_id != null ? String(filters.department_id) : NONE}
            onValueChange={handleDepartmentFilter}
            disabled={loadingDepts}
            placeholder="All departments"
            searchPlaceholder="Search departments…"
            triggerClassName="h-8 w-44 text-xs"
            pinnedOptions={[{ value: NONE, label: "All departments" }]}
            options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
          />

          <SearchableSelect
            value={filters.user_level_tier_id != null ? String(filters.user_level_tier_id) : NONE}
            onValueChange={handleTierFilter}
            disabled={loadingTiers}
            placeholder="All tiers"
            searchPlaceholder="Search tiers…"
            triggerClassName="h-8 w-48 text-xs"
            pinnedOptions={[{ value: NONE, label: "All tiers" }]}
            options={allTierOptions.map((t) => ({ value: String(t.id), label: t.label }))}
          />

          <Select
            value={filters.role ? String(filters.role) : NONE}
            onValueChange={handleRoleFilter}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>All roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <DatePickerField
            value={filters.date_from ?? ""}
            onChange={(v) => onFilterChange({ date_from: v, page: 1 })}
            placeholder="Joined from"
            className="h-8 w-36 text-xs"
          />
          <DatePickerField
            value={filters.date_to ?? ""}
            onChange={(v) => onFilterChange({ date_to: v, page: 1 })}
            placeholder="Joined to"
            className="h-8 w-36 text-xs"
          />

          <div className="ml-auto flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground"
                onClick={clearAllFilters}
              >
                <FilterXIcon className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="User"
                column="name"
                sort={filters.sort}
                direction={filters.direction}
                onSort={handleSort}
                className="w-70"
              />
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Tier / Level</TableHead>
              <SortableHead
                label="Joined"
                column="created_at"
                sort={filters.sort}
                direction={filters.direction}
                onSort={handleSort}
              />
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && users.length === 0 && <TableSkeleton />}

            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UserIcon className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No users found.</p>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {users.map((user) => (
              <TableRow
                key={user.id}
                className={
                  isLoading
                    ? "cursor-pointer opacity-50"
                    : "cursor-pointer hover:bg-muted/30"
                }
                onClick={() => handleView(user)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-none">{user.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {user.department?.name ?? (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {user.tier ? (
                    <span>
                      {user.tier.tier_name}
                      {(user.tier.level_name || user.tier.level?.name) && (
                        <span className="text-xs text-muted-foreground/70">
                          {" "}
                          / {user.tier.level_name ?? user.tier.level?.name}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {user.created_at ? (
                    new Date(user.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  ) : (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); handleView(user) }}
                      aria-label={`View ${user.name}`}
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); handleEdit(user) }}
                      aria-label={`Edit ${user.name}`}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteError(null)
                        setUserToDelete(user)
                      }}
                      aria-label={`Delete ${user.name}`}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {meta && (
        <div className="flex items-center justify-between gap-4">
          <PerPageSelect
            value={filters.per_page ?? 15}
            onChange={(n) => onFilterChange({ per_page: n, page: 1 })}
          />
          {lastPage > 1 && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => goToPage(currentPage - 1)}
                className="gap-1.5"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {lastPage}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= lastPage || isLoading}
                onClick={() => goToPage(currentPage + 1)}
                className="gap-1.5"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Delete dialog ──────────────────────────────────────────────────── */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setUserToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete {userToDelete?.name}. If this user is a direct
              manager, the API may reject this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="px-1 text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
            >
              {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── User Details Sheet ─────────────────────────────────────────────── */}
      <Sheet
        open={sheetUserId !== null}
        onOpenChange={(open) => { if (!open) setSheetUserId(null) }}
      >
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader className="pb-1">
            <SheetTitle className="flex items-center gap-2">
              <UserRoundIcon className="h-5 w-5 text-primary" />
              User Details
            </SheetTitle>
            <SheetDescription>Full profile and assignment info.</SheetDescription>
          </SheetHeader>

          <Separator className="my-5" />

          {sheetLoading && (
            <div className="space-y-4 px-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[20px_120px_1fr] gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          )}

          {sheetError && (
            <p className="px-1 text-sm text-destructive">{sheetError}</p>
          )}

          {!sheetLoading && sheetUser && (
            <div className="flex flex-col gap-5 px-2">
              {/* Avatar + name header */}
              <div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/20">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{sheetUser.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {sheetUser.email}
                  </p>
                </div>
                <RoleBadge role={sheetUser.role} />
              </div>

              {/* Assignments block */}
              <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Assignments
                </p>
                <DetailRow
                  icon={<Building2Icon className="h-4 w-4" />}
                  label="Department"
                  value={
                    sheetUser.department
                      ? `${sheetUser.department.name}${sheetUser.department.slug ? ` (${sheetUser.department.slug})` : ""}`
                      : "—"
                  }
                />
                <DetailRow
                  icon={<UserCogIcon className="h-4 w-4" />}
                  label="Managers"
                  value={(() => {
                    const managers =
                      sheetUser.managers && sheetUser.managers.length > 0
                        ? sheetUser.managers
                        : sheetUser.manager
                          ? [sheetUser.manager]
                          : []
                    if (managers.length === 0) return "—"
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {managers.map((m) => (
                          <Badge key={m.id} variant="secondary" className="font-normal">
                            {m.name} (#{m.id})
                          </Badge>
                        ))}
                      </div>
                    )
                  })()}
                />
                <DetailRow
                  icon={<LayersIcon className="h-4 w-4" />}
                  label="Tier / Level"
                  value={sheetTierText}
                />
              </div>

              {/* Account block */}
              <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Account
                </p>
                <DetailRow
                  icon={<MailIcon className="h-4 w-4" />}
                  label="Email"
                  value={sheetUser.email}
                />
                <DetailRow
                  icon={<ShieldIcon className="h-4 w-4" />}
                  label="Role"
                  value={<RoleBadge role={sheetUser.role} />}
                />
                <DetailRow
                  icon={<CalendarClockIcon className="h-4 w-4" />}
                  label="Created"
                  value={formatDate(sheetUser.created_at)}
                />
                <DetailRow
                  icon={<CalendarClockIcon className="h-4 w-4" />}
                  label="Updated"
                  value={formatDate(sheetUser.updated_at)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end pb-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setSheetUserId(null)
                    navigate(`/admin/user-management/users/edit/${sheetUser.id}`)
                  }}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
