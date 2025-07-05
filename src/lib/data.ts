export type User = {
    id: number;
    name: string;
    email: string;
    avatar: string;
};

export type Contact = {
    id: number;
    name: string;
    email: string;
    avatar: string;
}

export type Email = {
    id: number;
    senderId: number;
    senderName: string;
    senderEmail: string;
    subject: string;
    body: string;
    sentAt: string;
    category: EmailCategory['id'];
    // Properties below are for recipient view
    read?: boolean;
    status?: 'inbox' | 'archive' | 'deleted';
     // Property below is for sender view
    recipients?: { name: string; email: string }[];
};

export type EmailCategory = {
    id: 'urgent' | 'important' | 'promotions' | 'social' | 'updates' | 'personal';
    name: string;
    color: 'destructive' | 'primary' | 'accent' | 'secondary' | 'muted' | 'foreground';
};

export const emailCategories: EmailCategory[] = [
    { id: 'urgent', name: 'Urgent', color: 'destructive' },
    { id: 'important', name: 'Important', color: 'primary' },
    { id: 'personal', name: 'Personal', color: 'accent' },
    { id: 'updates', name: 'Updates', color: 'secondary' },
    { id: 'promotions', name: 'Promotions', color: 'muted' },
    { id: 'social', name: 'Social', color: 'muted' },
];
