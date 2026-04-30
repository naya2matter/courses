import { Outlet } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

export function AdminLayout() {
  return (
    <TooltipProvider>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a12]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(139,92,246,0.15),transparent_55%)]" />
        <div className="pointer-events-none absolute left-6 top-6 h-72 w-72 rounded-[28px] bg-white/4 shadow-[0_40px_80px_rgba(99,102,241,0.14)] blur-3xl" />
        <div className="pointer-events-none absolute left-10 top-10 h-64 w-64 rounded-[28px] bg-[radial-gradient(circle,rgba(124,58,237,0.22),transparent_70%)] opacity-80 blur-[52px]" />
      </div>

      <div className="min-h-screen bg-[#080713]">
        <SidebarProvider className="bg-transparent">
          <AppSidebar />
          <div className="flex h-screen flex-1 flex-col overflow-hidden">
            <SiteHeader />
            <main className="flex-1 overflow-auto p-5 md:p-6 thin-scrollbar">
              <div className="mx-auto w-full max-w-350">
                <Outlet />
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </TooltipProvider>
  )
}
