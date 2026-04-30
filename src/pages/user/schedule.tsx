import { CalendarIcon, ClockIcon, VideoIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const sessions = [
  { id: 1, date: "May 02, 2026",  time: "10:00 AM",  course: "Advanced React Patterns",   type: "Live Q&A",     status: "Upcoming",  instructor: "Mike Chen" },
  { id: 2, date: "May 05, 2026",  time: "02:00 PM",  course: "UI/UX Masterclass",          type: "Workshop",     status: "Upcoming",  instructor: "Sarah Johnson" },
  { id: 3, date: "May 08, 2026",  time: "11:00 AM",  course: "Data Science Fundamentals",  type: "Lecture",      status: "Upcoming",  instructor: "Emma Davis" },
  { id: 4, date: "Apr 28, 2026",  time: "09:00 AM",  course: "Advanced React Patterns",   type: "Live Q&A",     status: "Completed", instructor: "Mike Chen" },
  { id: 5, date: "Apr 22, 2026",  time: "03:00 PM",  course: "UI/UX Masterclass",          type: "Workshop",     status: "Completed", instructor: "Sarah Johnson" },
]

export function UserSchedule() {
  const upcoming  = sessions.filter((s) => s.status === "Upcoming")
  const completed = sessions.filter((s) => s.status === "Completed")

  return (
    <div className="flex flex-col gap-8 text-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">My Schedule</h1>
        <p className="text-sm text-white/50">Upcoming and past learning sessions.</p>
      </div>

      <div className="flex flex-col gap-6">
        {[
          { label: "Upcoming", sessions: upcoming,  icon: CalendarIcon },
          { label: "Past",     sessions: completed, icon: ClockIcon },
        ].map((group) => (
          <div key={group.label} className="rounded-xl border border-white/10 bg-white/3 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
              <group.icon className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white/70">{group.label} Sessions ({group.sessions.length})</h2>
            </div>
            {group.sessions.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-white/30">No sessions</p>
            )}
            <div className="divide-y divide-white/5">
              {group.sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                    <VideoIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white/90">{s.course}</p>
                    <p className="text-xs text-white/40">{s.type} · {s.instructor}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-white/70">{s.date}</p>
                    <p className="text-xs text-white/40">{s.time}</p>
                  </div>
                  <Badge variant={s.status === "Upcoming" ? "default" : "secondary"} className="shrink-0">
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
