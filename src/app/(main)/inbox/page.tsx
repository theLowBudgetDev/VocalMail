
import { getInboxEmails, getLoggedInUser } from "@/lib/actions";
import InboxPageClient from "./inbox-page-client";
import { redirect } from "next/navigation";

export default async function InboxPage() {
    const currentUser = await getLoggedInUser();
    if (!currentUser) {
        redirect('/login?error=Session expired.');
    }
    const inboxEmails = await getInboxEmails(currentUser.id);

    return <InboxPageClient initialEmails={inboxEmails} />;
}
