import { config } from 'dotenv';
config();

import '@/ai/flows/voice-to-text-conversion.ts';
import '@/ai/flows/text-to-voice-conversion.ts';
import '@/ai/flows/command-recognition.ts';
import '@/ai/flows/reply-suggestion-flow.ts';
