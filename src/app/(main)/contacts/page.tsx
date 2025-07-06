
import { getContacts, getLoggedInUser } from "@/lib/actions";
import ContactsPageClient from "./contacts-page-client";
import { redirect } from "next/navigation";

export default async function ContactsPage() {
    const currentUser = await getLoggedInUser();
    if (!currentUser) {
        redirect('/login?error=Session expired.');
    }
    const contacts = await getContacts(currentUser.id);
    
    return (
      <ContactsPageClient initialContacts={contacts} />
    );
}
