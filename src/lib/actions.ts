
'use server';

import { revalidatePath } from 'next/cache';
import { db } from './db';
import type { User, Email, Contact } from './data';
import { categorizeEmail } from '@/ai/flows/email-categorization-flow';

export async function getUsers(): Promise<User[]> {
    return db.prepare('SELECT * FROM users').all() as User[];
}

export async function getInboxEmails(userId: number): Promise<Email[]> {
    const query = `
        SELECT
            e.id,
            e.subject,
            e.body,
            e.sentAt,
            e.category,
            u.id as senderId,
            u.name as senderName,
            u.email as senderEmail,
            er.read,
            er.status
        FROM emails e
        JOIN email_recipients er ON e.id = er.emailId
        JOIN users u ON e.senderId = u.id
        WHERE er.recipientId = ? AND er.status = 'inbox'
        ORDER BY e.sentAt DESC
    `;
    const emails = db.prepare(query).all(userId) as any[];
    return emails.map(e => ({...e, read: !!e.read}));
}

export async function getArchivedEmails(userId: number): Promise<Email[]> {
     const query = `
        SELECT
            e.id,
            e.subject,
            e.body,
            e.sentAt,
            e.category,
            u.id as senderId,
            u.name as senderName,
            u.email as senderEmail
        FROM emails e
        JOIN email_recipients er ON e.id = er.emailId
        JOIN users u ON e.senderId = u.id
        WHERE er.recipientId = ? AND er.status = 'archive'
        ORDER BY e.sentAt DESC
    `;
    return db.prepare(query).all(userId) as Email[];
}

export async function getSentEmails(userId: number): Promise<Email[]> {
    const query = `
        SELECT
            e.id,
            e.subject,
            e.body,
            e.sentAt,
            e.category,
            u.id as senderId,
            u.name as senderName,
            u.email as senderEmail
        FROM emails e
        JOIN users u ON e.senderId = u.id
        WHERE e.senderId = ? AND e.senderStatus = 'sent'
        ORDER BY e.sentAt DESC
    `;
    const emails = db.prepare(query).all(userId) as Email[];

    // For each sent email, get its recipients
    const getRecipientsStmt = db.prepare(`
        SELECT u.name, u.email 
        FROM email_recipients er
        JOIN users u ON er.recipientId = u.id
        WHERE er.emailId = ?
    `);

    return emails.map(email => {
        const recipients = getRecipientsStmt.all(email.id) as { name: string; email: string }[];
        return { ...email, recipients };
    });
}

export async function searchEmails(userId: number, searchTerm: string): Promise<Email[]> {
    const searchQuery = `%${searchTerm}%`;
    
    // Search own sent items
    const sentQuery = `
        SELECT e.*, s.name as senderName, s.email as senderEmail, 'sent' as tag
        FROM emails e
        JOIN users s ON e.senderId = s.id
        WHERE e.senderId = ?
        AND e.senderStatus = 'sent'
        AND (e.subject LIKE ? OR e.body LIKE ?)
    `;
    const sentResults = db.prepare(sentQuery).all(userId, searchQuery, searchQuery) as any[];

    // Search received items
    const receivedQuery = `
        SELECT e.*, s.name as senderName, s.email as senderEmail, er.status as tag
        FROM emails e
        JOIN users s ON e.senderId = s.id
        JOIN email_recipients er ON er.emailId = e.id
        WHERE er.recipientId = ?
        AND er.status IN ('inbox', 'archive')
        AND (e.subject LIKE ? OR e.body LIKE ? OR s.name LIKE ?)
    `;
    const receivedResults = db.prepare(receivedQuery).all(userId, searchQuery, searchQuery, searchQuery) as any[];

    // Combine and format results
    const combined = [...sentResults, ...receivedResults].map(e => ({
        id: e.id,
        subject: e.subject,
        body: e.body,
        sentAt: e.sentAt,
        category: e.category,
        tag: e.tag,
        senderId: e.senderId,
        senderName: e.senderName,
        senderEmail: e.senderEmail,
    }));
    
    // Deduplicate and sort
    const uniqueEmails = Array.from(new Map(combined.map(e => [e.id, e])).values());
    uniqueEmails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return uniqueEmails as Email[];
}

export async function getContacts(userId: number): Promise<Contact[]> {
    const query = `
        SELECT u.id, u.name, u.email, u.avatar
        FROM contacts c
        JOIN users u ON c.contactUserId = u.id
        WHERE c.ownerId = ?
        ORDER BY u.name
    `;
    return db.prepare(query).all(userId) as Contact[];
}

export async function markEmailAsRead(emailId: number, userId: number) {
    const stmt = db.prepare('UPDATE email_recipients SET read = 1 WHERE emailId = ? AND recipientId = ?');
    stmt.run(emailId, userId);
    revalidatePath('/inbox');
}

export async function archiveEmail(emailId: number, userId: number) {
    const stmt = db.prepare("UPDATE email_recipients SET status = 'archive' WHERE emailId = ? AND recipientId = ?");
    stmt.run(emailId, userId);
    revalidatePath('/inbox');
    revalidatePath('/archive');
}

export async function deleteUserEmail(emailId: number, userId: number, type: 'inbox' | 'archive' | 'sent' | 'search', originalTag?: string) {
    if (type === 'sent') {
        // Soft delete from sender's view
        const stmt = db.prepare("UPDATE emails SET senderStatus = 'deleted' WHERE id = ? AND senderId = ?");
        stmt.run(emailId, userId);
    } else {
        // Soft delete from recipient's view
        const stmt = db.prepare("UPDATE email_recipients SET status = 'deleted' WHERE emailId = ? AND recipientId = ?");
        stmt.run(emailId, userId);
    }
    revalidatePath(`/${originalTag || type}`);
}


export async function addContact(ownerId: number, contactEmail: string) {
    const contactUser = db.prepare('SELECT id FROM users WHERE email = ?').get(contactEmail) as { id: number } | undefined;
    if (!contactUser) {
        throw new Error("User with that email does not exist.");
    }
    const contactUserId = contactUser.id;
    if (ownerId === contactUserId) {
         throw new Error("You cannot add yourself as a contact.");
    }
    try {
        db.prepare('INSERT INTO contacts (ownerId, contactUserId) VALUES (?, ?)').run(ownerId, contactUserId);
    } catch (e: any) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error("This person is already in your contacts.");
        }
        throw e;
    }
    revalidatePath('/contacts');
}

export async function deleteContact(ownerId: number, contactUserId: number) {
    const stmt = db.prepare('DELETE FROM contacts WHERE ownerId = ? AND contactUserId = ?');
    stmt.run(ownerId, contactUserId);
    revalidatePath('/contacts');
}

export async function sendEmail(senderId: number, to: string, subject: string, body: string) {
    const recipient = db.prepare('SELECT id FROM users WHERE email = ?').get(to) as User | undefined;
    if (!recipient) {
        throw new Error(`Recipient email "${to}" not found.`);
    }

    let category: Email['category'] = 'important';
    try {
        const result = await categorizeEmail({ subject, body });
        category = result.category;
    } catch (e) {
        console.error("Failed to categorize sent email", e);
    }

    const tx = db.transaction(() => {
        const emailInsert = db.prepare('INSERT INTO emails (senderId, subject, body, sentAt, category) VALUES (?, ?, ?, ?, ?)')
            .run(senderId, subject, body, new Date().toISOString(), category);
        const emailId = emailInsert.lastInsertRowid;

        db.prepare('INSERT INTO email_recipients (emailId, recipientId) VALUES (?, ?)')
            .run(emailId, recipient.id);
    });

    tx();
    revalidatePath('/sent');
    revalidatePath('/inbox');
}
