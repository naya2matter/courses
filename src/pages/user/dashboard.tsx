import { useEffect, useState } from "react"
import { Dashboard } from "@/pages/dashboard"
import { getUserDashboard } from "@/services/dashboard.service"
import type { UserDashboardData } from "@/types/dashboard"

export function UserDashboard() {
  const [data, setData] = useState<UserDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getUserDashboard()
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
        <div className="flex flex-col gap-6">
          <div className="h-8 w-48 rounded-lg bg-white/5" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-white/5 ring-1 ring-white/10" />
            ))}
          </div>
        </div>
        <div className="glass-panel h-40 rounded-2xl bg-white/3 ring-1 ring-white/10" />
      </div>
    )
  }

  return <Dashboard variant="user" data={data} />
}
