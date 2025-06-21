"use client";

import { useState, useRef, useCallback } from "react";
import { textToSpeechConversion } from "@/ai/flows/text-to-voice-conversion";

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (text: string, onEnd?: () => void) => {
    if (isGenerating || !text) {
      onEnd?.();
      return;
    };

    setIsGenerating(true);
    setIsPlaying(true);
    try {
      const { media } = await textToSpeechConversion({ text });
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      const newAudio = new Audio(media);
      audioRef.current = newAudio;
      
      newAudio.play().catch(e => {
        console.error("Audio play failed", e)
        setIsPlaying(false);
        onEnd?.();
      });
      newAudio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
        onEnd?.();
      };
      newAudio.onerror = () => {
        console.error("Error playing audio");
        setIsPlaying(false);
        audioRef.current = null;
        onEnd?.();
      }

    } catch (error) {
      console.error("Text-to-speech conversion failed:", error);
      setIsPlaying(false);
      onEnd?.();
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating]);

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
