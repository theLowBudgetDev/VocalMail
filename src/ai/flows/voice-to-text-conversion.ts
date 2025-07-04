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
    ).optional(),
  transcription: z.string().optional().describe("A raw transcription to be cleaned."),
  userSpeakingHabits: z
    .string()
    .optional()
    .describe('Description of the user speaking habits for improved accuracy.'),
  context: z.enum(['to', 'subject', 'body']).describe('The context of the dictation, e.g., the form field being filled.'),
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
  prompt: `You are an AI assistant that transcribes dictated text for an email. Your task is to convert the user's spoken words into a clean, well-formatted string based on the context.

Context: {{{context}}}
{{#if audioDataUri}}
Audio for Transcription: {{media url=audioDataUri}}
{{/if}}
{{#if transcription}}
Text for Cleaning: {{{transcription}}}
{{/if}}
{{#if userSpeakingHabits}}
User Speaking Habits for context: {{{userSpeakingHabits}}}
{{/if}}

Instructions:
1. Accurately transcribe the primary message.
2. Ignore any background noise, side conversations, or non-verbal sounds.
3. Remove filler words (e.g., "um", "uh", "like").
4. Based on the context, format the output:
   - If context is 'to': The output must be a single, valid email address. Convert words like "at" and "dot" to their respective symbols (@ and .). Remove all other words and spaces. For example, "John Doe at example dot com" should become "johndoe@example.com". "test at test dot com" should become "test@test.com".
   - If context is 'subject': The output should be a single line of text. Use title case capitalization where appropriate.
   - If context is 'body': Correct grammatical errors and improve sentence structure for clarity. The output can be multi-paragraph.
5. Do not include any introductory or concluding remarks from yourself; output only the final, clean transcription.

Cleaned Transcription:`,
});

const voiceToTextConversionFlow = ai.defineFlow(
  {
    name: 'voiceToTextConversionFlow',
    inputSchema: VoiceToTextConversionInputSchema,
    outputSchema: VoiceToTextConversionOutputSchema,
  },
  async input => {
    if (!input.audioDataUri && !input.transcription) {
      throw new Error("Either audioDataUri or transcription must be provided.");
    }
    const {output} = await prompt(input);
    return output!;
  }
);
