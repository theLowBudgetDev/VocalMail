import { emails } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function SentPage() {
    const sentEmails = emails.filter((email) => email.tag === 'sent');

    return (
      <div className="p-4 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Sent</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>To</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sentEmails.map((email) => (
                            <TableRow key={email.id}>
                                <TableCell className="font-medium">{email.to?.name || 'N/A'}</TableCell>
                                <TableCell>{email.subject}</TableCell>
                                <TableCell className="text-right">{format(new Date(email.date), "PPP")}</TableCell>
                            </TableRow>
                        ))}
                         {sentEmails.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">No sent emails.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    );
}
