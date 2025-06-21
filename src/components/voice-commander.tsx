"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Mic, MicOff, Loader2 } from "lucide-react";

import { recognizeCommand } from "@/ai/flows/command-recognition";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

  const handleCommand = React.useCallback((command: string) => {
    if (command.startsWith('navigate_')) {
      const page = command.replace('navigate_', '');
      router.push(`/${page}`);
    } else if (command.startsWith('action_')) {
      window.dispatchEvent(new CustomEvent('voice-command', { detail: { command } }));
    } else {
      toast({
        variant: "default",
        title: "Command not recognized",
        description: "Please try a different voice command.",
      });
    }
  }, [router, toast]);

  const handleStopListening = React.useCallback(async () => {
    setIsListening(false);
    setIsProcessing(true);

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    audioChunksRef.current = [];

    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const { command } = await recognizeCommand({
          audioDataUri: base64Audio,
          currentPath: pathname,
        });
        handleCommand(command);
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
      mediaRecorderRef.current = new MediaRecorder(stream);
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
    let silenceTimeout: NodeJS.Timeout;

    if (isGloballyActive && !isListening && !isProcessing) {
      startListening();
    }
    
    if (isListening) {
      silenceTimeout = setTimeout(() => {
        if(isListening) stopListening();
      }, 5000); // Stop recording after 5 seconds
    }

    return () => {
      clearTimeout(silenceTimeout);
    };
  }, [isGloballyActive, isListening, isProcessing, startListening, stopListening]);

  const toggleGlobalListening = () => {
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

  const tooltipText = isGloballyActive ? "Voice commands enabled" : "Voice commands disabled";

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
                "rounded-full w-16 h-16 shadow-lg flex items-center justify-center",
                isGloballyActive && "bg-primary text-primary-foreground",
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
