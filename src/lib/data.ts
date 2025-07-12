import type { User as PrismaUser, Email as PrismaEmail, Contact as PrismaContact } from '@prisma/client';

export type User = PrismaUser;
export type Contact = PrismaUser;

// This is a view model for the frontend, combining data from multiple Prisma models.
export type Email = {
    id: number;
    senderId: number;
    senderName: string;
    senderEmail: string;
    subject: string;
    body: string;
    sentAt: string;
    read?: boolean;
    status?: 'inbox' | 'archive' | 'deleted' | 'sent';
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
