
"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Mic, Loader2 } from "lucide-react";

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
import { playTone } from "@/lib/audio";

export function VoiceCommander() {
  const [isListening, setIsListening] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { play, stop } = useTextToSpeech();

  const isComposePage = pathname === '/compose';

  const handleCommand = React.useCallback((result: Awaited<ReturnType<typeof recognizeCommand>>) => {
    const { command, searchQuery } = result;
    if (command.startsWith('navigate_')) {
      const page = command.replace('navigate_', '');
      stop(); // Stop any ongoing speech
      router.push(`/${page}?autorun=read_list`);
    } else if (command === 'action_search_email' && searchQuery) {
      stop(); // Stop any ongoing speech
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else if (command.startsWith('action_')) {
      window.dispatchEvent(new CustomEvent('voice-command', { detail: result }));
    } else if (command !== 'unknown') {
      play("Sorry, that command isn't available on this page.");
    }
  }, [router, play, stop]);

  const stopListening = React.useCallback(async () => {
    if (!isListening || mediaRecorderRef.current?.state !== "recording") {
        return;
    }
    
    mediaRecorderRef.current.stop();
    playTone("stop");
    setIsListening(false);
  }, [isListening]);

  const startListening = React.useCallback(async () => {
    if (isListening || isProcessing) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      playTone("start");
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
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
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to use this feature.",
      });
    }
  }, [isListening, isProcessing, toast, pathname, handleCommand]);

  React.useEffect(() => {
    if (isComposePage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat && !isListening && !isProcessing) {
          event.preventDefault(); 
          startListening();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
          event.preventDefault();
          stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startListening, stopListening, isComposePage, isListening, isProcessing]);


  if (isComposePage) {
      return null;
  }
  
  const tooltipText = isListening ? "Listening... Release to process." : "Hold to talk (or press Spacebar)";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              disabled={isProcessing}
              className={cn(
                "rounded-full w-16 h-16 shadow-lg flex items-center justify-center transition-all duration-300",
                isListening ? "bg-destructive hover:bg-destructive/90 scale-110 animate-pulse" : "bg-primary hover:bg-primary/90",
                 isProcessing && "cursor-not-allowed bg-muted"
              )}
              aria-label={tooltipText}
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onMouseLeave={stopListening}
              onTouchStart={(e) => { e.preventDefault(); startListening(); }}
              onTouchEnd={stopListening}
            >
              {isProcessing ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Mic className="h-7 w-7" />
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
