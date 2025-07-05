
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { users, emails } from './seed-data';

const dbPath = path.resolve('vocalmail.db');

// This script will only run if the database file does not exist.
if (fs.existsSync(dbPath)) {
    console.log('Database already exists, skipping seeding.');
} else {
    console.log('Database not found, creating and seeding a new one...');
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const createTables = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            avatar TEXT
        );

        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ownerId INTEGER NOT NULL,
            contactUserId INTEGER NOT NULL,
            FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (contactUserId) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(ownerId, contactUserId)
        );

        CREATE TABLE IF NOT EXISTS emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            senderId INTEGER NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            sentAt TEXT NOT NULL,
            senderStatus TEXT NOT NULL DEFAULT 'sent', -- 'sent' or 'deleted'
            FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS email_recipients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emailId INTEGER NOT NULL,
            recipientId INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'inbox', -- 'inbox', 'archive', 'deleted'
            read INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
            FOREIGN KEY (emailId) REFERENCES emails(id) ON DELETE CASCADE,
            FOREIGN KEY (recipientId) REFERENCES users(id) ON DELETE CASCADE
        );
    `;

    db.exec(createTables);
    console.log('Tables created successfully.');

    // Seed Users
    const insertUser = db.prepare('INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)');
    for (const user of users) {
        insertUser.run(user.name, user.email, user.password, user.avatar);
    }
    console.log('Users seeded successfully.');

    // Seed Contacts dynamically
    const allUserIds = db.prepare('SELECT id FROM users').all() as { id: number }[];
    const insertContact = db.prepare('INSERT INTO contacts (ownerId, contactUserId) VALUES (?, ?)');
    const txContacts = db.transaction(() => {
        for (const owner of allUserIds) {
            for (const contact of allUserIds) {
                if (owner.id !== contact.id) {
                    insertContact.run(owner.id, contact.id);
                }
            }
        }
    });
    txContacts();
    console.log('Contacts seeded successfully.');

    // Seed Emails
    const getUserId = (email: string) => {
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
        return user?.id;
    };

    const insertEmail = db.prepare('INSERT INTO emails (senderId, subject, body, sentAt) VALUES (?, ?, ?, ?)');
    const insertRecipient = db.prepare('INSERT INTO email_recipients (emailId, recipientId, status, read) VALUES (?, ?, ?, ?)');

    const txEmails = db.transaction(() => {
        for (const email of emails) {
            const senderId = getUserId(email.from);
            if (!senderId) continue;

            const emailResult = insertEmail.run(senderId, email.subject, email.body, email.date);
            const emailId = emailResult.lastInsertRowid as number;
            
            for (const recipientEmail of email.to) {
                const recipientId = getUserId(recipientEmail);
                if (recipientId) {
                    insertRecipient.run(emailId, recipientId, email.status || 'inbox', (email.read ? 1 : 0));
                }
            }
        }
    });
    txEmails();
    console.log('Emails seeded successfully.');

    db.close();
    console.log('Database setup complete.');
}

// This is just to satisfy the module system, the script's purpose is its side effects.
export {};
