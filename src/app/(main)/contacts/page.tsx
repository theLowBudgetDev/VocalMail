
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { contacts as initialContacts, type Contact } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, X, Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ContactsPage() {
    const [contacts, setContacts] = React.useState<Contact[]>(initialContacts);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [newContactName, setNewContactName] = React.useState("");
    const [newContactEmail, setNewContactEmail] = React.useState("");

    const { play } = useTextToSpeech();
    const router = useRouter();
    const searchParams = useSearchParams();

    const filteredContacts = React.useMemo(() => {
        if (!searchQuery) {
            return contacts;
        }
        return contacts.filter((contact) =>
            contact.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, contacts]);

    const handleReadList = React.useCallback(() => {
        const contactNames = filteredContacts.map(c => c.name).join(', ');
        if (filteredContacts.length > 0) {
            play(`Showing ${filteredContacts.length} contacts: ${contactNames}.`);
        } else {
            play('There are no contacts to show.');
        }
    }, [filteredContacts, play]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleEmailContact = (email: string, name: string) => {
        router.push(`/compose?to=${encodeURIComponent(email)}`);
    };

    const clearSearch = () => {
        setSearchQuery("");
        play("Search cleared.");
    };

    const handleAddContact = () => {
        if (!newContactName || !newContactEmail) {
            play("Please fill out both name and email.");
            return;
        }
        const newContact: Contact = {
            id: Date.now().toString(),
            name: newContactName,
            email: newContactEmail,
            avatar: newContactName.charAt(0).toUpperCase(),
        };
        setContacts(prev => [...prev, newContact]);
        play(`Contact ${newContactName} added.`);
        setIsAddDialogOpen(false);
        setNewContactName("");
        setNewContactEmail("");
    };

    const handleDeleteContact = (name: string) => {
        const contactExists = contacts.some(c => c.name.toLowerCase() === name.toLowerCase());
        if (contactExists) {
            setContacts(prev => prev.filter(c => c.name.toLowerCase() !== name.toLowerCase()));
            play(`Contact ${name} deleted.`);
        } else {
            play(`Sorry, I could not find a contact named ${name}.`);
        }
    };

    React.useEffect(() => {
        const autorun = searchParams.get('autorun');
        if (autorun === 'read_list') {
            play("Navigated to Contacts.", handleReadList);
            router.replace('/contacts', {scroll: false});
        }
    }, [searchParams, play, handleReadList, router]);
    
    React.useEffect(() => {
        const handleCommand = (event: CustomEvent) => {
            const { command, contactName } = event.detail;
            switch(command) {
                case 'action_search_contact':
                    if (contactName) {
                        handleSearch(contactName);
                        play(`Showing results for ${contactName}.`);
                    }
                    break;
                case 'action_read_list':
                    handleReadList();
                    break;
                case 'action_email_contact':
                     if (contactName) {
                        const targetContact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
                        if (targetContact) {
                           handleEmailContact(targetContact.email, targetContact.name);
                        } else {
                            play(`Sorry, I could not find a contact named ${contactName}.`);
                        }
                    }
                    break;
                case 'action_add_contact':
                    play("Opening the add contact dialog.");
                    setIsAddDialogOpen(true);
                    break;
                case 'action_delete_contact':
                    if (contactName) {
                        handleDeleteContact(contactName);
                    } else {
                        play("Please specify which contact to delete.");
                    }
                    break;
                case 'action_help':
                    play("You are on the contacts page. You can say: 'find' and a name to search, 'list contacts', 'email' and a name, 'add contact', or 'delete' and a name.");
                    break;
            }
        };
        window.addEventListener('voice-command', handleCommand as EventListener);
        return () => {
            window.removeEventListener('voice-command', handleCommand as EventListener);
        };
    }, [play, filteredContacts, contacts, handleReadList]);

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
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredContacts.map((contact) => (
                        <Card key={contact.id} className="p-4 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-shadow relative group">
                            <Avatar className="h-20 w-20 mb-4">
                                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{contact.avatar}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-lg">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleEmailContact(contact.email, contact.name)}
                            >
                                <Mail className="h-4 w-4" />
                            </Button>
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                    <DialogDescription>
                        Enter the details for your new contact here.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAddContact}>Save contact</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    );
}
