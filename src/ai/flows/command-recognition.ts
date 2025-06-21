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
    "action_reply",
    "action_delete",
    "action_archive",
    "action_send",
    "unknown"
] as const;

const RecognizeCommandOutputSchema = z.object({
  command: z.enum(validCommands).describe('The recognized command from the provided list.'),
  emailId: z.number().optional().describe('The 1-based index of the email to read, if applicable.'),
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
- "action_reply": To reply to the currently selected email. (Only in inbox). (e.g., "reply")
- "action_delete": To delete the currently selected email. (Only in inbox). (e.g., "delete this")
- "action_archive": To archive the currently selected email. (Only in inbox). (e.g., "archive this")
- "action_send": To send the composed email. (Only on compose page). (e.g., "send email", "send it")
- "unknown": If the command is not one of the above or is ambiguous.

Transcribe the audio and determine the most appropriate command from the list.

Audio: {{media url=audioDataUri}}

Your output must be a single command and, if applicable, the emailId.`,
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
