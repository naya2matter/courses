import { apiClient } from "@/lib/api"
import type { AdminDashboardData, UserDashboardData } from "@/types/dashboard"

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const res = await apiClient.get<{ data: AdminDashboardData }>("/admin/dashboard")
  return res.data
}

export async function getUserDashboard(): Promise<UserDashboardData> {
  const res = await apiClient.get<{ data: UserDashboardData }>("/user/dashboard")
  return res.data
}
