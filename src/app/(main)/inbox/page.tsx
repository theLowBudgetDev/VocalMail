
import { getInboxEmails, getLoggedInUser, getUsers } from "@/lib/actions";
import InboxPageClient from "./inbox-page-client";
import type { Email } from "@/lib/data";

export default async function InboxPage() {
    const currentUser = await getLoggedInUser();

    if (!currentUser) {
        // Render a safe state if the DB is not seeded
        return <InboxPageClient initialEmails={[]} users={[]} />;
    }

    const [inboxEmails, users] = await Promise.all([
        getInboxEmails(currentUser.id),
        getUsers(),
    ]);

    return <InboxPageClient initialEmails={inboxEmails as Email[]} users={users} />;
}
