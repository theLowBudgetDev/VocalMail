
import { getLoggedInUser, getUsers } from "@/lib/actions";
import { redirect } from "next/navigation";
import VocalMailLayoutClient from "./layout-client";

export default async function VocalMailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, allUsers] = await Promise.all([
    getLoggedInUser(),
    getUsers()
  ]);

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <VocalMailLayoutClient currentUser={currentUser} allUsers={allUsers}>
      {children}
    </VocalMailLayoutClient>
  );
}
