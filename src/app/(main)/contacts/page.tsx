import { contacts } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ContactsPage() {
    return (
      <div className="p-4 md:p-6">
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>Contacts</CardTitle>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search contacts..." className="pl-8 w-full" />
                    </div>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {contacts.map((contact) => (
                        <Card key={contact.id} className="p-4 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-shadow">
                            <Avatar className="h-20 w-20 mb-4">
                                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{contact.avatar}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-lg">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                        </Card>
                    ))}
                     {contacts.length === 0 && (
                        <div className="col-span-full text-center py-10">
                            <p>No contacts found.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    );
}
