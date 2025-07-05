
'use server';

import { revalidatePath } from 'next/cache';
import { db } from './db';
import type { User, Email, Contact } from './data';
<<<<<<< HEAD
import { categorizeEmail } from '@/ai/flows/email-categorization-flow';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// --- AUTH ACTIONS ---

const SESSION_COOKIE_NAME = 'vocalmail_session';

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return redirect('/login?error=Email and password are required.');
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

    if (!user || user.password !== password) {
         return redirect('/login?error=Invalid email or password.');
    }

    cookies().set(SESSION_COOKIE_NAME, String(user.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });
    
    redirect('/inbox');
}

export async function register(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email || !password) {
        return redirect('/register?error=All fields are required.');
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
        return redirect('/register?error=An account with this email already exists.');
    }

    // Create the new user
    const avatar = name.charAt(0).toUpperCase();
    const newUserResult = db.prepare('INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)')
        .run(name, email, password, avatar);
    
    const newUserId = newUserResult.lastInsertRowid as number;

    // Make all existing users contacts of the new user, and vice versa
    const allUsers = db.prepare('SELECT id FROM users').all() as { id: number }[];
    const insertContact = db.prepare('INSERT INTO contacts (ownerId, contactUserId) VALUES (?, ?)');
    
    const tx = db.transaction(() => {
        for (const user of allUsers) {
            if (user.id !== newUserId) {
                insertContact.run(newUserId, user.id); // New user gets old user
                insertContact.run(user.id, newUserId); // Old user gets new user
            }
        }
    });
    tx();

    // Log the new user in
    cookies().set(SESSION_COOKIE_NAME, String(newUserId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });

    redirect('/inbox');
}


export async function logout() {
    cookies().delete(SESSION_COOKIE_NAME);
    redirect('/login');
}

export async function getLoggedInUser(): Promise<User | null> {
    const userId = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!userId) {
        return null;
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | null;
        return user;
    } catch (error) {
        console.error("Database error fetching logged in user:", error);
        return null;
    }
}


// --- DATA ACTIONS ---
=======
>>>>>>> d9b34e4 (remove the email priority from the system.)

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
        SELECT e.*, s.name as senderName, s.email as senderEmail, 'sent' as status
        FROM emails e
        JOIN users s ON e.senderId = s.id
        WHERE e.senderId = ?
        AND e.senderStatus = 'sent'
        AND (e.subject LIKE ? OR e.body LIKE ?)
    `;
    const sentResults = db.prepare(sentQuery).all(userId, searchQuery, searchQuery) as any[];

    // Search received items
    const receivedQuery = `
        SELECT e.*, s.name as senderName, s.email as senderEmail, er.status as status
        FROM emails e
        JOIN users s ON e.senderId = s.id
        JOIN email_recipients er ON er.emailId = e.id
        WHERE er.recipientId = ?
        AND er.status IN ('inbox', 'archive')
        AND (e.subject LIKE ? OR e.body LIKE ? OR s.name LIKE ?)
    `;
    const receivedResults = db.prepare(receivedQuery).all(userId, searchQuery, searchQuery, searchQuery) as any[];
    
    const combined = [...sentResults, ...receivedResults].map(e => ({
        id: e.id,
        subject: e.subject,
        body: e.body,
        sentAt: e.sentAt,
<<<<<<< HEAD
        category: e.category,
        status: e.status, // Use the status from the query
=======
        tag: e.tag,
>>>>>>> d9b34e4 (remove the email priority from the system.)
        senderId: e.senderId,
        senderName: e.senderName,
        senderEmail: e.senderEmail,
    }));
    
    const uniqueEmails = Array.from(new Map(combined.map(e => [e.id + e.status, e])).values());
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
    // If it's a sent email, we soft delete from the sender's view.
    if (type === 'sent') {
        const stmt = db.prepare("UPDATE emails SET senderStatus = 'deleted' WHERE id = ? AND senderId = ?");
        stmt.run(emailId, userId);
    } 
    // For received emails (inbox, archive), we soft delete from the recipient's view.
    else if (type === 'inbox' || type === 'archive') {
        const stmt = db.prepare("UPDATE email_recipients SET status = 'deleted' WHERE emailId = ? AND recipientId = ?");
        stmt.run(emailId, userId);
    }
    // For search, we need to know if the user is the sender or receiver
    else if (type === 'search' && originalTag) {
         if (originalTag === 'sent') {
            const stmt = db.prepare("UPDATE emails SET senderStatus = 'deleted' WHERE id = ? AND senderId = ?");
            stmt.run(emailId, userId);
         } else {
            const stmt = db.prepare("UPDATE email_recipients SET status = 'deleted' WHERE emailId = ? AND recipientId = ?");
            stmt.run(emailId, userId);
         }
    }
    
    // Revalidate all potentially affected paths
    revalidatePath('/inbox');
    revalidatePath('/archive');
    revalidatePath('/sent');
    revalidatePath('/search');
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

export async function deleteContact(ownerId: number, contactId: number) {
    const stmt = db.prepare('DELETE FROM contacts WHERE ownerId = ? AND contactUserId = ?');
    stmt.run(ownerId, contactId);
    revalidatePath('/contacts');
}

export async function sendEmail(senderId: number, to: string, subject: string, body: string) {
    const recipient = db.prepare('SELECT id FROM users WHERE email = ?').get(to) as User | undefined;
    if (!recipient) {
        throw new Error(`Recipient email "${to}" not found.`);
    }

    const tx = db.transaction(() => {
        const emailInsert = db.prepare('INSERT INTO emails (senderId, subject, body, sentAt) VALUES (?, ?, ?, ?)')
            .run(senderId, subject, body, new Date().toISOString());
        const emailId = emailInsert.lastInsertRowid;

        db.prepare('INSERT INTO email_recipients (emailId, recipientId) VALUES (?, ?)')
            .run(emailId, recipient.id);
    });

    tx();
    revalidatePath('/sent');
    revalidatePath('/inbox');
}
