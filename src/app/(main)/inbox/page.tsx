
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Archive, Trash2, Loader2, PlayCircle, StopCircle, CornerUpLeft, ArrowLeft, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Email } from "@/lib/data";
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
import { getInboxEmails, markEmailAsRead, archiveEmail, deleteUserEmail } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { currentUser } = useCurrentUser();
  
  const [inboxEmails, setInboxEmails] = React.useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = React.useState<number | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = React.useState(false);
  const [isSummarizing, setIsSummarizing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const { isPlaying, isGenerating, play, stop } = useTextToSpeech();

  const fetchEmails = React.useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
        const emails = await getInboxEmails(currentUser.id);
        setInboxEmails(emails);
    } catch(e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Failed to load inbox.' });
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
    if (autorun === 'read_list' && !isLoading) {
        play("Navigated to Inbox.", handleReadList);
        router.replace('/inbox', {scroll: false});
    }
  }, [searchParams, play, handleReadList, router, isLoading]);


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

  const selectedEmail = React.useMemo(() => {
    return inboxEmails.find((email) => email.id === selectedEmailId);
  }, [selectedEmailId, inboxEmails]);
  
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
            // Optimistically update the UI
            setInboxEmails(prev => prev.map(e => e.id === email.id ? {...e, read: true} : e));
        } catch (e) {
            console.error(e); //
        }
    }
  }, [currentUser, isPlaying, stop]);

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
      fetchEmails();
      const nextSelectedId = isMobile ? null : (inboxEmails.length > 1 ? inboxEmails.find(e => e.id !== selectedEmailId)?.id : null);
      setSelectedEmailId(nextSelectedId || null);
      setSuggestions([]);
    }
  }, [selectedEmailId, currentUser, stop, play, fetchEmails, isMobile, inboxEmails]);
  
  const handleDeleteEmail = React.useCallback(async () => {
    if (selectedEmailId && currentUser) {
       stop();
       play("Email deleted.");
       await deleteUserEmail(selectedEmailId, currentUser.id, 'inbox');
       fetchEmails();
       const nextSelectedId = isMobile ? null : (inboxEmails.length > 1 ? inboxEmails.find(e => e.id !== selectedEmailId)?.id : null);
       setSelectedEmailId(nextSelectedId || null);
       setSuggestions([]);
    }
  }, [selectedEmailId, currentUser, stop, play, fetchEmails, isMobile, inboxEmails]);

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
    return () => {
      stop();
    }
  }, [selectedEmailId, stop]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 h-[calc(100vh-4rem-1px)]">
        <div className={cn(
            "col-span-1 xl:col-span-1 border-r bg-card h-full flex flex-col",
            isMobile && selectedEmailId && "hidden"
          )}>
          <div className="p-4">
            <h2 className="text-2xl font-bold">Inbox</h2>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : inboxEmails.length > 0 ? (
                <ul className="divide-y p-2">
                    {inboxEmails.map((email, index) => (
                        <li
                            key={email.id}
                            className={cn(
                            "p-4 cursor-pointer hover:bg-muted/50 rounded-lg",
                            selectedEmailId === email.id && "bg-muted"
                            )}
                            onClick={() => handleSelectEmail(email)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="font-semibold"><span className="text-muted-foreground text-xs mr-2">{index + 1}.</span>{email.senderName}</div>
                                <div className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(email.sentAt), {
                                    addSuffix: true,
                                    })}
                                </div>
                            </div>
                            <div className="text-sm">{email.subject}</div>
                            <div
                                className={cn(
                                    "text-xs text-muted-foreground line-clamp-2",
                                    !email.read && "font-bold text-foreground"
                                )}
                            >
                            {email.body}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
              <div className="text-center p-8 text-muted-foreground">No emails in inbox.</div>
            )}
          </ScrollArea>
        </div>
        <div className={cn(
            "md:col-span-2 xl:col-span-3",
            isMobile && !selectedEmailId ? "hidden" : "block"
          )}>
          {selectedEmail ? (
            <Card className="m-0 md:m-4 shadow-none md:shadow-lg h-full md:h-[calc(100%-2rem)] flex flex-col">
              <div className="p-4 border-b flex flex-col gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        {isMobile && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => { stop(); setSelectedEmailId(null); setSuggestions([]); }}>
                                <ArrowLeft />
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent>Back to Inbox</TooltipContent>
                        </Tooltip>
                        )}
                        <h3 className="text-xl font-bold line-clamp-1">{selectedEmail.subject}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                        From: {selectedEmail.senderName} &lt;{selectedEmail.senderEmail}&gt;
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap px-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handlePlayEmail(selectedEmail)} disabled={isGenerating || isSummarizing}>
                          {isGenerating ? <Loader2 className="animate-spin" /> : (isPlaying && selectedEmail.id === selectedEmailId) ? <StopCircle /> : <PlayCircle />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{(isPlaying && selectedEmail.id === selectedEmailId) ? 'Stop Reading' : 'Read Aloud'}</p>
                      </TooltipContent>
                    </Tooltip>
                     <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleSummarizeEmail} disabled={isSummarizing || isPlaying}>
                          {isSummarizing ? <Loader2 className="animate-spin" /> : <FileText />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Summarize</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleReplyEmail}>
                          <CornerUpLeft />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reply</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleArchiveEmail}>
                          <Archive />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Archive</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleDeleteEmail}>
                          <Trash2 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4">
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
            </Card>
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
