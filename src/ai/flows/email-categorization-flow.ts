'use server';

/**
 * @fileOverview Categorizes an email into predefined categories.
 *
 * - categorizeEmail - A function that categorizes an email.
 * - CategorizeEmailInput - The input type for the function.
 * - CategorizeEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { emailCategories } from '@/lib/data';

const validCategories = emailCategories.map(c => c.id) as [string, ...string[]];
const CategoryEnum = z.enum(validCategories);

const CategorizeEmailInputSchema = z.object({
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The body of the email.'),
});
export type CategorizeEmailInput = z.infer<typeof CategorizeEmailInputSchema>;

const CategorizeEmailOutputSchema = z.object({
  category: CategoryEnum.describe('The determined category for the email.'),
});
export type CategorizeEmailOutput = z.infer<typeof CategorizeEmailOutputSchema>;

export async function categorizeEmail(
  input: CategorizeEmailInput
): Promise<CategorizeEmailOutput> {
  return categorizeEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeEmailPrompt',
  input: {schema: CategorizeEmailInputSchema},
  output: {schema: CategorizeEmailOutputSchema},
  prompt: `You are an AI assistant that categorizes emails for a user. Based on the email's subject and body, classify it into one of the following categories:

Categories:
- urgent: Critical, time-sensitive messages needing immediate action (e.g., security alerts, final notices).
- important: High-priority messages that require a response, but are not emergencies (e.g., direct questions from colleagues, meeting requests).
- promotions: Marketing emails, sales offers, and advertisements.
- social: Notifications from social networks, forums, and online communities.
- updates: General announcements, newsletters, shipping confirmations, and non-critical updates.
- personal: Direct, informal messages from friends, family, or personal contacts.

Analyze the content below and choose the most fitting category.

Subject: {{{subject}}}
Body:
{{{body}}}

Categorize the email now.`,
});

const categorizeEmailFlow = ai.defineFlow(
  {
    name: 'categorizeEmailFlow',
    inputSchema: CategorizeEmailInputSchema,
    outputSchema: CategorizeEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
