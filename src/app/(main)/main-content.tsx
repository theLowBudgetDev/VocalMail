
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
  Archive,
  Contact,
  FileText,
  Inbox,
  PenSquare,
  Search,
  Send,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/sent", label: "Sent", icon: Send },
  { href: "/drafts", label: "Drafts", icon: FileText },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/search", label: "Search", icon: Search },
];

export default function VocalMailMainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <Sidebar className="hidden md:flex md:flex-col">
        <SidebarHeader className="border-b h-12">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
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
          <div className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="mt-2">
            <SidebarMenuItem className="px-2">
              <SidebarMenuButton
                asChild
                size="default"
                variant="default"
                isActive={pathname === "/compose"}
              >
                <Link href="/compose">
                  <PenSquare />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Compose
                  </span>
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
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto border-t">
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col flex-1">{children}</div>
    </>
  );
}
