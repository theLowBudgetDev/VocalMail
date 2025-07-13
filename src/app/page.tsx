
import { getLoggedInUser } from "@/lib/actions";
import { redirect } from 'next/navigation'

export default async function Home() {
  const user = await getLoggedInUser();
  if (user) {
    redirect('/inbox');
  } else {
    redirect('/login');
  }
}
