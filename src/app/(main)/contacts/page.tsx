
import { getContacts, getLoggedInUser } from "@/lib/actions";
import ContactsPageClient from "./contacts-page-client";
import { redirect } from "next/navigation";
import { User } from "@/lib/data";


export default async function ContactsPage() {
    const currentUser = await getLoggedInUser() as User;
    const contacts = await getContacts(currentUser.id);
    
    return (
      <ContactsPageClient initialContacts={contacts} />
    );
}
