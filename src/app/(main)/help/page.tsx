
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bot, Mail, Users, Compass, Edit3 } from "lucide-react";

const commands = [
    {
        category: "Global Navigation",
        icon: Compass,
        items: [
            { command: "'Go to [page]'", description: "Navigate to Inbox, Sent, Archive, Contacts, Compose, Search, or Help." },
            { command: "'Search for [query]'", description: "Performs a global search across all your emails." },
        ]
    },
    {
        category: "Email Lists (Inbox, Sent, etc.)",
        icon: Mail,
        items: [
            { command: "'Read the list'", description: "Reads out a summary of the emails in the current view." },
            { command: "'Read email [number]'", description: "Reads the full content of the specified email." },
        ]
    },
    {
        category: "Viewing an Email (in Inbox)",
        icon: Bot,
        items: [
            { command: "'Summarize this email'", description: "Provides a concise AI-generated summary of the email." },
            { command: "'Reply'", description: "Opens the compose page to reply to the current email." },
            { command: "'Archive this email'", description: "Moves the email from your inbox to the archive." },
            { command: "'Delete this email'", description: "Permanently deletes the email." },
            { command: "'Use suggestion [number]'", description: "Uses a numbered AI-generated smart reply." },
        ]
    },
    {
        category: "Composing an Email",
        icon: Edit3,
        items: [
            { command: "(Dictate content)", description: "Dictate the recipient's email, the subject, and the body of the email when prompted." },
            { command: "'Proofread email'", description: "Reads the entire draft back to you before sending." },
            { command: "'Send email'", description: "Sends the email." },
        ]
    },
     {
        category: "Managing Contacts",
        icon: Users,
        items: [
            { command: "'Find [contact name]'", description: "Searches for a specific contact." },
            { command: "'Email [contact name]'", description: "Starts a new email to the specified contact." },
            { command: "'Add a new contact'", description: "Opens the dialog to add a new contact." },
            { command: "'Delete [contact name]'", description: "Deletes the specified contact from your list." },
        ]
    }
];

export default function HelpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { play } = useTextToSpeech();

    const generateHelpText = React.useCallback(() => {
        let text = "Here are the available commands. ";
        commands.forEach(category => {
            text += `For ${category.category}: `;
            const commandDescriptions = category.items.map(item => `You can say ${item.command} to ${item.description.toLowerCase().replace(/\.$/, '')}.`).join(' ');
            text += commandDescriptions + " ";
        });
        return text;
    }, []);

    const handleReadList = React.useCallback(() => {
        const helpText = generateHelpText();
        play(helpText);
    }, [generateHelpText, play]);

    React.useEffect(() => {
        const autorun = searchParams.get('autorun');
        if (autorun === 'read_list') {
            play("Navigated to Help.", handleReadList);
            router.replace('/help', { scroll: false });
        }
    }, [searchParams, play, handleReadList, router]);

    React.useEffect(() => {
        const handleCommand = (event: CustomEvent) => {
            const { command } = event.detail;
            if (command === 'action_read_list' || command === 'action_help') {
                handleReadList();
            }
        };
        window.addEventListener('voice-command', handleCommand as EventListener);
        return () => window.removeEventListener('voice-command', handleCommand as EventListener);
    }, [handleReadList]);

    return (
        <div className="p-4 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Help Center</CardTitle>
                    <CardDescription>
                        Here is a list of all available voice commands. You can say "read the list" to have them read aloud.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                        {commands.map((category, index) => (
                            <AccordionItem value={`item-${index}`} key={category.category}>
                                <AccordionTrigger className="text-lg">
                                    <div className="flex items-center gap-2">
                                        <category.icon className="h-5 w-5" />
                                        <span>{category.category}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-2 pl-6">
                                        {category.items.map(item => (
                                            <li key={item.command} className="flex flex-col">
                                                <span className="font-semibold text-primary">{item.command}</span>
                                                <span className="text-muted-foreground">{item.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
