
import { getLoggedInUser } from "@/lib/actions";
import VocalMailLayoutClient from "./layout-client";
import { redirect } from "next/navigation";

export default async function VocalMailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getLoggedInUser();

  // This should theoretically not happen anymore, but as a safeguard.
  if (!currentUser) {
    redirect("/");
  }

  return (
    <VocalMailLayoutClient currentUser={currentUser}>
      {children}
    </VocalMailLayoutClient>
  );
}
