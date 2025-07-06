
import { getInboxEmails, getLoggedInUser } from "@/lib/actions";
import InboxPageClient from "./inbox-page-client";
import { redirect } from "next/navigation";
import { User } from "@/lib/data";

export default async function InboxPage() {
    const currentUser = await getLoggedInUser() as User;
    const inboxEmails = await getInboxEmails(currentUser.id);

    return <InboxPageClient initialEmails={inboxEmails} />;
}
