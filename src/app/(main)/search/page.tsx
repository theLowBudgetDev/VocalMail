
import { getLoggedInUser, searchEmails } from "@/lib/actions";
import SearchPageClient from "./search-page-client";
import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const currentUser = await getLoggedInUser();
  if (!currentUser) {
    redirect('/login?error=Session expired.');
  }

  const query = searchParams?.q || '';
  const searchResults = query ? await searchEmails(currentUser.id, query) : [];

  return <SearchPageClient initialResults={searchResults} initialQuery={query} />;
}
