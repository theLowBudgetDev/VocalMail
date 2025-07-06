
import { getSentEmails, getLoggedInUser } from "@/lib/actions";
import SentPageClient from "./sent-page-client";
import { redirect } from "next/navigation";

export default async function SentPage() {
    const currentUser = await getLoggedInUser();
    if (!currentUser) {
        redirect('/login?error=Session expired.');
    }
    const sentEmails = await getSentEmails(currentUser.id);

    return <SentPageClient initialEmails={sentEmails} />;
}
