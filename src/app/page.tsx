
import { redirect } from 'next/navigation'

export default async function Home() {
  // In the authentication-free version, we always redirect to the inbox.
  redirect('/inbox');
}
