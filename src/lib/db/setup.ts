import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { users, emails, contacts } from './seed-data';

const dbPath = path.resolve('vocalmail.db');

// For development, we can simplify by deleting the DB file on each setup
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const createTables = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ownerId INTEGER NOT NULL,
        contactUserId INTEGER NOT NULL,
        FOREIGN KEY (ownerId) REFERENCES users(id),
        FOREIGN KEY (contactUserId) REFERENCES users(id),
        UNIQUE(ownerId, contactUserId)
    );

    CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        sentAt TEXT NOT NULL,
        senderStatus TEXT NOT NULL DEFAULT 'sent', -- 'sent' or 'deleted'
        category TEXT NOT NULL,
        FOREIGN KEY (senderId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS email_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        emailId INTEGER NOT NULL,
        recipientId INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'inbox', -- 'inbox', 'archive', 'deleted'
        read INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
        FOREIGN KEY (emailId) REFERENCES emails(id) ON DELETE CASCADE,
        FOREIGN KEY (recipientId) REFERENCES users(id)
    );
`;

db.exec(createTables);
console.log('Tables created successfully.');

const insertUser = db.prepare('INSERT INTO users (name, email, avatar) VALUES (?, ?, ?)');
for (const user of users) {
    insertUser.run(user.name, user.email, user.avatar);
}
console.log('Users seeded successfully.');

const getUserId = (email: string) => {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number };
    return user.id;
};

const insertContact = db.prepare('INSERT INTO contacts (ownerId, contactUserId) VALUES (?, ?)');
for (const contact of contacts) {
    const ownerId = getUserId(contact.ownerEmail);
    const contactUserId = getUserId(contact.contactUserEmail);
    if (ownerId && contactUserId) {
        insertContact.run(ownerId, contactUserId);
    }
}
console.log('Contacts seeded successfully.');

const insertEmail = db.prepare('INSERT INTO emails (senderId, subject, body, sentAt, category) VALUES (?, ?, ?, ?, ?)');
const insertRecipient = db.prepare('INSERT INTO email_recipients (emailId, recipientId, status, read) VALUES (?, ?, ?, ?)');

for (const email of emails) {
    const senderId = getUserId(email.from);
    if (!senderId) continue;

    const emailResult = insertEmail.run(senderId, email.subject, email.body, email.date, email.category);
    const emailId = emailResult.lastInsertRowid as number;
    
    for (const recipientEmail of email.to) {
        const recipientId = getUserId(recipientEmail);
        if(recipientId) {
            insertRecipient.run(emailId, recipientId, email.tag, email.read ? 1 : 0);
        }
    }
}
console.log('Emails seeded successfully.');

db.close();
console.log('Database setup complete.');

// This is just to satisfy the module system, the script's purpose is its side effects.
export {};
