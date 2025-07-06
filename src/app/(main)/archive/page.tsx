
import { getArchivedEmails, getLoggedInUser } from "@/lib/actions";
import ArchivePageClient from "./archive-page-client";
import { redirect } from "next/navigation";
import { assert } from "console";
import { User } from "@/lib/data";

export default async function ArchivePage() {
    const currentUser = await getLoggedInUser() as User;
    const archivedEmails = await getArchivedEmails(currentUser.id);

    return <ArchivePageClient initialEmails={archivedEmails} />;
}
