
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Trash2, ArrowLeft, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Email, User } from "@/lib/data";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { deleteUserEmail, unarchiveEmail } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface ArchivePageClientProps {
    initialEmails: Email[];
    users: User[];
}

export default function ArchivePageClient({ initialEmails, users }: ArchivePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { currentUser } = useCurrentUser();
  
  const [archivedEmails, setArchivedEmails] = React.useState<Email[]>(initialEmails);
  const [selectedEmailId, setSelectedEmailId] = React.useState<number | null>(null);

  const { isPlaying, play, stop } = useTextToSpeech();
  
  const selectedEmail = React.useMemo(() => {
    if (!selectedEmailId) return null;
    return archivedEmails.find((email) => email.id === selectedEmailId);
  }, [selectedEmailId, archivedEmails]);

  const senderOfSelectedEmail = React.useMemo(() => {
    if (!selectedEmail) return null;
    return users.find(u => u.id === selectedEmail.senderId);
  }, [selectedEmail, users]);

  React.useEffect(() => {
    setArchivedEmails(initialEmails);
  }, [initialEmails]);

  const handleReadList = React.useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }
    if (archivedEmails.length === 0) {
      play("Your archive is empty.");
      return;
    }

    const emailSnippets = archivedEmails
      .map(
        (email, index) =>
          `Email ${index + 1}: From ${email.senderName}, Subject: ${email.subject}.`
      )
      .join(" ");

    const summary = `You have ${archivedEmails.length} archived emails. ${emailSnippets} To read an email, say 'read email' followed by its number.`;
    play(summary);
  }, [archivedEmails, isPlaying, play, stop]);
  
  React.useEffect(() => {
    const autorun = searchParams.get('autorun');
    if (autorun === 'read_list') {
        play("Navigated to Archive.", handleReadList);
        router.replace('/archive', {scroll: false});
    }
  }, [searchParams, play, handleReadList, router]);


  React.useEffect(() => {
    if (isMobile) {
      setSelectedEmailId(null);
    }
  }, [isMobile]);
  
  const handleSelectEmail = React.useCallback(async (email: Email) => {
    if (isPlaying) {
        stop();
    }
    setSelectedEmailId(email.id); 
  }, [isPlaying, stop]);

  const handlePlayEmail = React.useCallback((emailToRead?: Email) => {
    if (emailToRead) {
      handleSelectEmail(emailToRead);
      setTimeout(() => {
        const textToRead = `Email from ${emailToRead.senderName}. Subject: ${emailToRead.subject}. Body: ${emailToRead.body}`;
        play(textToRead);
      }, 100)
    }
  }, [handleSelectEmail, play]);

  const handleUnarchiveEmail = React.useCallback(async () => {
    if (selectedEmailId && currentUser) {
       stop();
       play("Email moved to inbox.");
       await unarchiveEmail(selectedEmailId, currentUser.id);
       const nextEmails = archivedEmails.filter(e => e.id !== selectedEmailId);
       setArchivedEmails(nextEmails);
       setSelectedEmailId(null);
       router.refresh();
       toast({ title: "Email Unarchived" });
    }
  }, [selectedEmailId, currentUser, stop, play, router, archivedEmails]);
  
  const handleDeleteEmail = React.useCallback(async () => {
    if (selectedEmailId && currentUser) {
       stop();
       play("Email deleted.");
       await deleteUserEmail(selectedEmailId, currentUser.id, 'archive');
       const nextEmails = archivedEmails.filter(e => e.id !== selectedEmailId);
       setArchivedEmails(nextEmails);
       setSelectedEmailId(null);
       router.refresh();
       toast({ title: "Email Deleted" });
    }
  }, [selectedEmailId, currentUser, stop, play, router, archivedEmails]);

  React.useEffect(() => {
    const handleCommand = (event: CustomEvent) => {
      if (!event.detail) return;
      const { command, emailId } = event.detail;
      switch (command) {
        case 'action_read_list':
          handleReadList();
          break;
        case 'action_read_email':
          if (emailId && emailId > 0 && emailId <= archivedEmails.length) {
            handlePlayEmail(archivedEmails[emailId - 1]);
          } else {
            play(`Sorry, I couldn't find email number ${emailId}.`);
          }
          break;
        case 'action_unarchive':
          handleUnarchiveEmail();
          break;
        case 'action_delete':
          handleDeleteEmail();
          break;
        case 'action_help':
          play("You are in your archive. You can say 'read the list', 'read email' followed by a number, 'unarchive', or 'delete'.");
          break;
      }
    };
    window.addEventListener('voice-command', handleCommand as EventListener);
    return () => {
      window.removeEventListener('voice-command', handleCommand as EventListener);
    };
  }, [handleReadList, handlePlayEmail, handleDeleteEmail, handleUnarchiveEmail, archivedEmails, play]);

  React.useEffect(() => {
    return () => stop();
  }, [selectedEmailId, stop]);

  const getSenderAvatar = (senderId: number) => {
      const sender = users.find(u => u.id === senderId);
      return sender?.avatar || '';
  }

  return (
    <TooltipProvider>
      <div className={cn("flex flex-row h-screen", isMobile && selectedEmailId ? "flex-col" : "")}>
        <div className={cn(
            "w-full md:w-[320px] lg:w-[380px] shrink-0 border-r bg-background flex flex-col",
            isMobile && selectedEmailId && "hidden"
          )}>
          <div className="flex items-center p-2 h-12 border-b shrink-0">
            <h2 className="text-lg font-bold px-2">Archive</h2>
          </div>
          <ScrollArea className="flex-1">
             {archivedEmails.length > 0 ? (
                <div className="flex flex-col">
                    {archivedEmails.map((email) => (
                        <button
                          key={email.id}
                          className={cn(
                              "w-full text-left p-4 flex gap-4 items-start border-b border-border",
                              selectedEmailId === email.id && "bg-muted"
                          )}
                          onClick={() => handleSelectEmail(email)}
                         >
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={getSenderAvatar(email.senderId)} alt={email.senderName} data-ai-hint="avatar person" />
                              <AvatarFallback>{email.senderName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden grid gap-0.5">
                              <div className="flex justify-between items-baseline">
                                  <p className={cn("font-semibold text-sm truncate text-muted-foreground")}>
                                    {email.senderName}
                                  </p>
                                  <p className={cn("text-xs shrink-0 text-muted-foreground")}>
                                      {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
                                  </p>
                              </div>
                              <p className={cn("font-semibold text-sm truncate text-muted-foreground")}>
                                {email.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {email.body}
                              </p>
                          </div>
                         </button>
                    ))}
                </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">No emails in archive.</div>
            )}
          </ScrollArea>
        </div>
        <div className={cn(
            "flex-1 bg-background flex flex-col",
            isMobile && !selectedEmailId ? "hidden" : "flex flex-col"
          )}>
          {selectedEmail ? (
            <>
              <div className="p-2 h-12 border-b flex justify-between items-center gap-4 shrink-0">
                 <div className="flex items-center gap-2">
                    {isMobile && (
                        <Button variant="ghost" size="icon" onClick={() => { stop(); setSelectedEmailId(null); }}>
                            <ArrowLeft />
                        </Button>
                    )}
                 </div>
                 <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleUnarchiveEmail}><ArchiveRestore className="h-4 w-4"/></Button></TooltipTrigger>
                      <TooltipContent><p>Unarchive</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleDeleteEmail}><Trash2 className="h-4 w-4"/></Button></TooltipTrigger>
                      <TooltipContent><p>Delete</p></TooltipContent>
                    </Tooltip>
                 </div>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                 <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                           {senderOfSelectedEmail && (
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={senderOfSelectedEmail.avatar} alt={senderOfSelectedEmail.name} data-ai-hint="avatar person" />
                                  <AvatarFallback>{senderOfSelectedEmail.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                          )}
                          <div className="grid gap-1">
                              <p className="font-semibold">{senderOfSelectedEmail?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                To: {currentUser?.name} &lt;{currentUser?.email}&gt;
                              </p>
                          </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(selectedEmail.sentAt), "P, p")}
                        </p>
                      </div>
                 </div>
                 <h1 className="text-xl font-bold mt-4">{selectedEmail.subject}</h1>
                <Separator className="my-4" />
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{selectedEmail.body}</div>
              </div>
            </>
          ) : (
            <div className={cn("flex items-center justify-center h-full text-muted-foreground", isMobile && "hidden")}>
              Select an email to read
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
