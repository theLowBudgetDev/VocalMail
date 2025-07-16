
import { getContacts, getLoggedInUser } from "@/lib/actions";
import ContactsPageClient from "./contacts-page-client";

export default async function ContactsPage() {
    const currentUser = await getLoggedInUser();
    const contacts = await getContacts(currentUser.id);
    
    return (
      <ContactsPageClient initialContacts={contacts} />
    );
}
