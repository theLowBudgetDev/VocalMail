
'use server';

/**
 * @fileOverview An intelligent email search agent that understands natural language.
 *
 * - searchEmailsWithAi - A function that handles the natural language search process.
 * - SearchEmailsWithAiInput - The input type for the searchEmailsWithAi function.
 * - SearchEmailsWithAiOutput - The return type for the searchEmailsWithAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchEmails as dbSearchEmails } from '@/lib/actions';
import type { Email } from '@/lib/data';

// Tool to search emails in the database
const searchEmailsTool = ai.defineTool(
  {
    name: 'searchEmailsTool',
    description: 'Searches for emails in the user\'s mailbox based on a query.',
    inputSchema: z.object({
      userId: z.number().describe('The ID of the user performing the search.'),
      searchTerm: z.string().describe('The search query or keywords.'),
    }),
    outputSchema: z.array(z.any()).describe('An array of found emails.'),
  },
  async ({ userId, searchTerm }) => {
    // Note: The AI might pass a very specific query. The dbSearchEmails function
    // is a full-text search, so this should work well.
    const emails = await dbSearchEmails(userId, searchTerm);
    return emails;
  }
);

// Define the input schema for our main flow
const SearchEmailsWithAiInputSchema = z.object({
  userId: z.number().describe('The ID of the user initiating the search.'),
  naturalLanguageQuery: z.string().describe('The user\'s search query in plain English.'),
});
export type SearchEmailsWithAiInput = z.infer<typeof SearchEmailsWithAiInputSchema>;

// Define the output schema for our main flow
const SearchEmailsWithAiOutputSchema = z.object({
  results: z.array(z.any()).describe('An array of email objects that match the search criteria.'),
});
export type SearchEmailsWithAiOutput = z.infer<typeof SearchEmailsWithAiOutputSchema>;


// The main exported function that the UI will call
export async function searchEmailsWithAi(input: SearchEmailsWithAiInput): Promise<SearchEmailsWithAiOutput> {
  return searchEmailFlow(input);
}

// The Genkit Flow that orchestrates the search
const searchEmailFlow = ai.defineFlow(
  {
    name: 'searchEmailFlow',
    inputSchema: SearchEmailsWithAiInputSchema,
    outputSchema: SearchEmailsWithAiOutputSchema,
  },
  async ({ userId, naturalLanguageQuery }) => {
    const llmResponse = await ai.generate({
      prompt: `You are an intelligent email search assistant. Your goal is to help a user find emails based on their natural language query.
      Use the provided 'searchEmailsTool' to find the relevant emails.
      Analyze the user's query and formulate the best possible 'searchTerm' for the tool.
      For example, if the user asks for "emails from Alice about the project budget from last week", a good searchTerm might be "Alice project budget".
      
      User's Query: "${naturalLanguageQuery}"
      
      Now, use the search tool to find the emails for user ID ${userId}.`,
      tools: [searchEmailsTool],
      model: 'googleai/gemini-2.0-flash',
    });

    // The tool output will be in the llmResponse.
    // We find the output from the tool call and return it.
    const toolOutput = llmResponse.toolOutput<z.infer<typeof searchEmailsTool.outputSchema>>();
    
    if (toolOutput) {
        return { results: toolOutput };
    }
    
    // If the tool wasn't called for some reason, return empty results.
    return { results: [] };
  }
);
