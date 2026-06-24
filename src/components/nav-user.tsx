import { useState } from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  EllipsisVerticalIcon,
  LogOutIcon,
} from "lucide-react"
import { useAuth } from "@/context/auth"
import { Role } from "@/types/auth"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const auth = useAuth()
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)

  const handleLogout = async () => {
    await auth.signOut()
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>

                <EllipsisVerticalIcon className="ms-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {auth.isImpersonating ? (
                <DropdownMenuItem onClick={() => auth.revertImpersonation()}>
                  Stop impersonation
                </DropdownMenuItem>
              ) : auth.user?.role === Role.admin ? (
                <DropdownMenuItem onClick={() => auth.impersonateAs(Role.user)}>
                  Impersonate as user
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault()
                  setIsLogoutOpen(true)
                }}
              >
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <AlertDialogContent className="logout-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="logout-dialog-title">Log out now?</AlertDialogTitle>
            <AlertDialogDescription className="logout-dialog-description">
              You are about to end this session on this device. You can sign in
              again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="logout-dialog-cancel">Stay signed in</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              variant="destructive"
              className="logout-dialog-action"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}