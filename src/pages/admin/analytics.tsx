import { TrendingUpIcon, UsersIcon, BookOpenIcon, ActivityIcon } from "lucide-react"

const stats = [
  { label: "Total Enrollments",  value: "14,892", change: "+12%",  icon: UsersIcon,     color: "text-indigo-400" },
  { label: "Course Completions", value: "8,431",  change: "+8.4%", icon: BookOpenIcon,  color: "text-violet-400" },
  { label: "Active Learners",    value: "3,842",  change: "+5.1%", icon: ActivityIcon,  color: "text-fuchsia-400" },
  { label: "Avg. Progress",      value: "67%",    change: "+3.2%", icon: TrendingUpIcon, color: "text-emerald-400" },
]

export function AdminAnalytics() {
  return (
    <div className="flex flex-col gap-8 text-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="text-sm text-white/50">Platform-wide performance and engagement metrics.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/4 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <span className="text-xs font-medium text-emerald-400">{s.change} this month</span>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/3 p-8 text-center backdrop-blur-xl">
        <TrendingUpIcon className="h-10 w-10 text-indigo-400/40" />
        <p className="text-sm font-medium text-white/40">Enrollment trend chart — connect to API</p>
        <p className="text-xs text-white/20">Recharts integration ready in chart-area-interactive.tsx</p>
      </div>
    </div>
  )
}
