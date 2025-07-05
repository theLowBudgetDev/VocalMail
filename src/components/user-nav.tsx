
"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/hooks/use-current-user"
import { logout, switchUser, getUsers } from "@/lib/actions"
import { User, Loader2, LogOut, Users, Check } from "lucide-react"
import type { User as UserType } from "@/lib/data"
import * as React from "react"

export function UserNav() {
  const { currentUser, isLoading } = useCurrentUser();
  const [allUsers, setAllUsers] = React.useState<UserType[]>([]);

  React.useEffect(() => {
    // Fetch all users to allow switching
    getUsers().then(setAllUsers);
  }, []);

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />
  }

  if (!currentUser) {
    return (
       <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
        </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4" /> Switch Account
          </DropdownMenuLabel>
          {allUsers.filter(u => u.id !== currentUser.id).map((user) => (
            <form action={switchUser} key={user.id}>
              <input type="hidden" name="userId" value={user.id} />
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full cursor-pointer flex items-center">
                  <span className="mr-2 h-4 w-4" />
                  <span>{user.name}</span>
                </button>
              </DropdownMenuItem>
            </form>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={logout}>
            <DropdownMenuItem asChild>
                 <button type="submit" className="w-full cursor-pointer flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </button>
            </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
