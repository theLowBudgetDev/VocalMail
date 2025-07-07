
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Loader2 } from "lucide-react"
import { useSidebar } from "./ui/sidebar";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

export function UserNav() {
  const { currentUser, isLoading } = useCurrentUser();
  const { state: sidebarState } = useSidebar();

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin mx-auto" />
  }

  if (!currentUser) return null;

  return (
    <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg w-full",
         sidebarState === 'collapsed' ? 'justify-center' : 'justify-start'
         
        )}>
      <div className="relative">
        <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
            {currentUser.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <Badge variant="destructive" className="absolute -bottom-1 -right-2 text-xs px-1.5 py-0.5">1</Badge>
      </div>
      <div className={cn("flex flex-col", sidebarState === 'collapsed' && 'hidden')}>
        <p className="text-sm font-medium leading-none">{currentUser.name}</p>
        <p className="text-xs leading-none text-muted-foreground">
            {currentUser.email}
        </p>
      </div>
    </div>
  )
}
