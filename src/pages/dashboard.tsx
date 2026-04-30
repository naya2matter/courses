
import { useState } from "react"
import {
  BookOpen,
  Users,
  Activity,
  Trophy,
  ChevronRight,
  Clock,
  Calendar,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import heroImage from "@/assets/hero-character.png"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/* ─── Static data --------------------------------------------------------- */
const attendanceRecords = [
  {
    id: 1,
    date: "June 22, 2026",
    course: "UI/UX Masterclass",
    status: "Completed",
  },
  {
    id: 2,
    date: "June 25, 2026",
    course: "Cloud Architecture",
    status: "Present",
  },
  {
    id: 3,
    date: "June 28, 2026",
    course: "Advanced React",
    status: "Upcoming",
  },
  {
    id: 4,
    date: "July 02, 2026",
    course: "Data Science",
    status: "Confirmed",
  },
]

const recentActivities = [
  {
    id: 1,
    user: "Sarah Smith",
    action: "completed Course",
    target: "UI/UX Masterclass",
    time: "2 hours ago",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    user: "John Doe",
    action: "started Lesson",
    target: "Advanced React",
    time: "4 hours ago",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
  },
  {
    id: 3,
    user: "Emma Wilson",
    action: "joined Program",
    target: "Data Science Track",
    time: "5 hours ago",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
  },
]
const stats = [
  {
    label: "Total Courses",
    value: "248",
    icon: BookOpen,
    color: "text-indigo-400",
    glow: "0 10px 32px rgba(99,102,241,0.35)",
    ring: "rgba(99,102,241,0.25)",
  },
  {
    label: "Total Users",
    value: "12.4K",
    icon: Users,
    color: "text-violet-400",
    glow: "0 10px 32px rgba(139,92,246,0.35)",
    ring: "rgba(139,92,246,0.25)",
  },
  {
    label: "Active Sessions",
    value: "3,842",
    icon: Activity,
    color: "text-fuchsia-400",
    glow: "0 10px 32px rgba(217,70,239,0.35)",
    ring: "rgba(217,70,239,0.25)",
  },
  {
    label: "Completion Rate",
    value: "87%",
    icon: Trophy,
    color: "text-primary",
    glow: "0 10px 32px rgba(212,175,55,0.35)",
    ring: "rgba(212,175,55,0.25)",
  },
]

const offlineCourses = [
  {
    id: 1,
    title: "UI/UX Design Masterclass",
    instructor: "Sarah Johnson",
    progress: 65,
    duration: "24h 30m",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
  },
  {
    id: 2,
    title: "Advanced React Patterns",
    instructor: "Mike Chen",
    progress: 40,
    duration: "18h 15m",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80",
  },
  {
    id: 3,
    title: "Data Science Fundamentals",
    instructor: "Emma Davis",
    progress: 20,
    duration: "32h 00m",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
  },
]

const onlineCourses = [
  {
    id: 1,
    title: "Full Stack Development",
    instructor: "Alex Turner",
    progress: 75,
    duration: "40h 00m",
    image: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=600&q=80",
  },
  {
    id: 2,
    title: "Machine Learning with Python",
    instructor: "Zara Ahmed",
    progress: 30,
    duration: "28h 45m",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80",
  },
  {
    id: 3,
    title: "Cloud Architecture & AWS",
    instructor: "James Wilson",
    progress: 55,
    duration: "22h 20m",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
  },
]

/* ─── Dashboard page ------------------------------------------------------ */
export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"offline" | "online">("offline")
  const courses = activeTab === "offline" ? offlineCourses : onlineCourses

  return (
    <div className="flex flex-col gap-10 text-white">

      {/* ──────────────────────── 1. WELCOME BANNER ──────────────────────── */}
      <section className="glass-panel relative overflow-visible p-8 shadow-[0_22px_60px_rgba(79,70,229,0.18)] ring-1 ring-white/10 min-h-55 mt-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(99,102,241,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.10),transparent_50%)]" />
          <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        {/* Text content */}
        <div className="relative z-10 max-w-[58%]">
          <p className="mb-2 text-xs uppercase tracking-[0.32em] text-primary/80">
            Welcome back
          </p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">
            Hello,{" "}
            <span className="bg-linear-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
              Alex!
            </span>
          </h1>
          <p className="mb-7 max-w-sm text-sm leading-6 text-muted-foreground">
            You have{" "}
            <span className="font-medium text-white">3 courses</span> in
            progress and{" "}
            <span className="font-medium text-white">2 upcoming</span> sessions
            today. Keep up the great work!
          </p>
          
        </div>

        {/* 3D Hero image — absolute, raised above the panel */}
        <div className="absolute -top-14 right-10 z-20 hidden lg:block">
          <img
            src={heroImage}
            alt="Learning guide character"
            className="hero-image-3d h-72 w-auto select-none object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,0.35)]"
          />
        </div>
      </section>

      {/* ──────────────────────── 2. STATS STRIP ─────────────────────────── */}
      <section className="grid grid-cols-2 gap-y-10 px-6 md:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="floating-stat flex flex-col items-center gap-3 text-center"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            {/* Icon bubble */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5"
              style={{
                boxShadow: stat.glow,
                outline: `1px solid ${stat.ring}`,
              }}
            >
              <stat.icon className={`size-7 ${stat.color}`} />
            </div>
            {/* Value */}
            <p className={`text-3xl font-bold tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
            {/* Label */}
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* ────────────────────── 3. YOUR ACTIVITIES ───────────────────────── */}
      <section className="flex flex-col gap-6">
        {/* Section header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-white">Your Activities</h2>

          {/* Tab switcher */}
          <div className="flex gap-1 self-start rounded-xl bg-white/5 p-1 ring-1 ring-white/10 sm:self-auto">
            {(["offline", "online"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                    : "text-muted-foreground hover:text-white/80"
                }`}
              >
                {tab === "offline" ? "Offline Courses" : "Online Courses"}
              </button>
            ))}
          </div>
        </div>

        {/* Course cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform duration-300 hover:-translate-y-1 hover:ring-white/20"
            >
              {/* ── Cover image ── */}
              <div className="relative h-52 w-full overflow-hidden rounded-2xl">
                <img
                  src={course.image}
                  alt={course.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

                {/* ── Glass info overlay (top) ── */}
                <div
                  className="absolute inset-x-3 top-3 rounded-xl p-3"
                  style={{
                    background: "rgba(15, 10, 40, 0.55)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Course meta */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-5 text-white">
                        {course.title}
                      </p>
                      <p className="mt-0.5 text-xs text-white/55">
                        {course.instructor}
                      </p>
                    </div>

                    {/* Continue button */}
                    <button
                      className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:brightness-110"
                      style={{
                        background:
                          "linear-gradient(135deg,rgba(99,102,241,0.92),rgba(139,92,246,0.92))",
                        boxShadow: "0 4px 14px rgba(99,102,241,0.45)",
                      }}
                    >
                      Continue
                      <ChevronRight className="size-3" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-400 to-violet-400"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-white/55">
                      {course.progress}%
                    </span>
                  </div>
                </div>

                {/* Duration badge (bottom-left) */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white/75 backdrop-blur-sm">
                  <Clock className="size-3" />
                  {course.duration}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ────────────────────── 4. RECENT ATTENDANCE ─────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Recent Attendance</h2>
          <Button variant="ghost" className="rounded-xl border border-white/5 bg-white/5 text-sm text-indigo-400 backdrop-blur-md transition-all hover:bg-white/10 hover:text-indigo-300">
            View all
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {attendanceRecords.map((record) => (
            <div
              key={record.id}
              className="glass-panel group relative flex flex-col p-6 transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.08] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Internal glow effect */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" 
                   style={{ background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15), transparent 70%)" }} />

              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Session Date</p>
                    <p className="text-xs font-semibold text-white/90">{record.date}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Course Name</p>
                    <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10">
                        <BookOpen className="size-3.5 text-violet-400" />
                      </div>
                      <span className="truncate text-sm font-medium text-white/80">{record.course}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Attendance Status</p>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5">
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${
                          record.status === 'Present' || record.status === 'Completed' || record.status === 'Confirmed' 
                            ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.7)]' 
                            : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                        }`} />
                        <span className={`text-[13px] font-semibold tracking-tight ${
                          record.status === 'Present' || record.status === 'Completed' || record.status === 'Confirmed' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      <ChevronRight className="size-3.5 text-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────── 5. RECENT ACTIVITY ──────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Recent Activity (Admin)</h2>
          <Button variant="ghost" className="rounded-xl border border-white/5 bg-white/5 text-sm text-indigo-400 backdrop-blur-md transition-all hover:bg-white/10 hover:text-indigo-300">
            Export log
          </Button>
        </div>

        <div className="glass-panel relative overflow-hidden ring-1 ring-white/10"
             style={{ 
               background: "rgba(255,255,255,0.03)", 
               backdropFilter: "blur(20px)",
               boxShadow: "0 25px 80px rgba(0,0,0,0.5)" 
             }}>
          <div className="divide-y divide-white/10">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="group flex items-center justify-between p-5 transition-all duration-300 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar className="size-11 ring-2 ring-white/10 ring-offset-2 ring-offset-[#080713]">
                      <AvatarImage src={activity.avatar} alt={activity.user} />
                      <AvatarFallback className="bg-white/5 text-white/50">{activity.user.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#080713] bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm leading-relaxed text-white/70">
                      <span className="font-bold text-white transition-colors group-hover:text-indigo-300">{activity.user}</span>{" "}
                      <span className="font-light">{activity.action}</span>{" "}
                      <span className="font-semibold text-indigo-400/90">{activity.target}</span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                      <Calendar className="size-3 opacity-50" />
                      {activity.time}
                    </div>
                  </div>
                </div>
                <button className="flex size-9 items-center justify-center rounded-xl bg-white/0 text-white/20 transition-all duration-200 hover:bg-white/10 hover:text-white group-hover:text-white/40">
                  <MoreHorizontal className="size-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom highlight beam */}
          <div className="absolute bottom-0 left-0 h-[1px] w-full bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
        </div>
      </section>

    </div>
  )
}

/* ─── Legacy sections removed; kept imports below for tree-shaking: ─── */
// ChartAreaInteractive, RecentUsersTable, SectionCards are unused now.
// Remove the imports above once confirmed.


