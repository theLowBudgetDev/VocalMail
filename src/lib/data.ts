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
    // Properties below are for recipient view
    read?: boolean;
    status?: 'inbox' | 'archive' | 'deleted' | 'sent';
     // Property below is for sender view
    recipients?: { name: string; email: string }[];
};

export const emailCategories = [
    { id: 'urgent', name: 'Urgent', description: 'Critical, time-sensitive messages.' },
    { id: 'important', name: 'Important', description: 'High-priority messages.' },
    { id: 'promotions', name: 'Promotions', description: 'Marketing and sales offers.' },
    { id: 'social', name: 'Social', description: 'Notifications from social networks.' },
    { id: 'updates', name: 'Updates', description: 'Announcements and newsletters.' },
    { id: 'personal', name: 'Personal', description: 'Messages from friends and family.' }
];
