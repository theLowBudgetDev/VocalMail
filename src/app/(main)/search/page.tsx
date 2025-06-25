"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { emails as allEmails, type Email } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function SearchResultsPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    
    const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null);
    const { play, stop } = useTextToSpeech();

    const searchResults = React.useMemo(() => {
        if (!query) return [];
        const lowercasedQuery = query.toLowerCase();
        return allEmails.filter(email => 
            email.subject.toLowerCase().includes(lowercasedQuery) ||
            email.body.toLowerCase().includes(lowercasedQuery) ||
            email.from.name.toLowerCase().includes(lowercasedQuery) ||
            (email.to && email.to.name.toLowerCase().includes(lowercasedQuery))
        );
    }, [query]);

    const handleReadEmail = (email: Email) => {
        if (!email) return;
        stop();
        setSelectedEmail(email);
        setTimeout(() => {
             const intro = email.tag === 'sent' ? `Email to ${email.to?.name}` : `Email from ${email.from.name}`;
             play(`${intro}. Subject: ${email.subject}. Body: ${email.body}`);
        }, 100);
    }

    React.useEffect(() => {
        if (query) {
            play(`Showing ${searchResults.length} results for your search: ${query}.`);
        }
    }, [query, searchResults.length, play]);


    React.useEffect(() => {
        const handleCommand = (event: CustomEvent) => {
            const { command, emailId } = event.detail;

            if (command === 'action_help') {
                play("You are on the search results page. Say 'read email' and a number to hear an email. You can also use global navigation or search commands.");
            } else if (command === 'action_read_email' && emailId > 0 && emailId <= searchResults.length) {
                const emailToRead = searchResults[emailId - 1];
                handleReadEmail(emailToRead);
            } else if (command === 'action_read_list') {
                 if (searchResults.length === 0) {
                    play("There are no search results.");
                    return;
                }
                const emailSnippets = searchResults.map((email, index) => 
                    `Email ${index + 1}: From ${email.from.name}, Subject: ${email.subject}.`
                ).join(' ');
                const fullText = `You have ${searchResults.length} search results. ${emailSnippets}`;
                play(fullText);
            }
        };
        window.addEventListener('voice-command', handleCommand as EventListener);
        return () => window.removeEventListener('voice-command', handleCommand as EventListener);
    }, [searchResults, play]);

    return (
      <div className="p-4 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Search Results</CardTitle>
                {query && <CardDescription>Showing results for: "{query}"</CardDescription>}
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>From/To</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Tag</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {searchResults.map((email, index) => (
                            <TableRow key={email.id} onClick={() => setSelectedEmail(email)} className="cursor-pointer">
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">
                                    {email.tag === 'sent' ? `To: ${email.to?.name}` : `From: ${email.from.name}`}
                                </TableCell>
                                <TableCell>{email.subject}</TableCell>
                                <TableCell><span className="capitalize bg-muted px-2 py-1 rounded-md text-sm">{email.tag}</span></TableCell>
                                <TableCell className="text-right">{format(new Date(email.date), "PPP")}</TableCell>
                            </TableRow>
                        ))}
                        {searchResults.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    {query ? `No results found for "${query}".` : "Use the global voice command 'search for emails about...' to start a search."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        {selectedEmail && (
            <Dialog open={!!selectedEmail} onOpenChange={(isOpen) => { if (!isOpen) { stop(); setSelectedEmail(null); } }}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>{selectedEmail.subject}</DialogTitle>
                        <DialogDescription>
                            {selectedEmail.tag === 'sent' 
                                ? `To: ${selectedEmail.to?.name} <${selectedEmail.to?.email}>`
                                : `From: ${selectedEmail.from.name} <${selectedEmail.from.email}>`
                            }
                            <br />
                            Date: {format(new Date(selectedEmail.date), "PPP p")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                        {selectedEmail.body}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleReadEmail(selectedEmail)}>Read Aloud</Button>
                        <Button onClick={() => { stop(); setSelectedEmail(null); }}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </div>
    );
}


export default function SearchPage() {
    return (
        <React.Suspense fallback={<div>Loading search results...</div>}>
            <SearchResultsPage />
        </React.Suspense>
    )
}
