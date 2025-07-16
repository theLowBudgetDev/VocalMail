
import { getInboxEmails, getLoggedInUser, getUsers } from "@/lib/actions";
import InboxPageClient from "./inbox-page-client";
import type { Email } from "@/lib/data";

export default async function InboxPage() {
    const currentUser = await getLoggedInUser();
    const [inboxEmails, users] = await Promise.all([
        getInboxEmails(currentUser.id),
        getUsers(),
    ]);

    return <InboxPageClient initialEmails={inboxEmails as Email[]} users={users} />;
}
