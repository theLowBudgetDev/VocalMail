
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Trash2, ArrowLeft, Users } from "lucide-react";
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
import { deleteUserEmail } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SentPageClientProps {
    initialEmails: Email[];
    users: User[];
}

export default function SentPageClient({ initialEmails, users }: SentPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { currentUser } = useCurrentUser();
  
  const [sentEmails, setSentEmails] = React.useState<Email[]>(initialEmails);
  const [selectedEmailId, setSelectedEmailId] = React.useState<number | null>(null);

  const { isPlaying, play, stop } = useTextToSpeech();
  
  const selectedEmail = React.useMemo(() => {
    return sentEmails.find((email) => email.id === selectedEmailId);
  }, [selectedEmailId, sentEmails]);

  React.useEffect(() => {
    setSentEmails(initialEmails);
  }, [initialEmails]);

  const handleReadList = React.useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }
    if (sentEmails.length === 0) {
      play("Your sent mail is empty.");
      return;
    }

    const emailSnippets = sentEmails
      .map((email, index) => {
          const recipientNames = email.recipients?.map(r => r.name).join(', ') || 'N/A';
          return `Email ${index + 1}: To ${recipientNames}, Subject: ${email.subject}.`;
      })
      .join(" ");

    const summary = `You have ${sentEmails.length} sent emails. ${emailSnippets} To read an email, say 'read email' followed by its number.`;
    play(summary);
  }, [sentEmails, isPlaying, play, stop]);
  
  React.useEffect(() => {
    const autorun = searchParams.get('autorun');
    if (autorun === 'read_list') {
        play("Navigated to Sent.", handleReadList);
        router.replace('/sent', {scroll: false});
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
        const recipientNames = emailToRead.recipients?.map(r => r.name).join(', ') || 'N/A';
        const textToRead = `Email to ${recipientNames}. Subject: ${emailToRead.subject}. Body: ${emailToRead.body}`;
        play(textToRead);
      }, 100)
    }
  }, [handleSelectEmail, play]);
  
  const handleDeleteEmail = React.useCallback(async () => {
    if (selectedEmailId && currentUser) {
       stop();
       play("Email deleted.");
       await deleteUserEmail(selectedEmailId, currentUser.id, 'sent');
       const nextEmails = sentEmails.filter(e => e.id !== selectedEmailId);
       setSentEmails(nextEmails);
       setSelectedEmailId(null);
       router.refresh();
       toast({ title: "Email Deleted" });
    }
  }, [selectedEmailId, currentUser, stop, play, router, sentEmails]);

  React.useEffect(() => {
    const handleCommand = (event: CustomEvent) => {
      if (!event.detail) return;
      const { command, emailId } = event.detail;
      switch (command) {
        case 'action_read_list':
          handleReadList();
          break;
        case 'action_read_email':
          if (emailId && emailId > 0 && emailId <= sentEmails.length) {
            handlePlayEmail(sentEmails[emailId - 1]);
          } else {
            play(`Sorry, I couldn't find email number ${emailId}.`);
          }
          break;
        case 'action_delete':
          handleDeleteEmail();
          break;
        case 'action_help':
          play("You are in your sent mail. You can say 'read the list', 'read email' followed by a number, or 'delete'.");
          break;
      }
    };
    window.addEventListener('voice-command', handleCommand as EventListener);
    return () => {
      window.removeEventListener('voice-command', handleCommand as EventListener);
    };
  }, [handleReadList, handlePlayEmail, handleDeleteEmail, sentEmails, play]);

  React.useEffect(() => {
    return () => stop();
  }, [selectedEmailId, stop]);

  const getRecipientInfo = (recipients?: {name: string, email: string}[]) => {
      if (!recipients || recipients.length === 0) return { name: 'N/A', avatar: ''};
      if (recipients.length === 1) {
          const user = users.find(u => u.email === recipients[0].email);
          return { name: recipients[0].name, avatar: user?.avatar || '' };
      }
      return { name: recipients.map(r => r.name).join(', '), avatar: ''};
  }


  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 h-full">
        <div className={cn(
            "col-span-1 xl:col-span-1 border-r bg-background flex flex-col",
            isMobile && selectedEmailId && "hidden"
          )}>
          <div className="flex items-center p-2 h-12 border-b shrink-0">
            <h2 className="text-lg font-bold px-2">Sent</h2>
          </div>
          <ScrollArea className="flex-1">
             {sentEmails.length > 0 ? (
                <div className="flex flex-col">
                    {sentEmails.map((email) => {
                        const recipientInfo = getRecipientInfo(email.recipients);
                        return (
                            <button
                              key={email.id}
                              className={cn(
                                  "w-full text-left p-4 flex gap-4 items-start border-b border-border",
                                  selectedEmailId === email.id && "bg-muted"
                              )}
                              onClick={() => handleSelectEmail(email)}
                             >
                              <Avatar className="h-10 w-10">
                                  {recipientInfo.avatar ? (
                                    <AvatarImage src={recipientInfo.avatar} alt={recipientInfo.name} data-ai-hint="avatar person" />
                                  ) : (
                                    <Users className="h-full w-full p-2 text-muted-foreground" />
                                  )}
                                  <AvatarFallback>{recipientInfo.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden grid gap-0.5">
                                  <div className="flex justify-between items-baseline">
                                      <p className={cn("font-semibold text-sm truncate text-muted-foreground")}>
                                        {recipientInfo.name}
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
                        )
                    })}
                </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">No emails in sent folder.</div>
            )}
          </ScrollArea>
        </div>
        <div className={cn(
            "md:col-span-2 xl:col-span-3 bg-background",
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
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleDeleteEmail}><Trash2 className="h-4 w-4"/></Button></TooltipTrigger>
                      <TooltipContent><p>Delete</p></TooltipContent>
                    </Tooltip>
                 </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">
                   <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name || ''} data-ai-hint="avatar person" />
                                <AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <p className="font-semibold">{currentUser?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  To: {selectedEmail.recipients?.map(r => r.name).join(', ')}
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
              </ScrollArea>
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
