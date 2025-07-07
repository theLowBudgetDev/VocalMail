
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import {
  Archive,
  Contact,
  Inbox,
  Send,
  FilePenLine,
  Search,
  Settings,
  PanelLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { VoiceCommander } from "@/components/voice-commander";
import { UserNav } from "@/components/user-nav";
import { CurrentUserProvider } from "@/hooks/use-current-user";
import type { User } from "@/lib/data";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/sent", label: "Sent", icon: Send },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/search", label: "Search", icon: Search },
];

export default function VocalMailLayoutClient({
  currentUser,
  children,
}: {
  currentUser: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <CurrentUserProvider initialUser={currentUser}>
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon">
           <SidebarRail />
          <SidebarHeader className="p-2">
             <div className="flex items-center justify-between h-12">
               <div className="flex items-center gap-2">
                   <div className="w-8 h-8 flex items-center justify-center">
                       <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="h-6 w-6 text-primary"
                          fill="currentColor"
                       >
                         <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/>
                       </svg>
                   </div>
                    <span className={cn("font-semibold text-lg group-data-[collapsible=icon]:hidden")}>VocalMail</span>
               </div>
                <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem className="p-2">
                <Button asChild className="w-full justify-start h-12 text-md group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:p-3">
                  <Link href="/compose">
                    <FilePenLine className="mr-3 h-5 w-5 group-data-[collapsible=icon]:mr-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Compose</span>
                  </Link>
                </Button>
              </SidebarMenuItem>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href} className="px-2">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    size="lg"
                    tooltip={item.label}
                    variant="ghost"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 mt-auto">
             <SidebarMenu>
                <SidebarMenuItem>
                   <SidebarMenuButton
                        onClick={toggleTheme}
                        size="lg"
                        tooltip="Toggle Theme"
                        variant="ghost"
                      >
                        <Settings />
                        <span className="group-data-[collapsible=icon]:hidden">Toggle Theme</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                   <UserNav />
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="flex-1 overflow-auto bg-background">
              {children}
          </div>
          <VoiceCommander />
        </SidebarInset>
      </SidebarProvider>
    </CurrentUserProvider>
  );
}
