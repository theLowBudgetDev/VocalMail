"use client";

import * as React from "react";
import { contacts as allContacts } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";

export default function ContactsPage() {
    const [searchQuery, setSearchQuery] = React.useState("");
    const { play } = useTextToSpeech();

    const filteredContacts = React.useMemo(() => {
        if (!searchQuery) {
            return allContacts;
        }
        return allContacts.filter((contact) =>
            contact.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const clearSearch = () => {
        setSearchQuery("");
        play("Search cleared.");
    };
    
    React.useEffect(() => {
        const handleCommand = (event: CustomEvent) => {
            const { command, contactName } = event.detail;
            if (command === 'action_search_contact' && contactName) {
                handleSearch(contactName);
                play(`Showing results for ${contactName}.`);
            }
            if (command === 'action_help') {
                play("You are on the contacts page. Say 'find' and a name to search. You can also use global navigation commands like 'go to inbox'.");
            }
        };
        window.addEventListener('voice-command', handleCommand as EventListener);
        return () => {
            window.removeEventListener('voice-command', handleCommand as EventListener);
        };
    }, [play]);

    return (
      <div className="p-4 md:p-6">
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>Contacts</CardTitle>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search contacts..." 
                        className="pl-8 w-full" 
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                       {searchQuery && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={clearSearch}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredContacts.map((contact) => (
                        <Card key={contact.id} className="p-4 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-shadow">
                            <Avatar className="h-20 w-20 mb-4">
                                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{contact.avatar}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-lg">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                        </Card>
                    ))}
                     {filteredContacts.length === 0 && (
                        <div className="col-span-full text-center py-10">
                            <p>No contacts found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    );
}
