
import { redirect } from "next/navigation";

export default function LoginPage() {
  // This page is no longer used and redirects to the inbox.
  redirect('/inbox');
}
