'use server';

/**
 * @fileOverview Recognizes voice commands for app navigation and actions.
 *
 * - recognizeCommand - A function that handles the voice command recognition process.
 * - RecognizeCommandInput - The input type for the recognizeCommand function.
 * - RecognizeCommandOutput - The return type for the recognizeCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeCommandInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI of the spoken command, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    currentPath: z.string().describe("The current URL path of the application.")
});
export type RecognizeCommandInput = z.infer<typeof RecognizeCommandInputSchema>;

const validCommands = [
    "navigate_inbox",
    "navigate_sent",
    "navigate_archive",
    "navigate_contacts",
    "navigate_compose",
    "action_read_list",
    "action_read_email",
    "action_summarize_email",
    "action_reply",
    "action_delete",
    "action_archive",
    "action_send",
    "action_use_suggestion",
    "action_search_contact",
    "action_proofread_email",
    "action_help",
    "unknown"
] as const;

const RecognizeCommandOutputSchema = z.object({
  command: z.enum(validCommands).describe('The recognized command from the provided list.'),
  emailId: z.number().optional().describe('The 1-based index of the email to read, if applicable.'),
  suggestionId: z.number().optional().describe('The 1-based index of the smart reply suggestion to use, if applicable.'),
  contactName: z.string().optional().describe("The name of the contact to search for."),
});
export type RecognizeCommandOutput = z.infer<typeof RecognizeCommandOutputSchema>;

export async function recognizeCommand(
  input: RecognizeCommandInput
): Promise<RecognizeCommandOutput> {
  return commandRecognitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'commandRecognitionPrompt',
  input: {schema: RecognizeCommandInputSchema},
  output: {schema: RecognizeCommandOutputSchema},
  prompt: `You are a voice command interpreter for the VocalMail email application. Your task is to understand the user's spoken command and map it to a single, specific command from the available list.

The user is currently on the '{{currentPath}}' page. Use this context to resolve ambiguity.

Available commands:
- "navigate_inbox": To go to the inbox page. (e.g., "go to inbox", "show my mail")
- "navigate_sent": To go to the sent mail page. (e.g., "show sent items")
- "navigate_archive": To go to the archive page. (e.g., "open archive")
- "navigate_contacts": To go to the contacts page. (e.g., "show my contacts")
- "navigate_compose": To go to the new email page. (e.g., "compose a new email", "new message")
- "action_read_list": To read a summary of the emails in the current view. (Only in inbox). (e.g., "read my emails", "list messages")
- "action_read_email": To read a specific email by its number. (Only in inbox). If the user says "read email one", "open message 3", extract the number and put it in the 'emailId' field. The ID is 1-based.
- "action_summarize_email": To get a summary of the currently selected email. (Only in inbox). (e.g., "summarize this", "give me the summary")
- "action_reply": To reply to the currently selected email (opens a blank reply). (Only in inbox). (e.g., "reply", "compose reply")
- "action_delete": To delete the currently selected email. (Only in inbox). (e.g., "delete this")
- "action_archive": To archive the currently selected email. (Only in inbox). (e.g., "archive this")
- "action_send": To send the composed email. (Only on compose page). (e.g., "send email", "send it")
- "action_use_suggestion": To use a numbered smart reply suggestion. (Only when viewing an email with suggestions). If the user says "reply one", "use suggestion 3", "select reply 2", extract the number and put it in the 'suggestionId' field. The ID is 1-based.
- "action_search_contact": To search for a contact by name. (Only on contacts page). If the user says "find Alice", "look for Bob", "search for Charlie", extract the name and put it in the 'contactName' field.
- "action_proofread_email": To have the current email draft read back to you. (Only on compose page). (e.g., "proofread my email", "read it back to me")
- "action_help": For help with available commands. (e.g., "help", "what can I do here?")
- "unknown": If the command is not one of the above, is ambiguous, or is general dictation. On the compose page, any text that isn't a specific command should be treated as 'unknown'.

Transcribe the audio and determine the most appropriate command from the list. The word "reply" by itself should map to "action_reply". "Reply" followed by a number should map to "action_use_suggestion".

Audio: {{media url=audioDataUri}}

Your output must be a single command and, if applicable, the emailId, suggestionId, or contactName.`,
});

const commandRecognitionFlow = ai.defineFlow(
  {
    name: 'commandRecognitionFlow',
    inputSchema: RecognizeCommandInputSchema,
    outputSchema: RecognizeCommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
