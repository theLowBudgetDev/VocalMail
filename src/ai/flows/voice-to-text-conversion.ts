'use server';
/**
 * @fileOverview Converts voice to text for email composition, with intelligent transcription and refinement.
 *
 * - voiceToTextConversion - A function that handles the voice to text conversion process.
 * - VoiceToTextConversionInput - The input type for the voiceToTextConversion function.
 * - VoiceToTextConversionOutput - The return type for the voiceToTextConversion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceToTextConversionInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI of the spoken message, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userSpeakingHabits: z
    .string()
    .optional()
    .describe('Description of the user speaking habits for improved accuracy.'),
});

export type VoiceToTextConversionInput = z.infer<
  typeof VoiceToTextConversionInputSchema
>;

const VoiceToTextConversionOutputSchema = z.object({
  transcription: z.string().describe('The cleaned and transcribed text of the spoken message.'),
});

export type VoiceToTextConversionOutput = z.infer<
  typeof VoiceToTextConversionOutputSchema
>;

export async function voiceToTextConversion(
  input: VoiceToTextConversionInput
): Promise<VoiceToTextConversionOutput> {
  return voiceToTextConversionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceToTextConversionPrompt',
  input: {schema: VoiceToTextConversionInputSchema},
  output: {schema: VoiceToTextConversionOutputSchema},
  prompt: `You are an AI assistant that transcribes and refines dictated text for an email. Your task is to convert the user's spoken words into a clean, well-formatted email body.

Instructions:
1. Accurately transcribe the primary message.
2. Remove any filler words (e.g., "um", "uh", "like", "you know").
3. Correct grammatical errors and improve sentence structure for clarity and professionalism.
4. Do not include any introductory or concluding remarks from yourself; output only the final, clean transcription.

Audio for Transcription: {{media url=audioDataUri}}
{{#if userSpeakingHabits}}
User Speaking Habits for context: {{{userSpeakingHabits}}}
{{/if}}

Cleaned Transcription:`,
});

const voiceToTextConversionFlow = ai.defineFlow(
  {
    name: 'voiceToTextConversionFlow',
    inputSchema: VoiceToTextConversionInputSchema,
    outputSchema: VoiceToTextConversionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
