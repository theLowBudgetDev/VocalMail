
import { getLoggedInUser } from "@/lib/actions";
import VocalMailLayoutClient from "./layout-client";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { User } from "@/lib/data";

function LoadingFallback() {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

// A fallback user to prevent crashes when the database is empty.
const fallbackUser: User = {
    id: 0,
    name: "VocalMail",
    email: "system@vocalmail.app",
    password: "",
};


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

  // If DB is not seeded, currentUser will be null. We use a fallback user
  // for the layout client to prevent it from crashing, while pages show an empty state.
  return (
      <VocalMailLayoutClient currentUser={currentUser ?? fallbackUser}>
        {children}
      </VocalMailLayoutClient>
  );
}
