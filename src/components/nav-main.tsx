import * as React from "react"
import * as ReactDOM from "react-dom"
import { Link } from "react-router-dom"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  isActive?: boolean
  items?: { title: string; url: string }[]
}

/* ── Floating hover panel (portal-rendered) ──────────────────────────────── */

interface HoverPanelProps {
  item: NavItem
  anchorRect: DOMRect
  activeSubItem: string | null
  onMouseEnter: () => void
  onMouseLeave: () => void
  onSelect: (title: string) => void
}

function HoverPanel({
  item,
  anchorRect,
  activeSubItem,
  onMouseEnter,
  onMouseLeave,
  onSelect,
}: HoverPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([])
  const [focusedIdx, setFocusedIdx] = React.useState(-1)

  const GAP = 10
  const estimatedHeight = (item.items?.length ?? 0) * 40 + 52
  let top = anchorRect.top
  if (top + estimatedHeight > window.innerHeight - 12) {
    top = window.innerHeight - estimatedHeight - 12
  }
  top = Math.max(8, top)
  const left = anchorRect.right + GAP

  React.useEffect(() => {
    if (focusedIdx >= 0) itemRefs.current[focusedIdx]?.focus()
  }, [focusedIdx])

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const len = item.items?.length ?? 0
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIdx(Math.min(idx + 1, len - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedIdx(Math.max(idx - 1, 0)) }
    else if (e.key === "Enter" && item.items) { onSelect(item.items[idx].title) }
  }

  return ReactDOM.createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-label={`${item.title} submenu`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ top, left, position: "fixed" }}
      className="z-9999 min-w-47.5 nav-hover-panel rounded-2xl border border-white/8 bg-[#0f0d24]/90 p-2 shadow-[0_12px_48px_rgba(79,70,229,0.32),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl"
    >
      {/* Section label */}
      <p className="mb-1 px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 select-none">
        {item.title}
      </p>

      {item.items?.map((sub, idx) => {
        const isActive = activeSubItem === sub.title
        return (
          <Link
            key={sub.title}
            ref={(el) => { itemRefs.current[idx] = el }}
            to={sub.url}
            role="menuitem"
            tabIndex={0}
            onFocus={() => setFocusedIdx(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onClick={() => onSelect(sub.title)}
            className={[
              "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none",
              "transition-all duration-150 ease-out",
              "hover:bg-indigo-500/14 hover:text-white",
              "focus-visible:bg-indigo-500/14 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-indigo-400/40",
              isActive
                ? "bg-indigo-500/18 text-white font-medium shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]"
                : "text-white/60",
            ].join(" ")}
          >
            <span
              className={[
                "size-1.5 shrink-0 rounded-full transition-all duration-150",
                isActive
                  ? "bg-indigo-400 shadow-[0_0_8px_2px_rgba(99,102,241,0.55)]"
                  : "bg-white/20 group-hover:bg-indigo-400/80",
              ].join(" ")}
            />
            {sub.title}
          </Link>
        )
      })}
    </div>,
    document.body
  )
}

/* ── NavMain ─────────────────────────────────────────────────────────────── */

export function NavMain({
  items,
  label,
}: {
  items: NavItem[]
  label?: string
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const [hoveredTitle, setHoveredTitle] = React.useState<string | null>(null)
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null)
  const [activeSubItem, setActiveSubItem] = React.useState<string | null>(null)

  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null }
  }

  const openPanel = (title: string, el: HTMLElement) => {
    clearTimers()
    showTimer.current = setTimeout(() => {
      setAnchorRect(el.getBoundingClientRect())
      setHoveredTitle(title)
    }, 60)
  }

  const closePanel = () => {
    clearTimers()
    hideTimer.current = setTimeout(() => {
      setHoveredTitle(null)
      setAnchorRect(null)
    }, 130)
  }

  React.useEffect(() => { return () => clearTimers() }, [])

  // Close panel when sidebar expands
  React.useEffect(() => {
    if (!isCollapsed) { setHoveredTitle(null); setAnchorRect(null) }
  }, [isCollapsed])

  const hoveredItem = items.find((i) => i.title === hoveredTitle)

  return (
    <>
      <SidebarGroup>
        {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
        <SidebarMenu>
          {items.map((item) =>
            item.items?.length ? (
              isCollapsed ? (
                /* Collapsed icon mode → hover panel trigger */
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.isActive}
                    aria-haspopup="menu"
                    aria-expanded={hoveredTitle === item.title}
                    aria-label={item.title}
                    onMouseEnter={(e) => openPanel(item.title, e.currentTarget)}
                    onMouseLeave={closePanel}
                  >
                    {item.icon}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                /* Expanded mode → inline collapsible */
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={item.isActive}>
                        {item.icon}
                        <span>{item.title}</span>
                        <ChevronRightIcon className="ms-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub) => {
                          const isSubActive = activeSubItem === sub.title
                          return (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                onClick={() => setActiveSubItem(sub.title)}
                              >
                                <Link to={sub.url} className="group flex items-center gap-2">
                                  <span
                                    className={[
                                      "size-1.5 shrink-0 rounded-full transition-all duration-200",
                                      isSubActive
                                        ? "bg-indigo-400 shadow-[0_0_6px_2px_rgba(99,102,241,0.5)]"
                                        : "bg-white/20 group-hover:bg-white/45",
                                    ].join(" ")}
                                  />
                                  <span>{sub.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                  <Link to={item.url}>
                    {item.icon}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroup>

      {/* Floating hover panel – portal-rendered, layout-safe */}
      {isCollapsed && hoveredItem?.items && anchorRect && (
        <HoverPanel
          item={hoveredItem}
          anchorRect={anchorRect}
          activeSubItem={activeSubItem}
          onMouseEnter={clearTimers}
          onMouseLeave={closePanel}
          onSelect={setActiveSubItem}
        />
      )}
    </>
  )
}

