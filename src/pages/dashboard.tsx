
import { ArrowUpRight, Sparkles, Users, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { RecentUsersTable } from "@/components/recent-users-table"
import { SectionCards } from "@/components/section-cards"

/* ─── Glassmorphism dashboard layout ------------------------------------- */

export function Dashboard() {
  return (
    <div className="relative z-10 mx-auto flex min-h-full max-w-[1800px] flex-col gap-6 text-white">
        <section className="glass-panel border-white/10 p-6 shadow-[0_22px_60px_rgba(79,70,229,0.18)] ring-1 ring-white/10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-primary-foreground/70">
                Dashboard overview
              </p>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Glassmorphism analytics
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  A premium, dark glass dashboard with ambient indigo glow, soft blur, and floating glass cards.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button variant="outline" className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10">
                Download report
              </Button>
              <Button
                variant="default"
                className="rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_18px_48px_rgba(124,58,237,0.3)] hover:shadow-[0_22px_54px_rgba(124,58,237,0.4)]"
              >
                Create campaign
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
          <div className="glass-panel border-white/10 p-6 shadow-[0_22px_60px_rgba(79,70,229,0.18)] ring-1 ring-white/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary-foreground/75">
                  Workspace status
                </p>
                <h2 className="mt-4 text-2xl font-semibold text-white">Live insights</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10 text-indigo-200 shadow-[0_10px_30px_rgba(124,58,237,0.18)]">
                <Sparkles className="size-6" />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 transition-all duration-300 hover:bg-white/10 hover:shadow-[0_8px_32px_rgba(79,70,229,0.18)]">
                <div>
                  <p className="text-sm text-muted-foreground">Active users</p>
                  <p className="mt-1 text-lg font-semibold text-white">3,842</p>
                </div>
                <ArrowUpRight className="size-5 text-indigo-300" />
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 transition-all duration-300 hover:bg-white/10 hover:shadow-[0_8px_32px_rgba(79,70,229,0.18)]">
                <div>
                  <p className="text-sm text-muted-foreground">New revenue</p>
                  <p className="mt-1 text-lg font-semibold text-white">$26.4K</p>
                </div>
                <Wallet className="size-5 text-fuchsia-300" />
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 transition-all duration-300 hover:bg-white/10 hover:shadow-[0_8px_32px_rgba(79,70,229,0.18)]">
                <div>
                  <p className="text-sm text-muted-foreground">Team activity</p>
                  <p className="mt-1 text-lg font-semibold text-white">92%</p>
                </div>
                <Users className="size-5 text-cyan-300" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <SectionCards />
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <ChartAreaInteractive />
              <RecentUsersTable />
            </div>
          </div>
        </section>
      </div>
    
  )
}
