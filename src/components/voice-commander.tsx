"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Mic, MicOff, Loader2 } from "lucide-react";

import { recognizeCommand } from "@/ai/flows/command-recognition";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function VoiceCommander() {
  const [isGloballyActive, setIsGloballyActive] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { play } = useTextToSpeech();

  const isComposePage = pathname === '/compose';

  const handleCommand = React.useCallback((result: Awaited<ReturnType<typeof recognizeCommand>>) => {
    const { command, emailId, searchQuery } = result;
    if (command.startsWith('navigate_')) {
      const page = command.replace('navigate_', '');
      play(`Navigating to ${page}.`);
      router.push(`/${page}`);
    } else if (command === 'action_search_email' && searchQuery) {
      play(`Searching for emails about ${searchQuery}`);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else if (command.startsWith('action_')) {
      window.dispatchEvent(new CustomEvent('voice-command', { detail: result }));
    } else if (command !== 'unknown') {
      play("Sorry, I can't do that on this page.");
    } else {
      toast({
        variant: "default",
        title: "Command not recognized",
        description: "Please try a different voice command.",
      });
    }
  }, [router, toast, play]);

  const handleStopListening = React.useCallback(async () => {
    setIsListening(false);
    setIsProcessing(true);

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    audioChunksRef.current = [];

    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (audioBlob.size < 100) {
      setIsProcessing(false);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await recognizeCommand({
          audioDataUri: base64Audio,
          currentPath: pathname,
        });
        handleCommand(result);
      } catch (error) {
        console.error("Command recognition failed:", error);
        toast({
          variant: "destructive",
          title: "Command Failed",
          description: "Could not understand your command. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    };
  }, [pathname, handleCommand, toast]);

  const stopListening = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startListening = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleStopListening;
      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to use this feature.",
      });
      setIsGloballyActive(false);
    }
  }, [handleStopListening, toast]);

  React.useEffect(() => {
    if (isComposePage && isGloballyActive) {
      setIsGloballyActive(false);
      if (isListening) {
        stopListening();
        setIsListening(false);
        setIsProcessing(false);
      }
    }
  }, [pathname, isComposePage, isGloballyActive, isListening, stopListening]);


  React.useEffect(() => {
    if (isGloballyActive && !isListening && !isProcessing) {
      const listenTimeout = setTimeout(() => {
        startListening();
      }, 300); // Small delay to prevent immediate re-listening after processing
      return () => clearTimeout(listenTimeout);
    }
  }, [isGloballyActive, isListening, isProcessing, startListening]);

  const toggleGlobalListening = () => {
    if (isComposePage) {
      play("Voice commands are managed by the page here.");
      return;
    }
    setIsGloballyActive(prev => {
      const nextState = !prev;
      if (!nextState && isListening) {
        stopListening();
        setIsListening(false);
        setIsProcessing(false);
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
      return nextState;
    });
  };

  const tooltipText = isGloballyActive ? "Voice commands enabled. Listening..." : "Voice commands disabled";

  if (isComposePage) {
      return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isGloballyActive ? "default" : "secondary"}
              onClick={toggleGlobalListening}
              className={cn(
                "rounded-full w-16 h-16 shadow-lg flex items-center justify-center transition-all duration-300",
                isGloballyActive && "bg-primary text-primary-foreground scale-110",
                isListening && "animate-pulse"
              )}
              aria-label={tooltipText}
            >
              {isProcessing ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : isGloballyActive ? (
                 <Mic className="h-7 w-7" />
              ) : (
                <MicOff className="h-7 w-7" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
