
import { getArchivedEmails, getLoggedInUser, getUsers } from "@/lib/actions";
import ArchivePageClient from "./archive-page-client";
import type { Email } from "@/lib/data";

export default async function ArchivePage() {
    const currentUser = await getLoggedInUser();

    if (!currentUser) {
        // Render a safe state if the DB is not seeded
        return <ArchivePageClient initialEmails={[]} users={[]} />;
    }
    
    const [archivedEmails, users] = await Promise.all([
        getArchivedEmails(currentUser.id),
        getUsers(),
    ]);

    return <ArchivePageClient initialEmails={archivedEmails as Email[]} users={users} />;
}
