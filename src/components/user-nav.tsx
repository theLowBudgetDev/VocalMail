
"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { User, Loader2 } from "lucide-react"

export function UserNav() {
  const { currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />
  }

  if (!currentUser) {
    return (
        <Avatar className="h-9 w-9">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="bg-primary text-primary-foreground">
          {currentUser.avatar}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="text-sm font-medium leading-none">{currentUser.name}</p>
        <p className="text-xs leading-none text-muted-foreground">
            {currentUser.email}
        </p>
      </div>
    </div>
  )
}
