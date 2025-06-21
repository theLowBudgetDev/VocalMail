'use server';

/**
 * @fileOverview Generates contextual reply suggestions for an email.
 *
 * - generateReplySuggestions - A function that generates reply suggestions.
 * - GenerateReplySuggestionsInput - The input type for the function.
 * - GenerateReplySuggestionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReplySuggestionsInputSchema = z.object({
  emailBody: z.string().describe('The body of the email to generate suggestions for.'),
});
export type GenerateReplySuggestionsInput = z.infer<typeof GenerateReplySuggestionsInputSchema>;

const GenerateReplySuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of 3 concise reply suggestions.'),
});
export type GenerateReplySuggestionsOutput = z.infer<typeof GenerateReplySuggestionsOutputSchema>;

export async function generateReplySuggestions(
  input: GenerateReplySuggestionsInput
): Promise<GenerateReplySuggestionsOutput> {
  return replySuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'replySuggestionPrompt',
  input: {schema: GenerateReplySuggestionsInputSchema},
  output: {schema: GenerateReplySuggestionsOutputSchema},
  prompt: `You are an AI assistant helping a user reply to an email. Based on the following email body, generate 3 concise and relevant reply suggestions.
The suggestions should be short, helpful, and appropriate for an email response.

Email Body:
{{{emailBody}}}

Generate 3 suggestions now.`,
});

const replySuggestionFlow = ai.defineFlow(
  {
    name: 'replySuggestionFlow',
    inputSchema: GenerateReplySuggestionsInputSchema,
    outputSchema: GenerateReplySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
