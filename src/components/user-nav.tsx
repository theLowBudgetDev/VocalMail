
"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { HelpCircle, Loader2, Settings, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { logoutUser } from "@/lib/actions";

export function UserNav() {
  const { currentUser, isLoading } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin mx-auto" />
  }

  if (!currentUser) return null;

  const handleLogout = async () => {
    await logoutUser();
  }

  return (
    <div className={cn("w-full flex items-center gap-2 p-2", "group-data-[collapsible=icon]:p-3 group-data-[collapsible=icon]:justify-center")}>
        <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name} data-ai-hint="avatar person" />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium leading-none truncate">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{currentUser.email}</p>
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 mb-2" align="end" side="top">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <Switch
                      id="dark-mode"
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                  </div>
                   <Button variant="outline" className="w-full" asChild>
                    <Link href="/help">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help
                    </Link>
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
        </div>
    </div>
  )
}
