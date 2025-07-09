
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bot, Mail, Users, Compass, Edit3, Globe } from "lucide-react";

const commands = [
    {
        category: "Global Commands",
        icon: Globe,
        items: [
            { command: "'Search for [query]'", description: "Performs a global search across all your emails, from any page." },
            { command: "'Help' or 'What can I do?'", description: "Describes the available commands on your current page." },
        ]
    },
    {
        category: "Navigation",
        icon: Compass,
        items: [
            { command: "'Go to [page]'", description: "Navigate to Inbox, Sent, Archive, Contacts, Compose, or Search." },
        ]
    },
    {
        category: "Working with Lists (Inbox, Sent, etc.)",
        icon: Mail,
        items: [
            { command: "'Read the list'", description: "Reads out a summary of the items in the current view (e.g., your inbox emails or contacts)." },
            { command: "'Read email [number]'", description: "Reads the full content of the specified email from the list you're viewing." },
        ]
    },
    {
        category: "Actions on an Email",
        icon: Bot,
        items: [
            { command: "'Summarize this email'", description: "Provides a concise AI-generated summary. (Available in Inbox)" },
            { command: "'Reply'", description: "Opens the compose page to reply to the current email. (Available in Inbox)" },
            { command: "'Use suggestion [number]'", description: "Uses one of the numbered AI-generated smart replies. (Available in Inbox)" },
            { command: "'Archive this email'", description: "Moves the email from your inbox to the archive. (Available in Inbox)" },
            { command: "'Unarchive this email'", description: "Moves the email from your archive back to the inbox. (Available in Archive)" },
            { command: "'Delete this email'", description: "Permanently deletes the currently selected email. (Available in Inbox, Archive, Sent)" },
        ]
    },
    {
        category: "Composing an Email",
        icon: Edit3,
        items: [
            { command: "(Dictate content)", description: "When prompted for a field (To, Subject, or Body), simply speak to fill it in." },
            { command: "'Recipient' / 'Subject' / 'Body'", description: "Switches focus to a specific field for dictation." },
            { command: "'Proofread email'", description: "Reads the entire draft back to you for review before sending." },
            { command: "'Make a correction' or 'Change the [field]'", description: "Allows you to re-dictate a specific field if you made a mistake." },
            { command: "'Send email'", description: "Sends the email once you are finished." },
        ]
    },
     {
        category: "Managing Contacts",
        icon: Users,
        items: [
            { command: "'Find [contact name]'", description: "Searches for a specific contact by name." },
            { command: "'Email [contact name]'", description: "Starts a new email to the specified contact." },
            { command: "'Add a new contact'", description: "Opens the form to add a new contact." },
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
                    <Accordion type="single" collapsible className="w-full">
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
