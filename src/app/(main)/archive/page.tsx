
import { getArchivedEmails, getLoggedInUser } from "@/lib/actions";
import ArchivePageClient from "./archive-page-client";
import { redirect } from "next/navigation";

export default async function ArchivePage() {
    const currentUser = await getLoggedInUser();
    if (!currentUser) {
        redirect('/login');
    }
    const archivedEmails = await getArchivedEmails(currentUser.id);

    return <ArchivePageClient initialEmails={archivedEmails} />;
}
