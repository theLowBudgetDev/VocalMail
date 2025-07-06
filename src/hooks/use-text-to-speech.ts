
"use client";

import { useState, useRef, useCallback } from "react";
import { textToSpeechConversion } from "@/ai/flows/text-to-voice-conversion";
import { useToast } from "@/hooks/use-toast";

const audioCache = new Map<string, string>();

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const play = useCallback(async (text: string, onEnd?: () => void) => {
    if (isGenerating || !text.trim()) {
      onEnd?.();
      return;
    };

    const playAudio = (src: string) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      const newAudio = new Audio(src);
      audioRef.current = newAudio;
      
      newAudio.play().catch(e => {
        console.error("Audio play failed", e)
        toast({
          variant: "destructive",
          title: "Audio Playback Failed",
          description: "The browser prevented audio from playing automatically. Please interact with the page and try again.",
        });
        setIsPlaying(false);
        onEnd?.();
      });
      newAudio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
        onEnd?.();
      };
      newAudio.onerror = () => {
        console.error("Error playing audio: The audio source might be invalid or corrupted.");
         toast({
          variant: "destructive",
          title: "Audio Playback Error",
          description: "Could not play the generated voice. Please try again.",
        });
        setIsPlaying(false);
        audioRef.current = null;
        onEnd?.();
      }
    }

    const trimmedText = text.trim();
    if (audioCache.has(trimmedText)) {
      setIsPlaying(true);
      playAudio(audioCache.get(trimmedText)!);
      return;
    }

    setIsGenerating(true);
    setIsPlaying(true);
    try {
      const result = await textToSpeechConversion({ text: trimmedText });
      if (!result?.media) {
        throw new Error("TTS API did not return valid media data.");
      }
      const { media } = result;
      
      audioCache.set(trimmedText, media);
      
      playAudio(media);

    } catch (error: any) {
      console.error("Text-to-speech conversion failed:", error);
      if (error.message && error.message.includes("429")) {
        toast({
          variant: "destructive",
          title: "Voice Generation Limit Reached",
          description: "You've exceeded the daily quota for voice generation. Please try again later.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Voice Generation Failed",
          description: "Could not generate audio for the requested text.",
        });
      }
      setIsPlaying(false);
      onEnd?.();
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, toast]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return { isPlaying, isGenerating, play, stop };
};
