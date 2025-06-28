
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

export default function SentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null);
    const sentEmails = emails.filter((email) => email.tag === 'sent');
    const { play, stop, isPlaying } = useTextToSpeech();

    const handleReadList = React.useCallback(() => {
        if (isPlaying) {
            stop();
            return;
        }
        if (sentEmails.length === 0) {
            play("Your sent folder is empty.");
            return;
        }
        const emailSnippets = sentEmails.map((email, index) => 
          `Email ${index + 1}: To ${email.to?.name || 'N/A'}, Subject: ${email.subject}.`
        ).join(' ');
        const fullText = `You have ${sentEmails.length} sent emails. ${emailSnippets} To read an email, say 'read email' followed by its number.`;
        play(fullText);
    }, [sentEmails, isPlaying, play, stop]);

    const handleReadEmail = (email: Email) => {
        if (!email) return;
        stop();
        setSelectedEmail(email);
        setTimeout(() => {
             play(`Email to ${email.to?.name}. Subject: ${email.subject}. Body: ${email.body}`);
        }, 100);
    }

    React.useEffect(() => {
        const autorun = searchParams.get('autorun');
        if (autorun === 'read_list') {
            play("Navigated to Sent.", handleReadList);
            router.replace('/sent', {scroll: false});
        }
    }, [searchParams, play, handleReadList, router]);

    React.useEffect(() => {
        const handleCommand = (event: CustomEvent) => {
            const { command, emailId } = event.detail;
            if (command === 'action_help') {
                play("You are viewing sent emails. Say 'read the list' or 'read email' and a number to hear an email.");
            } else if (command === 'action_read_list') {
                handleReadList();
            } else if (command === 'action_read_email' && emailId > 0 && emailId <= sentEmails.length) {
                const emailToRead = sentEmails[emailId - 1];
                handleReadEmail(emailToRead);
            }
        };
        window.addEventListener('voice-command', handleCommand as EventListener);
        return () => window.removeEventListener('voice-command', handleCommand as EventListener);
    }, [sentEmails, play, handleReadList]);

    return (
      <div className="p-4 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Sent</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sentEmails.map((email, index) => (
                            <TableRow key={email.id} onClick={() => setSelectedEmail(email)} className="cursor-pointer">
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{email.to?.name || 'N/A'}</TableCell>
                                <TableCell>{email.subject}</TableCell>
                                <TableCell className="text-right">{format(new Date(email.date), "PPP")}</TableCell>
                            </TableRow>
                        ))}
                         {sentEmails.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No sent emails.</TableCell>
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
                            To: {selectedEmail.to?.name} &lt;{selectedEmail.to?.email}&gt;
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
