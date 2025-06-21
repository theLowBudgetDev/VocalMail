"use client";

import { useState, useRef, useCallback } from "react";
import { textToSpeechConversion } from "@/ai/flows/text-to-voice-conversion";

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (text: string) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setIsPlaying(true);
    try {
      const { media } = await textToSpeechConversion({ text });
      setAudioSrc(media);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const newAudio = new Audio(media);
      audioRef.current = newAudio;
      
      newAudio.play().catch(e => console.error("Audio play failed", e));
      newAudio.onended = () => {
        setIsPlaying(false);
        setAudioSrc(null);
        audioRef.current = null;
      };

    } catch (error) {
      console.error("Text-to-speech conversion failed:", error);
      setIsPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setAudioSrc(null);
      audioRef.current = null;
    }
  }, []);

  return { isPlaying, isGenerating, audioSrc, play, stop };
};
