import { useEffect, useState } from "react"
import { Dashboard } from "@/pages/dashboard"
import { getAdminDashboard } from "@/services/dashboard.service"
import type { AdminDashboardData } from "@/types/dashboard"

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch((err: Error) => setError(err.message ?? "Failed to load dashboard"))
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-red-400 text-sm">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-10 text-white animate-pulse mt-10">
        <div className="glass-panel min-h-55 rounded-2xl bg-white/3 ring-1 ring-white/10" />
        <div className="grid grid-cols-2 gap-y-10 px-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-white/5" />
              <div className="h-8 w-20 rounded-lg bg-white/5" />
              <div className="h-3 w-24 rounded bg-white/5" />
            </div>
          ))}
        </div>
        <div className="glass-panel h-64 rounded-2xl bg-white/3 ring-1 ring-white/10" />
      </div>
    )
  }

  return <Dashboard variant="admin" data={data} />
}
