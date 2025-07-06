
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Contact,
  Inbox,
  Send,
  FilePenLine,
  Mail,
  Search,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { VoiceCommander } from "@/components/voice-commander";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CurrentUserProvider } from "@/hooks/use-current-user";
import type { User } from "@/lib/data";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/sent", label: "Sent", icon: Send },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/search", label: "Search", icon: Search },
];

export default function VocalMailLayoutClient({
  currentUser,
  allUsers,
  children,
}: {
  currentUser: User;
  allUsers: User[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <CurrentUserProvider initialUser={currentUser}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Mail className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold group-data-[collapsible=icon]:hidden">VocalMail</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem className="p-2">
                <Button asChild className="w-full justify-start h-12 text-lg group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:p-3">
                  <Link href="/compose">
                    <FilePenLine className="mr-2 h-5 w-5 group-data-[collapsible=icon]:mr-0" />
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
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-semibold md:text-2xl capitalize">{pathname.split(/[\/-]/).pop()?.replace(/\[id\]/,'') || 'Inbox'}</h1>
              <div className="ml-auto flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href="/help">
                            <HelpCircle />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Help</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <ModeToggle />
                  <UserNav allUsers={allUsers} />
              </div>
          </header>
          <div className="flex-1 overflow-auto bg-background">
              {children}
          </div>
          <VoiceCommander />
        </SidebarInset>
      </SidebarProvider>
    </CurrentUserProvider>
  );
}
