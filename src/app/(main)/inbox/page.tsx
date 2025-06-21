"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Archive, Trash2, Loader2, PlayCircle, StopCircle, CornerUpLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { emails, type Email } from "@/lib/data";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card";

export default function InboxPage() {
  const [selectedEmailId, setSelectedEmailId] = React.useState<string | null>(emails.find(e => e.tag === 'inbox')?.id || null);
  const inboxEmails = emails.filter((email) => email.tag === 'inbox');

  const selectedEmail = React.useMemo(() => {
    return emails.find((email) => email.id === selectedEmailId);
  }, [selectedEmailId]);

  const { isPlaying, isGenerating, play, stop } = useTextToSpeech();

  const handlePlayEmail = (email: Email) => {
    if (isPlaying) {
      stop();
    } else {
      const textToRead = `Email from ${email.from.name}. Subject: ${email.subject}. Body: ${email.body}`;
      play(textToRead);
    }
  };

  React.useEffect(() => {
    return () => {
      stop();
    }
  }, [selectedEmailId, stop]);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 h-[calc(100vh-4rem-1px)]">
        <div className="col-span-1 xl:col-span-1 border-r bg-card h-full">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h2 className="text-2xl font-bold">Inbox</h2>
            </div>
            <Separator />
            <ul className="divide-y">
              {inboxEmails.map((email) => (
                <li
                  key={email.id}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-muted/50",
                    selectedEmailId === email.id && "bg-muted"
                  )}
                  onClick={() => setSelectedEmailId(email.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-semibold">{email.from.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(email.date), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  <div className="text-sm">{email.subject}</div>
                  <div
                    className={cn(
                      "text-xs text-muted-foreground truncate",
                      !email.read && "font-bold text-foreground"
                    )}
                  >
                    {email.body}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
        <div className="col-span-1 md:col-span-2 xl:col-span-3">
          {selectedEmail ? (
            <Card className="m-4 shadow-lg h-[calc(100%-2rem)] flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{selectedEmail.subject}</h3>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handlePlayEmail(selectedEmail)} disabled={isGenerating}>
                          {isGenerating ? <Loader2 className="animate-spin" /> : isPlaying ? <StopCircle /> : <PlayCircle />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isPlaying ? 'Stop Reading' : 'Read Aloud'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <CornerUpLeft />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reply</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Archive />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Archive</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
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
              <ScrollArea className="flex-1 p-4">
                <p className="text-base leading-relaxed whitespace-pre-wrap">{selectedEmail.body}</p>
              </ScrollArea>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select an email to read
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
