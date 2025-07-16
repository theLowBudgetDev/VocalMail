
import { getContacts, getLoggedInUser } from "@/lib/actions";
import ContactsPageClient from "./contacts-page-client";

export default async function ContactsPage() {
    const currentUser = await getLoggedInUser();

    if (!currentUser) {
        return <ContactsPageClient initialContacts={[]} />;
    }

    const contacts = await getContacts(currentUser.id);
    
    return (
      <ContactsPageClient initialContacts={contacts} />
    );
}
