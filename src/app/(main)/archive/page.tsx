import { emails } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function ArchivePage() {
    const archivedEmails = emails.filter((email) => email.tag === 'archive');

    return (
      <div className="p-4 md:p-6">
        <Card>
            <CardHeader>
                <CardTitle>Archive</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>From</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {archivedEmails.map((email) => (
                            <TableRow key={email.id}>
                                <TableCell className="font-medium">{email.from.name}</TableCell>
                                <TableCell>{email.subject}</TableCell>
                                <TableCell className="text-right">{format(new Date(email.date), "PPP")}</TableCell>
                            </TableRow>
                        ))}
                        {archivedEmails.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">No archived emails.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    );
}
