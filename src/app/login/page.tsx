
import { getUsers, login } from "@/lib/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getLoggedInUser } from "@/lib/actions";

export default async function LoginPage() {
    const loggedInUser = await getLoggedInUser();
    if (loggedInUser) {
        redirect('/inbox');
    }

    const users = await getUsers();

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login As</CardTitle>
                    <CardDescription>Select a user to log in to the VocalMail application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <form action={login} key={user.id} className="w-full">
                                <input type="hidden" name="userId" value={user.id} />
                                <Button type="submit" className="w-full justify-start h-auto p-4">
                                    <Avatar className="mr-4">
                                        <AvatarFallback>{user.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-primary-foreground/80">{user.email}</p>
                                    </div>
                                </Button>
                            </form>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
