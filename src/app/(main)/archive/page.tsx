
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { emails, type Email } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

export default function ArchivePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null);
    const archivedEmails = emails.filter((email) => email.tag === 'archive');
    const { play, stop, isPlaying } = useTextToSpeech();

    const handleReadList = React.useCallback(() => {
        if (isPlaying) {
            stop();
            return;
        }
        if (archivedEmails.length === 0) {
            play("Your archive is empty.");
            return;
        }
        const emailSnippets = archivedEmails.map((email, index) => 
          `Email ${index + 1}: From ${email.from.name}, Subject: ${email.subject}.`
        ).join(' ');
        const fullText = `You have ${archivedEmails.length} archived emails. ${emailSnippets} To read an email, say 'read email' followed by its number.`;
        play(fullText);
    }, [archivedEmails, isPlaying, play, stop]);


    const handleReadEmail = (email: Email) => {
        if (!email) return;
        stop();
        setSelectedEmail(email);
        setTimeout(() => {
             play(`Email from ${email.from.name}. Subject: ${email.subject}. Body: ${email.body}`);
        }, 100);
    }

    React.useEffect(() => {
        const autorun = searchParams.get('autorun');
        if (autorun === 'read_list') {
            play("Navigated to Archive.", handleReadList);
            router.replace('/archive', {scroll: false});
        }
    }, [searchParams, play, handleReadList, router]);

    React.useEffect(() => {
        const handleCommand = (event: CustomEvent) => {
            const { command, emailId } = event.detail;

            if (command === 'action_help') {
                play("You are viewing archived emails. Say 'read the list' or 'read email' and a number to hear an email.");
            } else if (command === 'action_read_list') {
                handleReadList();
            } else if (command === 'action_read_email' && emailId > 0 && emailId <= archivedEmails.length) {
                const emailToRead = archivedEmails[emailId - 1];
                handleReadEmail(emailToRead);
            }
        };
        window.addEventListener('voice-command', handleCommand as EventListener);
        return () => window.removeEventListener('voice-command', handleCommand as EventListener);
    }, [archivedEmails, play, handleReadList]);

    return (
      <div className="p-4 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Archive</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {archivedEmails.map((email, index) => (
                            <TableRow key={email.id} onClick={() => setSelectedEmail(email)} className="cursor-pointer">
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{email.from.name}</TableCell>
                                <TableCell>{email.subject}</TableCell>
                                <TableCell className="text-right">{format(new Date(email.date), "PPP")}</TableCell>
                            </TableRow>
                        ))}
                        {archivedEmails.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No archived emails.</TableCell>
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
                        <DialogTitle>{selectedEmail.subject || "Email Details"}</DialogTitle>
                        <DialogDescription>
                            From: {selectedEmail.from.name} &lt;{selectedEmail.from.email}&gt;
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
