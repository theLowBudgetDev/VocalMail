
import { getArchivedEmails, getLoggedInUser, getUsers } from "@/lib/actions";
import ArchivePageClient from "./archive-page-client";
import { redirect } from "next/navigation";
import type { Email } from "@/lib/data";

export default async function ArchivePage() {
    const currentUser = await getLoggedInUser();
    if (!currentUser) {
        redirect('/');
    }
    const [archivedEmails, users] = await Promise.all([
        getArchivedEmails(currentUser.id),
        getUsers(),
    ]);

    return <ArchivePageClient initialEmails={archivedEmails as Email[]} users={users} />;
}
