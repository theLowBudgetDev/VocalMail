
import { getLoggedInUser } from "@/lib/actions";
import SearchPageClient from "./search-page-client";
import type { Email } from "@/lib/data";
import { searchEmailsWithAi } from "@/ai/flows/search-email-flow";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const currentUser = await getLoggedInUser();
  
  const query = searchParams?.q || '';
  let searchResults: Email[] = [];
  if (query) {
    const aiResult = await searchEmailsWithAi({ userId: currentUser.id, naturalLanguageQuery: query });
    searchResults = aiResult.results as Email[];
  }

  return <SearchPageClient initialResults={searchResults} initialQuery={query} />;
}
