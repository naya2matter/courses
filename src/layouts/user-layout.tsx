import { Outlet } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { UserSidebar } from "@/components/user-sidebar"
import { BreadcrumbProvider } from "@/context/breadcrumb"

export function UserLayout() {
  return (
    <TooltipProvider>
      {/* Background — slightly warmer tint for user area */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a12]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(99,102,241,0.14),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.12),transparent_50%)]" />
        <div className="pointer-events-none absolute right-6 top-6 h-72 w-72 rounded-[28px] bg-white/3 shadow-[0_40px_80px_rgba(139,92,246,0.12)] blur-3xl" />
      </div>

      <div className="min-h-screen bg-[#080713]">
        <SidebarProvider className="bg-transparent">
          <UserSidebar />
          <BreadcrumbProvider>
            <div className="flex h-screen flex-1 flex-col overflow-hidden">
              <SiteHeader />
              <main className="flex-1 overflow-auto p-5 md:p-6 thin-scrollbar">
                <div className="mx-auto w-full max-w-350">
                  <Outlet />
                </div>
              </main>
            </div>
          </BreadcrumbProvider>
        </SidebarProvider>
      </div>
    </TooltipProvider>
  )
}
