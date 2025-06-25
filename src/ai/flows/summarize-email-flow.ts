'use server';

/**
 * @fileOverview Generates a summary for an email.
 *
 * - summarizeEmail - A function that generates an email summary.
 * - SummarizeEmailInput - The input type for the function.
 * - SummarizeEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEmailInputSchema = z.object({
  emailBody: z.string().describe('The body of the email to summarize.'),
});
export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

const SummarizeEmailOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the email.'),
});
export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;

export async function summarizeEmail(
  input: SummarizeEmailInput
): Promise<SummarizeEmailOutput> {
  return summarizeEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEmailPrompt',
  input: {schema: SummarizeEmailInputSchema},
  output: {schema: SummarizeEmailOutputSchema},
  prompt: `You are an AI assistant that summarizes emails for a visually impaired user.
Read the following email body and provide a short, concise summary of its key points. Start the summary with "This email is about...".

Email Body:
{{{emailBody}}}

Generate a helpful summary now.`,
});

const summarizeEmailFlow = ai.defineFlow(
  {
    name: 'summarizeEmailFlow',
    inputSchema: SummarizeEmailInputSchema,
    outputSchema: SummarizeEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
