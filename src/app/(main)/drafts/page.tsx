
import { getLoggedInUser } from "@/lib/actions";
import DraftsPageClient from "./drafts-page-client";
import { redirect } from "next/navigation";

export default async function DraftsPage() {
    const currentUser = await getLoggedInUser();
    if (!currentUser) {
        redirect('/');
    }
    // No drafts functionality, so no props are passed
    return <DraftsPageClient />;
}
