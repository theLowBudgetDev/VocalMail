
import { getLoggedInUser } from "@/lib/actions";
import VocalMailLayoutClient from "./layout-client";
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

  // In this auth-free version, currentUser should always exist if DB is seeded.
  // If not, an error will be thrown by getLoggedInUser, which is desired.

  return (
      <VocalMailLayoutClient currentUser={currentUser!}>
        {children}
      </VocalMailLayoutClient>
  );
}
