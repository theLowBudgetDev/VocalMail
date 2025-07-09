'use server';

import { revalidatePath } from 'next/cache';
import type { User, Email, Contact } from './data';
import { users, emails as emailTemplates, contacts as allContacts } from './mock-data';
import { cache } from 'react';

// In-memory store to simulate database state
let mockEmails: Email[] = JSON.parse(JSON.stringify(emailTemplates));
let mockContacts: { ownerId: number; contactUserId: number }[] = JSON.parse(JSON.stringify(allContacts));

// --- AUTH ACTIONS (REMOVED) ---
// The application now operates in a single-user mode.

export const getLoggedInUser = cache(async (): Promise<User | null> => {
    // Always return the first user for a single-user demo experience.
    return Promise.resolve(users[0]);
});

// --- DATA ACTIONS ---

export async function getUsers(): Promise<User[]> {
    return Promise.resolve(users);
}

export async function getInboxEmails(userId: number): Promise<Email[]> {
    const userEmails = mockEmails.filter(email => 
        email.recipients?.some(r => r.email === users.find(u => u.id === userId)?.email) && email.status === 'inbox'
    );
    userEmails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return Promise.resolve(userEmails);
}

export async function getArchivedEmails(userId: number): Promise<Email[]> {
    const userEmails = mockEmails.filter(email => 
        email.recipients?.some(r => r.email === users.find(u => u.id === userId)?.email) && email.status === 'archive'
    );
    userEmails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return Promise.resolve(userEmails);
}

export async function getSentEmails(userId: number): Promise<Email[]> {
    const userEmails = mockEmails.filter(email => email.senderId === userId && email.status === 'sent');
    userEmails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return Promise.resolve(userEmails);
}

export async function searchEmails(userId: number, searchTerm: string): Promise<Email[]> {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    
    const lowercasedTerm = searchTerm.toLowerCase();

    const results = mockEmails.filter(email => {
        const isSender = email.senderId === userId;
        const isRecipient = email.recipients?.some(r => r.email === user.email);
        
        if (!isSender && !isRecipient) {
            return false;
        }
        
        if (email.status === 'deleted') return false;

        const fromMatch = `from:${email.senderName.toLowerCase()}`.includes(lowercasedTerm);
        const subjectMatch = email.subject.toLowerCase().includes(lowercasedTerm);
        const bodyMatch = email.body.toLowerCase().includes(lowercasedTerm);

        return fromMatch || subjectMatch || bodyMatch;
    });

    results.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return Promise.resolve(results);
}


export async function getContacts(userId: number): Promise<Contact[]> {
    const contactLinks = mockContacts.filter(c => c.ownerId === userId);
    const contactIds = contactLinks.map(c => c.contactUserId);
    const contacts = users.filter(u => contactIds.includes(u.id));
    contacts.sort((a, b) => a.name.localeCompare(b.name));
    return Promise.resolve(contacts);
}

export async function markEmailAsRead(emailId: number, userId: number) {
    const emailIndex = mockEmails.findIndex(e => e.id === emailId);
    if (emailIndex > -1) {
        mockEmails[emailIndex].read = true;
    }
    revalidatePath('/inbox');
}

export async function archiveEmail(emailId: number, userId: number) {
    const emailIndex = mockEmails.findIndex(e => e.id === emailId);
    if (emailIndex > -1) {
        mockEmails[emailIndex].status = 'archive';
    }
    revalidatePath('/inbox');
    revalidatePath('/archive');
}

export async function unarchiveEmail(emailId: number, userId: number) {
    const emailIndex = mockEmails.findIndex(e => e.id === emailId);
    if (emailIndex > -1) {
        mockEmails[emailIndex].status = 'inbox';
    }
    revalidatePath('/inbox');
    revalidatePath('/archive');
}

export async function deleteUserEmail(emailId: number, userId: number, type: 'inbox' | 'archive' | 'sent' | 'search', originalStatus?: string) {
     const emailIndex = mockEmails.findIndex(e => e.id === emailId);
     if (emailIndex > -1) {
         mockEmails[emailIndex].status = 'deleted';
     }
    revalidatePath('/inbox');
    revalidatePath('/archive');
    revalidatePath('/sent');
    revalidatePath('/search');
}


export async function addContact(ownerId: number, contactEmail: string) {
    const contactUser = users.find(u => u.email === contactEmail);
    if (!contactUser) {
        throw new Error("User with that email does not exist.");
    }
    if (ownerId === contactUser.id) {
         throw new Error("You cannot add yourself as a contact.");
    }
    const exists = mockContacts.some(c => c.ownerId === ownerId && c.contactUserId === contactUser.id);
    if (exists) {
        throw new Error("This person is already in your contacts.");
    }
    mockContacts.push({ ownerId, contactUserId: contactUser.id });
    revalidatePath('/contacts');
}

export async function deleteContact(ownerId: number, contactId: number) {
    mockContacts = mockContacts.filter(c => !(c.ownerId === ownerId && c.contactUserId === contactId));
    revalidatePath('/contacts');
}

export async function sendEmail(senderId: number, to: string, subject: string, body: string) {
    const sender = users.find(u => u.id === senderId);
    const recipient = users.find(u => u.email === to);
    
    if (!sender || !recipient) {
        throw new Error(`Recipient email "${to}" not found.`);
    }

    const newEmail: Email = {
        id: Math.max(0, ...mockEmails.map(e => e.id)) + 1,
        senderId: sender.id,
        senderName: sender.name,
        senderEmail: sender.email,
        recipients: [{ name: recipient.name, email: recipient.email }],
        subject,
        body,
        sentAt: new Date().toISOString(),
        status: 'inbox',
        read: false,
    };
    
    // The sent email also needs a 'sent' status for the sender's outbox
    const sentVersion = {...newEmail, status: 'sent' as const};

    mockEmails.push(sentVersion);
    
    revalidatePath('/sent');
    revalidatePath('/inbox');
}
