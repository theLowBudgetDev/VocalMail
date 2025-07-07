
import { getInboxEmails, getLoggedInUser, getUsers } from "@/lib/actions";
import InboxPageClient from "./inbox-page-client";
import { redirect } from "next/navigation";

export default async function InboxPage() {
    const currentUser = await getLoggedInUser();
    if (!currentUser) {
        redirect('/login?error=Session expired.');
    }
    const [inboxEmails, users] = await Promise.all([
        getInboxEmails(currentUser.id),
        getUsers(),
    ]);

    return <InboxPageClient initialEmails={inboxEmails} users={users} />;
}
