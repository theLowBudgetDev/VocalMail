
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/hooks/use-current-user"
import { login, logout } from "@/lib/actions"
import { User, Loader2, LogOut, Users, Check } from "lucide-react"
import type { User as UserType } from "@/lib/data";

export function UserNav({ allUsers }: { allUsers: UserType[] }) {
  const { currentUser, isLoading } = useCurrentUser();

  const handleSwitchUser = (userId: number) => {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    login(formData);
  };

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
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Users className="mr-2 h-4 w-4" />
            <span>Switch account</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {allUsers.map((user) => (
                <DropdownMenuItem key={user.id} onClick={() => handleSwitchUser(user.id)}>
                   {currentUser.id === user.id && <Check className="mr-2 h-4 w-4" />}
                   {currentUser.id !== user.id && <span className="w-6 mr-2"></span>}
                  <span>{user.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
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
