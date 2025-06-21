"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Archive, Trash2, Loader2, PlayCircle, StopCircle, CornerUpLeft, ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { emails as allEmails, type Email } from "@/lib/data";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { generateReplySuggestions } from "@/ai/flows/reply-suggestion-flow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

export default function InboxPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [inboxEmails, setInboxEmails] = React.useState(() => allEmails.filter((email) => email.tag === 'inbox'));
  const [selectedEmailId, setSelectedEmailId] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = React.useState(false);

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

  const { isPlaying, isGenerating, play, stop } = useTextToSpeech();
  
  const handleGenerateSuggestions = React.useCallback(async (emailBody: string) => {
    if (!emailBody) return;
    setIsGeneratingSuggestions(true);
    setSuggestions([]);
    try {
      const { suggestions: generatedSuggestions } = await generateReplySuggestions({ emailBody });
      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      // Not showing a toast to avoid interrupting the user flow
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, []);

  const handlePlayEmail = React.useCallback((emailToRead?: Email) => {
    if (emailToRead) {
      if (isPlaying) {
        stop();
      }
      setSuggestions([]); // Clear previous suggestions
      // A short delay to allow any previous speech to stop gracefully
      setTimeout(() => {
        const textToRead = `Email from ${emailToRead.from.name}. Subject: ${emailToRead.subject}. Body: ${emailToRead.body}`;
        play(textToRead, () => handleGenerateSuggestions(emailToRead.body));
        setSelectedEmailId(emailToRead.id);
      }, 100)
    }
  }, [isPlaying, play, stop, handleGenerateSuggestions]);

  const handleReadList = React.useCallback(() => {
      if (isPlaying) {
          stop();
          return;
      }
      if (inboxEmails.length === 0) {
          play("Your inbox is empty.");
          return;
      }
      const emailSnippets = inboxEmails.map((email, index) => 
        `Email ${index + 1}: From ${email.from.name}, Subject: ${email.subject}.`
      ).join(' ');
      const fullText = `You have ${inboxEmails.length} emails. ${emailSnippets} To read an email, say 'read email' followed by its number.`;
      play(fullText);
  }, [inboxEmails, isPlaying, play, stop]);


  const handleArchiveEmail = React.useCallback(() => {
    if (selectedEmailId) {
      stop();
      const remainingEmails = inboxEmails.filter(e => e.id !== selectedEmailId);
      setInboxEmails(remainingEmails);
      const nextSelectedId = isMobile ? null : (remainingEmails.length > 0 ? remainingEmails[0].id : null);
      setSelectedEmailId(nextSelectedId);
      setSuggestions([]);
      play("Email archived.");
    }
  }, [selectedEmailId, inboxEmails, play, stop, isMobile]);
  
  const handleDeleteEmail = React.useCallback(() => {
    if (selectedEmailId) {
       stop();
       const remainingEmails = inboxEmails.filter(e => e.id !== selectedEmailId);
      setInboxEmails(remainingEmails);
      const nextSelectedId = isMobile ? null : (remainingEmails.length > 0 ? remainingEmails[0].id : null);
      setSelectedEmailId(nextSelectedId);
      setSuggestions([]);
       play("Email deleted.");
    }
  }, [selectedEmailId, inboxEmails, play, stop, isMobile]);

  const handleReplyEmail = React.useCallback(() => {
    if (selectedEmail) {
      stop();
      router.push(`/compose?to=${encodeURIComponent(selectedEmail.from.email)}&subject=${encodeURIComponent(`Re: ${selectedEmail.subject}`)}`);
    }
  }, [selectedEmail, router, stop]);

  const handleUseSuggestion = React.useCallback((suggestion: string) => {
    if (selectedEmail) {
      stop();
      play(`Replying with: ${suggestion}`);
      router.push(`/compose?to=${encodeURIComponent(selectedEmail.from.email)}&subject=${encodeURIComponent(`Re: ${selectedEmail.subject}`)}&body=${encodeURIComponent(suggestion)}`);
    }
  }, [selectedEmail, router, stop, play]);


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
      }
    };
    window.addEventListener('voice-command', handleCommand as EventListener);
    return () => {
      window.removeEventListener('voice-command', handleCommand as EventListener);
    };
  }, [handleReadList, handlePlayEmail, handleArchiveEmail, handleDeleteEmail, handleReplyEmail, inboxEmails, play, suggestions, handleUseSuggestion]);


  React.useEffect(() => {
    return () => {
      stop();
    }
  }, [selectedEmailId, stop]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 h-[calc(100vh-4rem-1px)]">
        <div className={cn(
            "col-span-1 xl:col-span-1 border-r bg-card h-full",
            isMobile && selectedEmailId && "hidden"
          )}>
          <ScrollArea className="h-full">
            <div className="p-4">
              <h2 className="text-2xl font-bold">Inbox</h2>
            </div>
            <Separator />
            {inboxEmails.length > 0 ? (
              <ul className="divide-y">
                {inboxEmails.map((email, index) => (
                  <li
                    key={email.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/50",
                      selectedEmailId === email.id && "bg-muted"
                    )}
                    onClick={() => { stop(); setSelectedEmailId(email.id); setSuggestions([]); }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-semibold"><span className="text-muted-foreground text-xs mr-2">{index+1}.</span>{email.from.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(email.date), {
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
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
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
                    <h3 className="text-xl font-bold">{selectedEmail.subject}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handlePlayEmail(selectedEmail)} disabled={isGenerating}>
                          {isGenerating ? <Loader2 className="animate-spin" /> : (isPlaying && selectedEmail.id === selectedEmailId) ? <StopCircle /> : <PlayCircle />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{(isPlaying && selectedEmail.id === selectedEmailId) ? 'Stop Reading' : 'Read Aloud'}</p>
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
                <div className="text-sm text-muted-foreground mt-2">
                  From: {selectedEmail.from.name} &lt;{selectedEmail.from.email}&gt;
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
