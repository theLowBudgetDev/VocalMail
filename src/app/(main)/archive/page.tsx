
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getArchivedEmails, deleteUserEmail } from "@/lib/actions";
import type { Email } from "@/lib/data";
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
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export default function ArchivePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentUser } = useCurrentUser();
    const [selectedEmail, setSelectedEmail] = React.useState<Email | null>(null);
    const [archivedEmails, setArchivedEmails] = React.useState<Email[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { play, stop, isPlaying } = useTextToSpeech();

    const fetchEmails = React.useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const emails = await getArchivedEmails(currentUser.id);
            setArchivedEmails(emails);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Failed to load emails." });
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    React.useEffect(() => {
        fetchEmails();
    }, [fetchEmails]);


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
          `Email ${index + 1}: From ${email.senderName}, Subject: ${email.subject}.`
        ).join(' ');
        const fullText = `You have ${archivedEmails.length} archived emails. ${emailSnippets} To read an email, say 'read email' followed by its number.`;
        play(fullText);
    }, [archivedEmails, isPlaying, play, stop]);


    const handleReadEmail = (email: Email) => {
        if (!email) return;
        stop();
        setSelectedEmail(email);
        setTimeout(() => {
             play(`Email from ${email.senderName}. Subject: ${email.subject}. Body: ${email.body}`);
        }, 100);
    }

    const handleDelete = async (emailId: number) => {
        if (!currentUser) return;
        try {
            await deleteUserEmail(emailId, currentUser.id, 'archive');
            toast({ title: "Email Deleted" });
            setSelectedEmail(null);
            fetchEmails(); // Refetch
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Failed to delete email.' });
        }
    }

    React.useEffect(() => {
        const autorun = searchParams.get('autorun');
        if (autorun === 'read_list' && !isLoading) {
            play("Navigated to Archive.", handleReadList);
            router.replace('/archive', {scroll: false});
        }
    }, [searchParams, play, handleReadList, router, isLoading]);

    React.useEffect(() => {
        const handleCommand = (event: CustomEvent) => {
            const { command, emailId } = event.detail;

            if (command === 'action_help') {
                play("You are viewing archived emails. Say 'read the list' or 'read email' and a number to hear an email. You can also say 'delete' and a number.");
            } else if (command === 'action_read_list') {
                handleReadList();
            } else if (command === 'action_read_email' && emailId > 0 && emailId <= archivedEmails.length) {
                const emailToRead = archivedEmails[emailId - 1];
                handleReadEmail(emailToRead);
            } else if (command === 'action_delete' && emailId > 0 && emailId <= archivedEmails.length) {
                 const emailToDelete = archivedEmails[emailId - 1];
                 play(`Deleting email ${emailId}.`);
                 handleDelete(emailToDelete.id);
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
                 {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
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
                                <TableCell className="font-medium">{email.senderName}</TableCell>
                                <TableCell>{email.subject}</TableCell>
                                <TableCell className="text-right">{format(new Date(email.sentAt), "PPP")}</TableCell>
                            </TableRow>
                        ))}
                        {archivedEmails.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No archived emails.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                )}
            </CardContent>
        </Card>
        {selectedEmail && (
            <Dialog open={!!selectedEmail} onOpenChange={(isOpen) => { if (!isOpen) { stop(); setSelectedEmail(null); } }}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>{selectedEmail.subject || "Email Details"}</DialogTitle>
                        <DialogDescription>
                            From: {selectedEmail.senderName} &lt;{selectedEmail.senderEmail}&gt;
                            <br />
                            Date: {format(new Date(selectedEmail.sentAt), "PPP p")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                        {selectedEmail.body}
                    </div>
                    <DialogFooter className="sm:justify-between">
                         <Button variant="destructive" onClick={() => handleDelete(selectedEmail.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleReadEmail(selectedEmail)}>Read Aloud</Button>
                            <Button onClick={() => { stop(); setSelectedEmail(null); }}>Close</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </div>
    );
}
