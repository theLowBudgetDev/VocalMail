
import DraftsPageClient from "./drafts-page-client";

export default async function DraftsPage() {
    // No user fetching needed in auth-free version for this page
    return <DraftsPageClient />;
}
