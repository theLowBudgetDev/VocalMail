
// text-to-voice-conversion.ts
'use server';

/**
 * @fileOverview Converts text to speech using Genkit with voice personalization and database caching.
 *
 * - textToSpeechConversion - A function that converts text to speech.
 * - TextToSpeechInput - The input type for the textToSpeechConversion function.
 * - TextToSpeechOutput - The return type for the textToSpeechConversion function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  media: z.string().describe('The audio data in WAV format as a data URI.'),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeechConversion(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}


const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    const trimmedText = input.text.trim();

    // 1. Check cache first
    try {
        const cachedAudio = await prisma.audioCache.findUnique({
            where: { text: trimmedText },
        });

        if (cachedAudio) {
            return { media: cachedAudio.audioDataUri };
        }
    } catch (e) {
        console.error("Audio cache lookup failed, proceeding to generate.", e);
    }
    

    // 2. If not in cache, generate new audio
    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: trimmedText,
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    if (audioBuffer.length === 0) {
        throw new Error('TTS returned empty audio data.');
    }
    
    const wavBase64 = await toWav(audioBuffer);
    const audioDataUri = 'data:audio/wav;base64,' + wavBase64;

    // 3. Save the newly generated audio to the cache
    try {
        await prisma.audioCache.create({
            data: {
                text: trimmedText,
                audioDataUri: audioDataUri,
            },
        });
    } catch (e) {
        // This can fail if another process generated and cached the audio in parallel.
        // It's safe to ignore this error.
        console.error("Audio cache write failed (likely due to a race condition), ignoring.", e);
    }

    return { media: audioDataUri };
  }
);
