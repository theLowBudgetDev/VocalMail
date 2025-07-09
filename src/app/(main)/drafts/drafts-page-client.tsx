
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DraftsPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    const { play } = useTextToSpeech();

    const handleReadList = React.useCallback(() => {
        play("You have no drafts.");
    }, [play]);

    React.useEffect(() => {
        const autorun = searchParams.get('autorun');
        if (autorun === 'read_list') {
            play("Navigated to Drafts.", handleReadList);
            router.replace('/drafts', { scroll: false });
        }
    }, [searchParams, play, handleReadList, router]);
    
    // Voice command handler for help
    React.useEffect(() => {
        const handleCommand = (event: CustomEvent) => {
            const { command } = event.detail;
            if (command === 'action_help' || command === 'action_read_list') {
                handleReadList();
            }
        };
        window.addEventListener('voice-command', handleCommand as EventListener);
        return () => window.removeEventListener('voice-command', handleCommand as EventListener);
    }, [handleReadList]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 h-full">
            <div className={cn(
                "col-span-1 xl:col-span-1 border-r bg-background h-full flex flex-col",
                isMobile && "hidden"
            )}>
                <div className="flex items-center p-2 h-12 border-b">
                    <h2 className="text-lg font-bold px-2">Drafts</h2>
                </div>
                <ScrollArea className="flex-1">
                    <div className="text-center p-8 text-muted-foreground">
                        You have no drafts.
                    </div>
                </ScrollArea>
            </div>
            <div className={cn(
                "md:col-span-2 xl:col-span-3 h-full bg-background",
                isMobile ? "hidden" : "flex flex-col"
            )}>
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a draft to view
                </div>
            </div>
        </div>
    );
}
