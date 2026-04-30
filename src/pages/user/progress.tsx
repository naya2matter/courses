import { TrophyIcon, FlameIcon, ClockIcon } from "lucide-react"

const achievements = [
  { title: "First Course Completed", earned: true,  icon: "🎓" },
  { title: "7-Day Streak",           earned: true,  icon: "🔥" },
  { title: "Top 10% Learner",        earned: false, icon: "⭐" },
  { title: "Course Creator",         earned: false, icon: "✏️" },
]

const progressData = [
  { course: "UI/UX Masterclass",          progress: 65, hoursSpent: 15, color: "bg-fuchsia-500" },
  { course: "Advanced React Patterns",    progress: 40, hoursSpent: 7,  color: "bg-indigo-500" },
  { course: "Data Science Fundamentals",  progress: 20, hoursSpent: 6,  color: "bg-violet-500" },
  { course: "Cloud Architecture & AWS",   progress: 0,  hoursSpent: 0,  color: "bg-sky-500" },
]

export function UserProgress() {
  return (
    <div className="flex flex-col gap-8 text-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">My Progress</h1>
        <p className="text-sm text-white/50">Track your learning milestones and achievements.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Courses In Progress", value: "3",    icon: ClockIcon,   color: "text-indigo-400" },
          { label: "Total Hours Learned",  value: "28h",  icon: FlameIcon,   color: "text-fuchsia-400" },
          { label: "Achievements Earned",  value: "2/4",  icon: TrophyIcon,  color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/4 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <span className="text-3xl font-bold text-white">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Course progress bars */}
      <div className="rounded-xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl">
        <h2 className="mb-5 text-sm font-semibold text-white/70">Course Breakdown</h2>
        <div className="flex flex-col gap-5">
          {progressData.map((p) => (
            <div key={p.course}>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-white/80">{p.course}</span>
                <span className="text-white/40">{p.hoursSpent}h spent · {p.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${p.color} transition-all duration-700`} style={{ width: `${p.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl">
        <h2 className="mb-5 text-sm font-semibold text-white/70">Achievements</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.title}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                a.earned ? "border-amber-400/30 bg-amber-400/5" : "border-white/5 bg-white/2 opacity-40"
              }`}
            >
              <span className="text-3xl">{a.icon}</span>
              <span className="text-[11px] font-medium leading-tight text-white/70">{a.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
