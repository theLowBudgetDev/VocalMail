
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
import { Check, User, Loader2 } from "lucide-react"

export function UserNav() {
  const { currentUser, users, setCurrentUser, isLoading } = useCurrentUser();

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
        <DropdownMenuGroup>
            <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
            {users.map((user) => (
                 <DropdownMenuItem key={user.id} onClick={() => setCurrentUser(user)}>
                    <Avatar className="mr-2 h-5 w-5">
                        <AvatarFallback className="text-xs">{user.avatar}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    {currentUser.id === user.id && <Check className="ml-auto h-4 w-4" />}
                 </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
