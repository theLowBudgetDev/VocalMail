
import { getUsers, getLoggedInUser, login } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const loggedInUser = await getLoggedInUser();
  if (loggedInUser) {
    redirect('/inbox');
  }

  const users = await getUsers();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <form action={login}>
          <CardHeader>
            <CardTitle>Welcome to VocalMail</CardTitle>
            <CardDescription>Select a user to log in and start testing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {searchParams.error && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md text-sm">
                {searchParams.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="userId">Select User</Label>
              <Select name="userId" required>
                <SelectTrigger id="userId">
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
