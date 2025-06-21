"use client";

import * as React from "react";
import { Mic, Square, Loader2 } from "lucide-react";

import { voiceToTextConversion } from "@/ai/flows/voice-to-text-conversion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  fieldName: string;
  large?: boolean;
}

export function VoiceRecorder({ onTranscription, fieldName, large = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleStopRecording;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to use this feature.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsTranscribing(true);

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    audioChunksRef.current = [];

    // Stop all media tracks to turn off the microphone indicator
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const { transcription } = await voiceToTextConversion({
          audioDataUri: base64Audio,
        });
        onTranscription(transcription);
      } catch (error) {
        console.error("Transcription failed:", error);
        toast({
          variant: "destructive",
          title: "Transcription Failed",
          description: "Could not convert your speech to text. Please try again.",
        });
      } finally {
        setIsTranscribing(false);
      }
    };
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const tooltipText = isRecording ? `Stop recording` : isTranscribing ? 'Transcribing...' : `Record ${fieldName}`;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'default'}
            size={large ? "icon" : "icon"}
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={cn(
              "text-white",
              large && "rounded-full w-12 h-12",
              !large && "w-10 h-10",
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-accent hover:bg-accent/90"
            )}
            aria-label={tooltipText}
          >
            {isTranscribing ? (
              <Loader2 className={cn("animate-spin", large ? "h-6 w-6" : "h-5 w-5")} />
            ) : isRecording ? (
              <Square className={cn("fill-current", large ? "h-5 w-5" : "h-4 w-4")} />
            ) : (
              <Mic className={cn(large ? "h-6 w-6" : "h-5 w-5")} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
