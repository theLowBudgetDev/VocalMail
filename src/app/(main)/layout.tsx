
import { getLoggedInUser } from "@/lib/actions";
import VocalMailLayoutClient from "./layout-client";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

function LoadingFallback() {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default function VocalMailLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <Suspense fallback={<LoadingFallback />}>
      <VocalMailLayoutWithData>
        {children}
      </VocalMailLayoutWithData>
    </Suspense>
  );
}

async function VocalMailLayoutWithData({ children }: { children: React.ReactNode }) {
  const currentUser = await getLoggedInUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <VocalMailLayoutClient currentUser={currentUser}>
        {children}
      </VocalMailLayoutClient>
    </SidebarProvider>
  );
}
