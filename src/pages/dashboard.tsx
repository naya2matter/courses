import { useState } from "react"
import { Link } from "react-router-dom"
import {
  BookOpen,
  Users,
  Activity,
  Trophy,
  ChevronRight,
  Clock,
  Calendar,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  PlayCircle,
  LogIn,
  GraduationCap,
} from "lucide-react"
import heroImage from "@/assets/hero-character.png"
import type { AdminDashboardData, UserDashboardData } from "@/types/dashboard"

type DashboardProps =
  | { variant: "admin"; data: AdminDashboardData }
  | { variant: "user"; data: UserDashboardData }

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr.replace(" ", "T"))
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr.replace(" ", "T"))
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const AVATAR_PALETTES = [
  "from-indigo-500 to-violet-600",
  "from-violet-500 to-fuchsia-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-teal-500 to-emerald-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
]

function avatarGradient(name: string): string {
  const h = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length]
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function actionMeta(action: string) {
  const a = action.toLowerCase()
  if (a.includes("login") || a.includes("logged"))
    return { icon: LogIn, color: "text-sky-400", bg: "bg-sky-500/20" }
  if (a.includes("complet"))
    return { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20" }
  if (a.includes("start"))
    return { icon: PlayCircle, color: "text-indigo-400", bg: "bg-indigo-500/20" }
  if (a.includes("enroll") || a.includes("join"))
    return { icon: UserPlus, color: "text-violet-400", bg: "bg-violet-500/20" }
  return { icon: Activity, color: "text-white/40", bg: "bg-white/10" }
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export function Dashboard(props: DashboardProps) {
  const defaultTab =
    props.variant === "user" && props.data.courses.offline.length === 0
      ? "online"
      : "offline"
  const [activeTab, setActiveTab] = useState<"offline" | "online">(defaultTab)

  const name =
    props.variant === "admin" ? props.data.admin.name : props.data.user.name

  // ── Stats config (unchanged visual style) ──────────────────────────────
  const statsConfig =
    props.variant === "admin"
      ? [
          {
            label: "Total Courses",
            value: props.data.stats.total_courses.toString(),
            icon: BookOpen,
            color: "text-indigo-400",
            glow: "0 10px 32px rgba(99,102,241,0.35)",
            ring: "rgba(99,102,241,0.25)",
          },
          {
            label: "Total Users",
            value: props.data.stats.total_users.toString(),
            icon: Users,
            color: "text-violet-400",
            glow: "0 10px 32px rgba(139,92,246,0.35)",
            ring: "rgba(139,92,246,0.25)",
          },
          {
            label: "Active Sessions",
            value: props.data.stats.active_sessions.toString(),
            icon: Activity,
            color: "text-fuchsia-400",
            glow: "0 10px 32px rgba(217,70,239,0.35)",
            ring: "rgba(217,70,239,0.25)",
          },
          {
            label: "Completion Rate",
            value: `${props.data.stats.completion_rate}%`,
            icon: Trophy,
            color: "text-primary",
            glow: "0 10px 32px rgba(212,175,55,0.35)",
            ring: "rgba(212,175,55,0.25)",
          },
        ]
      : null

  const userCourses =
    props.variant === "user"
      ? activeTab === "offline"
        ? props.data.courses.offline
        : props.data.courses.online
      : []

  return (
    <div className="flex flex-col gap-10 text-white">

      {/* ──────────────────────── 1. WELCOME BANNER ──────────────────────── */}
      <section className="glass-panel relative overflow-visible p-8 shadow-[0_22px_60px_rgba(79,70,229,0.18)] ring-1 ring-white/10 min-h-55 mt-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(99,102,241,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.10),transparent_50%)]" />
          <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-[58%]">
          <p className="mb-2 text-xs uppercase tracking-[0.32em] text-primary/80">
            Welcome back
          </p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">
            Hello,{" "}
            <span className="bg-linear-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
              {name}!
            </span>
          </h1>
          <p className="mb-5 max-w-sm text-sm leading-6 text-muted-foreground">
            {props.variant === "user"
              ? "Here's your learning overview for today."
              : "Here's your platform overview for today."}
          </p>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-2">
            {props.variant === "user" ? (
              <>
                <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                  <Activity className="size-3" />
                  {props.data.summary.in_progress_count} In Progress
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3.5 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30">
                  <Calendar className="size-3" />
                  {props.data.summary.upcoming_count} Upcoming
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  {props.data.summary.completed_count} Completed
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                  <BookOpen className="size-3" />
                  {props.data.stats.total_courses} Courses
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3.5 py-1.5 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30">
                  <Users className="size-3" />
                  {props.data.stats.total_users} Users
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-fuchsia-500/15 px-3.5 py-1.5 text-xs font-semibold text-fuchsia-300 ring-1 ring-fuchsia-500/30">
                  <Activity className="size-3" />
                  {props.data.stats.active_sessions} Active Sessions
                </span>
              </>
            )}
          </div>
        </div>

        <div className="absolute -top-14 right-10 z-20 hidden lg:block">
          <img
            src={heroImage}
            alt="Learning guide character"
            className="hero-image-3d h-72 w-auto select-none object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,0.35)]"
          />
        </div>
      </section>

      {/* ──────────────────────── 2. STATS STRIP — admin only ──────────────────────── */}
      {props.variant === "admin" && statsConfig && (
        <section className="grid grid-cols-2 gap-y-10 px-6 md:grid-cols-4">
          {statsConfig.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5"
                style={{
                  boxShadow: stat.glow,
                  outline: `1px solid ${stat.ring}`,
                }}
              >
                <stat.icon className={`size-7 ${stat.color}`} />
              </div>
              <p className={`text-3xl font-bold tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* ────────────────────── 3. YOUR ACTIVITIES — user only ───────────────────────── */}
      {props.variant === "user" && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 w-[3px] rounded-full bg-linear-to-b from-indigo-400 to-violet-500" />
              <h2 className="text-2xl font-semibold text-white">Your Activities</h2>
            </div>

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

          {userCourses.length === 0 ? (
            <div
              className="glass-panel flex flex-col items-center justify-center gap-3 py-20 ring-1 ring-white/8"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/8">
                <GraduationCap className="size-6 text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/30">No {activeTab} courses yet</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {userCourses.map((course) => {
                const statusBadge =
                  course.status === "completed"
                    ? { dot: "bg-emerald-500", text: "text-emerald-400", label: "Completed" }
                    : course.status === "in_progress"
                      ? { dot: "bg-indigo-400 animate-pulse", text: "text-indigo-300", label: "In Progress" }
                      : { dot: "bg-white/25", text: "text-white/40", label: "Not Started" }

                return (
                  <article
                    key={course.id}
                    className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(0,0,0,0.55)] hover:ring-white/20"
                  >
                    <div className="relative h-52 w-full overflow-hidden rounded-2xl">
                      {course.image ? (
                        <img
                          src={course.image}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-[radial-gradient(ellipse_at_30%_40%,rgba(99,102,241,0.45),transparent_60%),linear-gradient(135deg,#0f0a28,#1a1040)]" />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

                      {/* Glass info overlay */}
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
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-5 text-white">
                              {course.title}
                            </p>
                            <p className="mt-0.5 text-xs text-white/55">
                              {course.instructor}
                            </p>
                          </div>
                          <Link
                            to={course.continue_url}
                            className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-95"
                            style={{
                              background:
                                "linear-gradient(135deg,rgba(99,102,241,0.92),rgba(139,92,246,0.92))",
                              boxShadow: "0 4px 14px rgba(99,102,241,0.45)",
                            }}
                          >
                            {course.status === "completed" ? "Review" : "Continue"}
                            <ChevronRight className="size-3" />
                          </Link>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2.5">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-indigo-400 to-violet-400 transition-all duration-700"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] tabular-nums text-white/55">
                            {course.progress}%
                          </span>
                        </div>
                      </div>

                      {/* Bottom: duration + status */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white/75 backdrop-blur-sm">
                          <Clock className="size-3" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                          <div className={`size-1.5 rounded-full ${statusBadge.dot}`} />
                          <span className={`text-[11px] font-medium ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ────────────────────── 4. RECENT ATTENDANCE — user only ─────────────────────── */}
      {props.variant === "user" && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-[3px] rounded-full bg-linear-to-b from-violet-400 to-fuchsia-500" />
            <h2 className="text-2xl font-semibold text-white">Recent Attendance</h2>
          </div>

          {props.data.recent_attendance.length === 0 ? (
            <div
              className="glass-panel flex flex-col items-center justify-center gap-3 py-20 ring-1 ring-white/8"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/8">
                <Calendar className="size-6 text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/30">No attendance records yet</p>
              <p className="text-xs text-white/20">Your session history will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {props.data.recent_attendance.map((record) => (
                <div
                  key={record.id}
                  className="glass-panel group relative flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15), transparent 70%)",
                    }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Calendar className="size-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/40">
                          Session Date
                        </p>
                        <p className="text-xs font-semibold text-white/90">
                          {formatDate(record.date)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                          Course Name
                        </p>
                        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/5">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10">
                            <BookOpen className="size-3.5 text-violet-400" />
                          </div>
                          <span className="truncate text-sm font-medium text-white/80">
                            {record.course}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                          Attendance Status
                        </p>
                        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`size-2 rounded-full ${
                                ["present", "completed", "confirmed"].includes(
                                  record.status.toLowerCase()
                                )
                                  ? "bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                                  : "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]"
                              }`}
                            />
                            <span
                              className={`text-[13px] font-semibold tracking-tight capitalize ${
                                ["present", "completed", "confirmed"].includes(
                                  record.status.toLowerCase()
                                )
                                  ? "text-emerald-400"
                                  : "text-amber-400"
                              }`}
                            >
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
          )}
        </section>
      )}

      {/* ──────────────────────── 5. RECENT ACTIVITY — admin only ──────────────────────── */}
      {props.variant === "admin" && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 w-[3px] rounded-full bg-linear-to-b from-indigo-400 to-violet-500" />
              <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
            </div>
          </div>

          <div
            className="glass-panel relative overflow-hidden ring-1 ring-white/10"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div className="divide-y divide-white/[0.06]">
              {props.data.recent_activity.map((activity) => {
                const { icon: ActionIcon, color: actionColor, bg: actionBg } =
                  actionMeta(activity.action)
                return (
                  <div
                    key={activity.id}
                    className="group flex items-center justify-between px-5 py-4 transition-all duration-200 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      {/* Colored gradient avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(activity.user)} text-[11px] font-bold text-white shadow-md`}
                        >
                          {initials(activity.user)}
                        </div>
                        {/* Action type badge */}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border-2 border-[#080713] ${actionBg}`}
                        >
                          <ActionIcon className={`size-2.5 ${actionColor}`} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm leading-snug text-white/75">
                          <span className="font-semibold text-white transition-colors duration-200 group-hover:text-indigo-300">
                            {activity.user}
                          </span>{" "}
                          <span>{activity.action}</span>
                          {activity.target && (
                            <>
                              {" "}
                              <span className="font-medium text-indigo-400/80">
                                {activity.target}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-[11px] text-white/25">{timeAgo(activity.time)}</p>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>

            <div className="absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-transparent via-indigo-500/30 to-transparent" />
          </div>
        </section>
      )}

      {/* ─── Recent Enrollments + Top Courses — admin only ─── */}
      {props.variant === "admin" && (
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Recent Enrollments */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-[3px] rounded-full bg-linear-to-b from-violet-400 to-fuchsia-500" />
              <UserPlus className="size-4 text-violet-400" />
              <h2 className="text-xl font-semibold text-white">Recent Enrollments</h2>
            </div>
            <div
              className="glass-panel overflow-hidden ring-1 ring-white/10"
              style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
            >
              <div className="divide-y divide-white/[0.06]">
                {props.data.recent_enrollments.map((enroll, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 px-5 py-3.5 transition-all duration-200 hover:bg-white/[0.04]"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(enroll.user)} text-[11px] font-bold text-white`}
                    >
                      {initials(enroll.user)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/90">{enroll.user}</p>
                      <p className="truncate text-xs text-white/40">{enroll.course}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-[10px] text-white/30 ring-1 ring-white/8">
                      {formatDate(enroll.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Top Courses */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-[3px] rounded-full bg-linear-to-b from-indigo-400 to-sky-500" />
              <TrendingUp className="size-4 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Top Courses</h2>
            </div>
            <div
              className="glass-panel overflow-hidden ring-1 ring-white/10"
              style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
            >
              <div className="divide-y divide-white/[0.06]">
                {props.data.top_courses.map((course, i) => {
                  const rankColor =
                    i === 0
                      ? "text-amber-400"
                      : i === 1
                        ? "text-slate-300"
                        : i === 2
                          ? "text-amber-700"
                          : "text-white/20"
                  const rateColor =
                    course.completion_rate >= 50
                      ? "text-emerald-400"
                      : course.completion_rate > 0
                        ? "text-amber-400"
                        : "text-white/30"

                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-2 px-5 py-4 transition-all duration-200 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 shrink-0 text-sm font-bold tabular-nums ${rankColor}`}>
                          #{i + 1}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium text-white/90">
                          {course.title}
                        </span>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-[11px] text-white/40">
                            {course.enrollments} enrolled
                          </span>
                          <span className={`text-xs font-semibold tabular-nums ${rateColor}`}>
                            {course.completion_rate}%
                          </span>
                        </div>
                      </div>
                      <div className="ml-9 h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-indigo-400 to-violet-400"
                          style={{ width: `${course.completion_rate}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

        </div>
      )}

    </div>
  )
}
