import * as React from "react"
import { CalendarDaysIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface SiteHeaderProps {
  showAdminCalendar?: boolean
}

function formatCalendarDate(date?: Date) {
  if (!date) return "Pick a date"
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function SiteHeader({ showAdminCalendar = false }: SiteHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    () => new Date(),
  )

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-white/5 bg-transparent transition-all duration-300",
        scrolled ? "bg-[#080713]/80 border-white/10 shadow-sm backdrop-blur-md" : ""
      )}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Sidebar toggle */}
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Right-side actions */}
        <div className="ms-auto flex items-center gap-2">
          {showAdminCalendar ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <CalendarDaysIcon className="size-4" />
                  <span className="hidden sm:inline">{formatCalendarDate(selectedDate)}</span>
                  <span className="sm:hidden">Calendar</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[24rem]">
                <DialogHeader>
                  <DialogTitle>Admin Calendar</DialogTitle>
                  <DialogDescription>
                    Available from every admin page through the shared header.
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="mx-auto"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Selected: {formatCalendarDate(selectedDate)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>
    </header>
  )
}
