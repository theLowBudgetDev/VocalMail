
import { getLoggedInUser } from "@/lib/actions";
import VocalMailLayoutClient from "./layout-client";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

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
    // This should redirect to a login page in a real app.
    // For this demo, we can show an error or redirect to a simple page.
    // But since getLoggedInUser is hardcoded, this path is unlikely.
    redirect("/");
  }

  return (
    <VocalMailLayoutClient currentUser={currentUser}>
      {children}
    </VocalMailLayoutClient>
  );
}
