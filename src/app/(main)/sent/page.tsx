
import { getSentEmails, getLoggedInUser, getUsers } from "@/lib/actions";
import SentPageClient from "./sent-page-client";
import { redirect } from "next/navigation";

export default async function SentPage() {
    const currentUser = await getLoggedInUser();
    if (!currentUser) {
        redirect('/');
    }
    const [sentEmails, users] = await Promise.all([
        getSentEmails(currentUser.id),
        getUsers(),
    ]);

    return <SentPageClient initialEmails={sentEmails} users={users} />;
}
