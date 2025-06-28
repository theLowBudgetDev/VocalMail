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
import { emailCategories } from '@/lib/data';

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
    "navigate_search",
    "navigate_help",
    "action_read_list",
    "action_read_email",
    "action_summarize_email",
    "action_reply",
    "action_delete",
    "action_archive",
    "action_send",
    "action_use_suggestion",
    "action_search_contact",
    "action_email_contact",
    "action_proofread_email",
    "action_correct_email",
    "action_add_contact",
    "action_delete_contact",
    "action_search_email",
    "action_read_category",
    "action_help",
    "unknown"
] as const;

// Dynamically create a Zod enum from the emailCategories array
const validCategories = emailCategories.map(c => c.id) as [string, ...string[]];
const CategoryEnum = z.enum(validCategories);


const RecognizeCommandOutputSchema = z.object({
  command: z.enum(validCommands).describe('The recognized command from the provided list.'),
  transcription: z.string().optional().describe("The direct transcription of the user's speech. This should be populated especially when the command is 'unknown'."),
  emailId: z.number().optional().describe('The 1-based index of the email to read, if applicable.'),
  suggestionId: z.number().optional().describe('The 1-based index of the smart reply suggestion to use, if applicable.'),
  contactName: z.string().optional().describe("The name of the contact to search for, add, or delete."),
  searchQuery: z.string().optional().describe("The user's search query for emails."),
  category: CategoryEnum.optional().describe("The category of emails to read (e.g., 'urgent', 'promotions')."),
  correctionField: z.enum(['to', 'subject', 'body']).optional().describe("The field to correct in the email draft (to, subject, or body)."),
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
  prompt: `You are a voice command interpreter for the VocalMail email application. Your task is to understand the user's spoken command and map it to a single, specific command from the available list. Also, provide a direct transcription of what the user said.

The user is currently on the '{{currentPath}}' page. Use this context to resolve ambiguity. If the user is on the '/compose' page, they are likely dictating content for a field. In this case, the command should be 'unknown' and the 'transcription' field should contain their dictated text. Only recognize a specific command on the compose page if it's very clear (like "send email" or "make a correction").

Available commands:
- "navigate_inbox": To go to the inbox page. (e.g., "go to inbox", "show my mail")
- "navigate_sent": To go to the sent mail page. (e.g., "show sent items")
- "navigate_archive": To go to the archive page. (e.g., "open archive")
- "navigate_contacts": To go to the contacts page. (e.g., "show my contacts")
- "navigate_compose": To go to the new email page. (e.g., "compose a new email", "new message")
- "navigate_search": To go to the email search page. (e.g., "go to search")
- "navigate_help": To go to the help page, which lists all available commands. (e.g., "go to help", "what are all the commands?")
- "action_read_list": To read a summary of the items in the current view (emails, contacts, or search results). (e.g., "read the list", "list my emails")
- "action_read_email": To read a specific email by its number from the current list. If the user says "read email one", "open message 3", extract the number and put it in the 'emailId' field. The ID is 1-based.
- "action_summarize_email": To get a summary of the currently selected email. (Only in inbox). (e.g., "summarize this")
- "action_reply": To reply to the currently selected email. (Only in inbox). (e.g., "reply")
- "action_delete": To delete the currently selected email. (Only in inbox). (e.g., "delete this")
- "action_archive": To archive the currently selected email. (Only in inbox). (e.g., "archive this")
- "action_send": To send the composed email. (Only on compose page). (e.g., "send email")
- "action_use_suggestion": To use a numbered smart reply suggestion. (Only when viewing an email with suggestions). If the user says "use reply one", "select suggestion 3", extract the number and put it in the 'suggestionId' field. The ID is 1-based.
- "action_search_contact": To search for a contact by name. (Only on contacts page). If the user says "find Alice", extract the name into 'contactName'.
- "action_email_contact": To start composing an email to a specific contact. (Only on contacts page). (e.g., "email Alice"). Extract the name into 'contactName'.
- "action_proofread_email": To have the current email draft read back to you. (Only on compose page). (e.g., "proofread my email")
- "action_correct_email": To make a correction to the email draft. If the user specifies a field (e.g., "correct the subject", "change the recipient"), extract the field name ('to', 'subject', or 'body') into 'correctionField'. (Only on compose page).
- "action_add_contact": To open the form to add a new contact. (Only on contacts page). (e.g., "add a new contact")
- "action_delete_contact": To delete a contact by name. (Only on contacts page). (e.g., "delete Bob", "remove Charlie"). Extract the name into 'contactName'.
- "action_search_email": To search all emails. (Global command). If the user says "search for emails about project budget", extract "project budget" into 'searchQuery'.
- "action_read_category": To read emails from a specific category (e.g., "read urgent emails", "show me promotions"). The valid categories are: ${validCategories.join(", ")}. Extract the category name into the 'category' field.
- "action_help": For help with available commands on the current page. (e.g., "help", "what can I do?")
- "unknown": If the command is not one of the above, is ambiguous, or is general dictation.

Transcribe the audio and determine the most appropriate command.

Audio: {{media url=audioDataUri}}

Your output must include both the transcribed text and a single command, plus any relevant parameters.`,
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
