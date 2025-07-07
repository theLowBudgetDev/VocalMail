
"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { HelpCircle, Loader2, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils";

export function UserNav() {
  const { currentUser, isLoading } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin mx-auto" />
  }

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("w-full h-auto p-2 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:p-3", "group-data-[collapsible=icon]:justify-center justify-start")}>
            <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="avatar person" />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium leading-none truncate">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{currentUser.email}</p>
                </div>
            </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
             <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
             </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e) => e.preventDefault()}>
          <span className="flex-1">Dark Mode</span>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </DropdownMenuItem>
         <DropdownMenuItem asChild>
            <Link href="/help">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help</span>
            </Link>
         </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
