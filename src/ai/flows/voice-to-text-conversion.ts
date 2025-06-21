'use server';
/**
 * @fileOverview Converts voice to text for email composition, refining accuracy based on user habits.
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
  transcription: z.string().describe('The transcribed text of the spoken message.'),
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
  prompt: `Transcribe the following audio into text. Refine the accuracy of the transcription based on the user's speaking habits, if provided. 

Audio: {{media url=audioDataUri}}
User Speaking Habits: {{{userSpeakingHabits}}}

Transcription:`,
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
