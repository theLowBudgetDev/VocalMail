
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from 'next/image';
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";

import { Archive, Trash2, Loader2, CornerUpLeft, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCurrentUser } from "@/hooks/use-current-user";
import { markEmailAsRead, archiveEmail, deleteUserEmail } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const { isPlaying, isGenerating, play, stop } = useTextToSpeech();
  
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
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, []);
  
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
  }, [currentUser, isPlaying, stop, router]);

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
            "col-span-1 xl:col-span-1 border-r bg-card h-full flex flex-col",
            isMobile && selectedEmailId && "hidden"
          )}>
          <ScrollArea className="flex-1">
             {inboxEmails.length > 0 ? (
                <ul className="p-2 space-y-2">
                    {inboxEmails.map((email, index) => (
                        <li key={email.id}>
                           <button
                            className={cn(
                                "w-full p-3 text-left rounded-lg transition-colors flex gap-3",
                                selectedEmailId === email.id ? "bg-muted" : "hover:bg-muted/50"
                            )}
                            onClick={() => handleSelectEmail(email)}
                           >
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={getSenderAvatar(email.senderId)} alt={email.senderName} />
                                <AvatarFallback>{email.senderName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline">
                                    <p className="font-semibold truncate">{email.senderName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <p className={cn("font-medium truncate", !email.read && "text-foreground")}>{email.subject}</p>
                                <p className="text-sm text-muted-foreground truncate">{email.body}</p>
                            </div>
                           </button>
                        </li>
                    ))}
                </ul>
            ) : (
              <div className="text-center p-8 text-muted-foreground">No emails in inbox.</div>
            )}
          </ScrollArea>
        </div>
        <div className={cn(
            "md:col-span-2 xl:col-span-3 h-full",
            isMobile && !selectedEmailId ? "hidden" : "flex flex-col"
          )}>
          {selectedEmail ? (
            <>
              <div className="p-4 border-b flex justify-between items-center gap-4">
                 <div className="flex items-center gap-3">
                    {isMobile && (
                        <Button variant="ghost" size="icon" onClick={() => { stop(); setSelectedEmailId(null); setSuggestions([]); }}>
                            <ArrowLeft />
                        </Button>
                    )}
                    {senderOfSelectedEmail && (
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={senderOfSelectedEmail.avatar} alt={senderOfSelectedEmail.name} />
                            <AvatarFallback>{senderOfSelectedEmail.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className="flex-1 overflow-hidden">
                        <h3 className="text-lg font-bold truncate">{senderOfSelectedEmail?.name}</h3>
                        <p className="text-sm text-muted-foreground">To: {selectedEmail.recipients?.map(r => r.name).join(', ')}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedEmail.sentAt), "dd/MM/yyyy, hh:mm a")}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleReplyEmail}><CornerUpLeft /></Button></TooltipTrigger>
                      <TooltipContent><p>Reply</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleArchiveEmail}><Archive /></Button></TooltipTrigger>
                      <TooltipContent><p>Archive</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                      <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleDeleteEmail}><Trash2 /></Button></TooltipTrigger>
                      <TooltipContent><p>Delete</p></TooltipContent>
                    </Tooltip>
                 </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">{selectedEmail.subject}</h2>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{selectedEmail.body}</p>
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
                          className="h-auto whitespace-normal"
                        >
                          <span className="font-bold mr-2">{index + 1}.</span>{suggestion}
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
