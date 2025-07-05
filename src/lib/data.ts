export type User = {
    id: number;
    name: string;
    email: string;
    avatar: string;
    password?: string;
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
