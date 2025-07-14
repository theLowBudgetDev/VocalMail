
'use server';
/**
 * @fileOverview Generates a user avatar image.
 *
 * - generateAvatar - A function that generates an avatar for a user.
 * - GenerateAvatarInput - The input type for the function.
 * - GenerateAvatarOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAvatarInputSchema = z.object({
  name: z.string().describe('The name of the user to generate an avatar for.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      'The generated avatar image as a data URI, including MIME type and Base64 encoding.'
    ),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(
  input: GenerateAvatarInput
): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a professional, minimalist, and abstract avatar for a user named "${input.name}". The avatar should be a simple, elegant geometric design or a stylized initial, suitable for a professional email client. It should be clean, modern, and gender-neutral. Avoid photorealistic images. Use a pleasing, soft color palette.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid data URI.');
    }
    
    return { avatarDataUri: media.url };
  }
);
