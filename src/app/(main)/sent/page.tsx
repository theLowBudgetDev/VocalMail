
import { getSentEmails, getLoggedInUser } from "@/lib/actions";
import SentPageClient from "./sent-page-client";
import { redirect } from "next/navigation";
import { User } from "@/lib/data";

export default async function SentPage() {
    const currentUser = await getLoggedInUser() as User;
    const sentEmails = await getSentEmails(currentUser.id);

    return <SentPageClient initialEmails={sentEmails} />;
}
