// ─── useDepartmentOptions ─────────────────────────────────────────────────────
// Builds selector-ready data for Users forms from the Departments store.
// This links Users create/edit pages to the same source data used in Departments.

import { useEffect, useMemo } from "react"
import { useDepartmentStore } from "../../departments/store/department.store"
import type {
  Department,
  DepartmentUser,
  DepartmentUserTier,
} from "../../departments/types/department.types"

/** Recursively flatten department tree into a single list. */
function flattenDepartments(nodes: Department[]): Department[] {
  const out: Department[] = []

  for (const node of nodes) {
    out.push(node)
    if (node.children?.length) {
      out.push(...flattenDepartments(node.children))
    }
  }

  return out
}

/** Collect unique users across departments (dedupe by user id). */
function collectUsers(departments: Department[]): DepartmentUser[] {
  const seen = new Set<number>()
  const users: DepartmentUser[] = []

  for (const department of departments) {
    for (const user of department.users ?? []) {
      if (!seen.has(user.id)) {
        seen.add(user.id)
        users.push(user)
      }
    }
  }

  return users
}

/** Collect unique tiers from users (dedupe by tier id). */
function collectTiers(users: DepartmentUser[]): DepartmentUserTier[] {
  const seen = new Set<number>()
  const tiers: DepartmentUserTier[] = []

  for (const user of users) {
    if (user.tier && !seen.has(user.tier.id)) {
      seen.add(user.tier.id)
      tiers.push(user.tier)
    }
  }

  return tiers
}

export function useDepartmentOptions() {
  const { departments: rawDepartments, fetchDepartments, isLoading } =
    useDepartmentStore()

  useEffect(() => {
    if (rawDepartments.length === 0) {
      fetchDepartments()
    }
  }, [rawDepartments.length, fetchDepartments])

  const departments = useMemo(
    () => flattenDepartments(rawDepartments),
    [rawDepartments],
  )
  const allUsers = useMemo(() => collectUsers(departments), [departments])
  const allTiers = useMemo(() => collectTiers(allUsers), [allUsers])

  return {
    departments,
    allUsers,
    allTiers,
    isLoadingOptions: isLoading,
  }
}
