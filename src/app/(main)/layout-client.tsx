
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Archive,
  Contact,
  Inbox,
  Send,
  PenSquare,
  Search,
  FileText,
  Menu,
} from "lucide-react";

import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { VoiceCommander } from "@/components/voice-commander";
import { UserNav } from "@/components/user-nav";
import { CurrentUserProvider } from "@/hooks/use-current-user";
import type { User } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import VocalMailMainContent from "./main-content";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider } from "@/components/ui/sidebar";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/sent", label: "Sent", icon: Send },
  { href: "/drafts", label: "Drafts", icon: FileText },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/search", label: "Search", icon: Search },
];

function MobileHeader() {
    const isMobile = useIsMobile();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);

    if (!isMobile) return null;

    return (
        <div className="md:hidden flex items-center justify-between p-2 border-b h-12 shrink-0 bg-background">
            <div className="flex items-center gap-2">
                 <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-primary"
                  fill="currentColor"
                >
                  <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
                </svg>
                <span className="font-semibold text-lg">VocalMail</span>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                  <span className="sr-only">Open Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-64">
                 <SidebarContentForSheet onLinkClick={() => setIsSheetOpen(false)} />
              </SheetContent>
            </Sheet>
        </div>
    )
}

function SidebarContentForSheet({ onLinkClick }: { onLinkClick: () => void }) {
    const pathname = usePathname();
    return (
        <div className="flex flex-col h-full">
            <SidebarHeader className="border-b h-12">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-6 w-6 text-primary"
                      fill="currentColor"
                    >
                      <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
                    </svg>
                  </div>
                  <span className={cn("font-semibold text-lg")}>VocalMail</span>
                </div>
              </SidebarHeader>
              <SidebarContent className="p-0 flex-1">
                <SidebarMenu>
                  <SidebarMenuItem className="px-2">
                    <SidebarMenuButton
                      asChild
                      size="default"
                      variant="default"
                      isActive={pathname === '/compose'}
                      onClick={onLinkClick}
                    >
                      <Link href="/compose">
                        <PenSquare />
                        <span>Compose</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href + item.label} className="px-2">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        size="default"
                        tooltip={item.label}
                        variant="default"
                        onClick={onLinkClick}
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
              <SidebarFooter className="p-2 mt-auto border-t">
                <UserNav />
              </SidebarFooter>
        </div>
    );
}


export default function VocalMailLayoutClient({
  currentUser,
  children,
}: {
  currentUser: User;
  children: React.ReactNode;
}) {

  return (
    <CurrentUserProvider initialUser={currentUser}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen w-screen overflow-hidden">
          <VocalMailMainContent>
              <MobileHeader />
               <div className="flex-1 overflow-y-auto">
                 {children}
               </div>
          </VocalMailMainContent>
          <VoiceCommander />
        </div>
      </SidebarProvider>
    </CurrentUserProvider>
  );
}
