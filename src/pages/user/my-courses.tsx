const courses = [
  { id: 1, title: "Advanced React Patterns",    instructor: "Mike Chen",     progress: 40, duration: "18h 15m", category: "Dev",    img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80" },
  { id: 2, title: "UI/UX Masterclass",           instructor: "Sarah Johnson", progress: 65, duration: "24h 30m", category: "Design", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80" },
  { id: 3, title: "Data Science Fundamentals",   instructor: "Emma Davis",    progress: 20, duration: "32h 00m", category: "Data",   img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80" },
  { id: 4, title: "Cloud Architecture & AWS",    instructor: "James Wilson",  progress: 0,  duration: "22h 20m", category: "Cloud",  img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80" },
]

const categoryColor: Record<string, string> = {
  Dev:    "text-indigo-400 bg-indigo-400/10",
  Design: "text-fuchsia-400 bg-fuchsia-400/10",
  Data:   "text-violet-400 bg-violet-400/10",
  Cloud:  "text-sky-400 bg-sky-400/10",
}

export function UserMyCourses() {
  return (
    <div className="flex flex-col gap-8 text-white">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">My Courses</h1>
        <p className="text-sm text-white/50">Your enrolled courses and learning progress.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((c) => (
          <div
            key={c.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl transition-all hover:scale-[1.02] hover:bg-white/6"
          >
            <div className="relative h-36 overflow-hidden">
              <img src={c.img} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug text-white/90">{c.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColor[c.category] ?? ""}`}>
                  {c.category}
                </span>
              </div>
              <p className="text-xs text-white/40">{c.instructor} · {c.duration}</p>
              <div className="mt-auto">
                <div className="mb-1 flex justify-between text-[10px] text-white/40">
                  <span>Progress</span>
                  <span>{c.progress}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
