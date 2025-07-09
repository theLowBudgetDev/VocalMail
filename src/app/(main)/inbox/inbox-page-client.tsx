
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";

import { Archive, Trash2, Loader2, Reply, ReplyAll, Forward, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Email, User } from "@/lib/data";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { generateReplySuggestions } from "@/ai/flows/reply-suggestion-flow";
import { summarizeEmail } from "@/ai/flows/summarize-email-flow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { markEmailAsRead, archiveEmail, deleteUserEmail } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface InboxPageClientProps {
    initialEmails: Email[];
    users: User[];
}

export default function InboxPageClient({ initialEmails, users }: InboxPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { currentUser } = useCurrentUser();
  
  const [inboxEmails, setInboxEmails] = React.useState<Email[]>(initialEmails);
  const [selectedEmailId, setSelectedEmailId] = React.useState<number | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = React.useState(false);
  const [isSummarizing, setIsSummarizing] = React.useState(false);

  const { isPlaying, play, stop } = useTextToSpeech();
  
  const selectedEmail = React.useMemo(() => {
    return inboxEmails.find((email) => email.id === selectedEmailId);
  }, [selectedEmailId, inboxEmails]);

  const senderOfSelectedEmail = React.useMemo(() => {
    if (!selectedEmail) return null;
    return users.find(u => u.id === selectedEmail.senderId);
  }, [selectedEmail, users]);

  React.useEffect(() => {
    setInboxEmails(initialEmails);
  }, [initialEmails]);

  const handleReadList = React.useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }
    if (inboxEmails.length === 0) {
      play("Your inbox is empty.");
      return;
    }

    const unreadCount = inboxEmails.filter((e) => !e.read).length;
    let summary = "";

    if (unreadCount > 0) {
      summary += `You have ${unreadCount} unread email${
        unreadCount === 1 ? "" : "s"
      }. `;
    }

    summary += `You have a total of ${inboxEmails.length} email${
      inboxEmails.length === 1 ? "" : "s"
    } in your inbox. `;

    const emailSnippets = inboxEmails
      .map(
        (email, index) =>
          `Email ${index + 1}: From ${email.senderName}, Subject: ${
            email.subject
          }.`
      )
      .join(" ");

    summary += `${emailSnippets} To read an email, say 'read email' followed by its number.`;
    play(summary);
  }, [inboxEmails, isPlaying, play, stop]);
  
  React.useEffect(() => {
    const autorun = searchParams.get('autorun');
    if (autorun === 'read_list') {
        play("Navigated to Inbox.", handleReadList);
        router.replace('/inbox', {scroll: false});
    }
  }, [searchParams, play, handleReadList, router]);


  React.useEffect(() => {
    if (isMobile === undefined) return;

    if (isMobile) {
      setSelectedEmailId(null);
    } else {
      if (!selectedEmailId && inboxEmails.length > 0) {
        setSelectedEmailId(inboxEmails[0].id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, inboxEmails]);
  
  const handleGenerateSuggestions = React.useCallback(async (emailBody: string) => {
    if (!emailBody) return;
    setIsGeneratingSuggestions(true);
    setSuggestions([]);
    try {
      const { suggestions: generatedSuggestions } = await generateReplySuggestions({ emailBody });
      setSuggestions(generatedSuggestions);
      if (generatedSuggestions && generatedSuggestions.length > 0) {
        const suggestionText = generatedSuggestions.map((s, i) => `Suggestion ${i + 1}: ${s}`).join('. ');
        const fullText = `Here are some suggested replies. ${suggestionText}. To use one, say 'use suggestion' and the number.`;
        play(fullText);
      }
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      toast({ variant: 'destructive', title: 'Could not generate suggestions.'});
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [play, toast]);
  
  const handleSummarizeEmail = React.useCallback(async () => {
    if (selectedEmail) {
      stop();
      setIsSummarizing(true);
      play("Summarizing... one moment.");
      try {
        const { summary } = await summarizeEmail({ emailBody: selectedEmail.body });
        play(summary);
      } catch (error) {
        console.error("Failed to summarize email:", error);
        play("Sorry, I was unable to summarize this email.");
      } finally {
        setIsSummarizing(false);
      }
    }
  }, [selectedEmail, play, stop]);

  const handleSelectEmail = React.useCallback(async (email: Email) => {
    if (isPlaying) {
        stop();
    }
    setSelectedEmailId(email.id); 
    setSuggestions([]);
    if (!email.read && currentUser) {
        try {
            await markEmailAsRead(email.id, currentUser.id);
            setInboxEmails(prev => prev.map(e => e.id === email.id ? {...e, read: true} : e));
            router.refresh(); 
        } catch (e) {
            console.error(e);
             toast({ variant: 'destructive', title: 'Failed to mark as read.' });
        }
    }
  }, [currentUser, isPlaying, stop, router, toast]);

  const handlePlayEmail = React.useCallback((emailToRead?: Email) => {
    if (emailToRead) {
      handleSelectEmail(emailToRead);
      setTimeout(() => {
        const textToRead = `Email from ${emailToRead.senderName}. Subject: ${emailToRead.subject}. Body: ${emailToRead.body}`;
        play(textToRead, () => handleGenerateSuggestions(emailToRead.body));
      }, 100)
    }
  }, [handleSelectEmail, play, handleGenerateSuggestions]);

  const handleArchiveEmail = React.useCallback(async () => {
    if (selectedEmailId && currentUser) {
      stop();
      play("Email archived.");
      await archiveEmail(selectedEmailId, currentUser.id);
      const nextEmails = inboxEmails.filter(e => e.id !== selectedEmailId);
      const nextSelectedId = isMobile ? null : (nextEmails.length > 0 ? nextEmails[0].id : null);
      setInboxEmails(nextEmails);
      setSelectedEmailId(nextSelectedId || null);
      setSuggestions([]);
      router.refresh();
    }
  }, [selectedEmailId, currentUser, stop, play, router, isMobile, inboxEmails]);
  
  const handleDeleteEmail = React.useCallback(async () => {
    if (selectedEmailId && currentUser) {
       stop();
       play("Email deleted.");
       await deleteUserEmail(selectedEmailId, currentUser.id, 'inbox');
       const nextEmails = inboxEmails.filter(e => e.id !== selectedEmailId);
       const nextSelectedId = isMobile ? null : (nextEmails.length > 0 ? nextEmails[0].id : null);
       setInboxEmails(nextEmails);
       setSelectedEmailId(nextSelectedId || null);
       setSuggestions([]);
       router.refresh();
    }
  }, [selectedEmailId, currentUser, stop, play, router, isMobile, inboxEmails]);

  const handleReplyEmail = React.useCallback(() => {
    if (selectedEmail) {
      stop();
      router.push(`/compose?to=${encodeURIComponent(selectedEmail.senderEmail)}&subject=${encodeURIComponent(`Re: ${selectedEmail.subject}`)}`);
    }
  }, [selectedEmail, router, stop]);

  const handleUseSuggestion = React.useCallback((suggestion: string) => {
    if (selectedEmail) {
      stop();
      router.push(`/compose?to=${encodeURIComponent(selectedEmail.senderEmail)}&subject=${encodeURIComponent(`Re: ${selectedEmail.subject}`)}&body=${encodeURIComponent(suggestion)}`);
    }
  }, [selectedEmail, router, stop]);

  React.useEffect(() => {
    const handleCommand = (event: CustomEvent) => {
      if (!event.detail) return;
      const { command, emailId, suggestionId } = event.detail;
      switch (command) {
        case 'action_read_list':
          handleReadList();
          break;
        case 'action_read_email':
          if (emailId && emailId > 0 && emailId <= inboxEmails.length) {
            handlePlayEmail(inboxEmails[emailId - 1]);
          } else {
            play(`Sorry, I couldn't find email number ${emailId}.`);
          }
          break;
        case 'action_summarize_email':
          handleSummarizeEmail();
          break;
        case 'action_archive':
          handleArchiveEmail();
          break;
        case 'action_delete':
          handleDeleteEmail();
          break;
        case 'action_reply':
          handleReplyEmail();
          break;
        case 'action_use_suggestion':
          if (suggestionId && suggestionId > 0 && suggestionId <= suggestions.length) {
            handleUseSuggestion(suggestions[suggestionId - 1]);
          } else if (suggestions.length > 0) {
            play(`Sorry, I couldn't find suggestion number ${suggestionId}. Please say a number between 1 and ${suggestions.length}.`);
          }
          break;
        case 'action_help':
          play("You are in your inbox. You can say 'read the list', 'read email' followed by a number, 'summarize email', or use navigation commands like 'go to compose'.");
          break;
      }
    };
    window.addEventListener('voice-command', handleCommand as EventListener);
    return () => {
      window.removeEventListener('voice-command', handleCommand as EventListener);
    };
  }, [handleReadList, handlePlayEmail, handleArchiveEmail, handleDeleteEmail, handleReplyEmail, inboxEmails, play, suggestions, handleUseSuggestion, handleSummarizeEmail]);

  React.useEffect(() => {
    return () => stop();
  }, [selectedEmailId, stop]);

  const getSenderAvatar = (senderId: number) => {
      const sender = users.find(u => u.id === senderId);
      return sender?.avatar || '';
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 h-full">
        <div className={cn(
            "col-span-1 xl:col-span-1 border-r bg-background h-full flex flex-col",
            isMobile && selectedEmailId && "hidden"
          )}>
          <ScrollArea className="flex-1">
             {inboxEmails.length > 0 ? (
                <div className="flex flex-col">
                    {inboxEmails.map((email) => (
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
                                  <p className={cn("font-semibold text-sm truncate", !email.read ? "text-foreground" : "text-muted-foreground")}>
                                    {email.senderName}
                                  </p>
                                  <p className={cn("text-xs shrink-0", !email.read ? "text-foreground" : "text-muted-foreground")}>
                                      {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
                                  </p>
                              </div>
                              <p className={cn("font-semibold text-sm truncate", !email.read ? "text-foreground" : "text-muted-foreground")}>
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
              <div className="text-center p-8 text-muted-foreground">No emails in inbox.</div>
            )}
          </ScrollArea>
        </div>
        <div className={cn(
            "md:col-span-2 xl:col-span-3 h-full bg-background",
            isMobile && !selectedEmailId ? "hidden" : "flex flex-col"
          )}>
          {selectedEmail ? (
            <>
              <div className="p-2 border-b flex justify-between items-center gap-4">
                 <div className="flex items-center gap-2">
                    {isMobile && (
                        <Button variant="ghost" size="icon" onClick={() => { stop(); setSelectedEmailId(null); setSuggestions([]); }}>
                            <ArrowLeft />
                        </Button>
                    )}
                    <div className="flex items-center gap-1 border-r pr-2">
                        <Tooltip>
                          <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleReplyEmail}><Reply className="h-4 w-4"/></Button></TooltipTrigger>
                          <TooltipContent><p>Reply</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                          <TooltipTrigger asChild><Button variant="ghost" size="icon"><ReplyAll className="h-4 w-4"/></Button></TooltipTrigger>
                          <TooltipContent><p>Reply All</p></TooltipContent>
                        </Tooltip>
                         <Tooltip>
                          <TooltipTrigger asChild><Button variant="ghost" size="icon"><Forward className="h-4 w-4"/></Button></TooltipTrigger>
                          <TooltipContent><p>Forward</p></TooltipContent>
                        </Tooltip>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleArchiveEmail}><Archive className="h-4 w-4" /></Button></TooltipTrigger>
                      <TooltipContent><p>Archive</p></TooltipContent>
                    </Tooltip>
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
                             {senderOfSelectedEmail && (
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={senderOfSelectedEmail.avatar} alt={senderOfSelectedEmail.name} data-ai-hint="avatar person" />
                                    <AvatarFallback>{senderOfSelectedEmail.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="grid gap-1">
                                <p className="font-semibold">{senderOfSelectedEmail?.name}</p>
                                <p className="text-sm font-medium">{selectedEmail.subject}</p>
                                <p className="text-xs text-muted-foreground">
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
                  <Separator className="my-4" />
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{selectedEmail.body}</div>
                </div>
              </ScrollArea>
               {(isGeneratingSuggestions || suggestions.length > 0) && (
                <div className="p-4 border-t">
                  <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Smart Replies</h4>
                  {isGeneratingSuggestions ? (
                     <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Generating replies...</span>
                      </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, index) => (
                        <Button 
                          key={index} 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUseSuggestion(suggestion)}
                          className="h-auto whitespace-normal text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
