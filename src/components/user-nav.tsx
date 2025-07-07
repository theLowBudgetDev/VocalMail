
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Loader2 } from "lucide-react"
import { useSidebar } from "./ui/sidebar";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function UserNav() {
  const { currentUser, isLoading } = useCurrentUser();
  const { state: sidebarState } = useSidebar();

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin mx-auto" />
  }

  if (!currentUser) return null;

  return (
    <Button variant="ghost" className={cn("flex items-center gap-2 p-2 rounded-lg w-full h-auto", sidebarState === 'collapsed' ? 'justify-center' : 'justify-start')}>
      <div className="relative">
        <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="avatar person" />
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
            {currentUser.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <Badge variant="destructive" className="absolute -bottom-1 -right-2 text-xs px-1 py-0">1</Badge>
      </div>
      <div className={cn("flex flex-col items-start", sidebarState === 'collapsed' && 'hidden')}>
        <p className="text-sm font-medium leading-none">{currentUser.name}</p>
        <p className="text-xs leading-none text-muted-foreground">
            {currentUser.email}
        </p>
      </div>
    </Button>
  )
}
