
import { getLoggedInUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import VocalMailLayoutClient from "./layout-client";

export default async function VocalMailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getLoggedInUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <VocalMailLayoutClient currentUser={currentUser}>
      {children}
    </VocalMailLayoutClient>
  );
}
