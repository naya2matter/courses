import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getBreadcrumbs, homeCrumb } from "@/config/breadcrumbs"
import { useBreadcrumbContext } from "@/context/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false)

  const { pathname } = useLocation()
  const { override } = useBreadcrumbContext()

  // Build the trail: leading "Home" crumb + the route trail. A detail page may
  // override the leaf label with a live entity name.
  const crumbs = React.useMemo(() => {
    const home = homeCrumb(pathname)
    const trail = getBreadcrumbs(pathname)
    if (override && trail.length > 0) {
      trail[trail.length - 1] = { label: override }
    }
    return [home, ...trail]
  }, [pathname, override])

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

        {/* Breadcrumb — dynamic, driven by the current route */}
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <React.Fragment key={`${crumb.label}-${i}`}>
                  <BreadcrumbItem className="min-w-0">
                    {isLast ? (
                      <BreadcrumbPage className="max-w-[12rem] truncate font-medium text-white sm:max-w-[20rem]">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : crumb.to ? (
                      <BreadcrumbLink asChild>
                        <Link
                          to={crumb.to}
                          className="max-w-[10rem] truncate text-white/45 transition-colors hover:text-white sm:max-w-none"
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <span className="max-w-[10rem] truncate text-white/30 sm:max-w-none">
                        {crumb.label}
                      </span>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator className="text-white/25" />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
