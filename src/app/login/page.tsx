
import { redirect } from "next/navigation";

// This page is not used in the single-user demo.
export default function LoginPage() {
  redirect('/inbox');
}
