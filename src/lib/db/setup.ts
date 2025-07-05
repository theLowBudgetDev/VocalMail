
<<<<<<< HEAD
=======
import fs from 'fs';
>>>>>>> f17c8dd (you observe i rolled back again.)
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { users, emails } from './seed-data';

const dbPath = path.resolve('vocalmail.db');
<<<<<<< HEAD
const dbExists = fs.existsSync(dbPath);
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const createTables = `
=======

if (fs.existsSync(dbPath)) {
  console.log('Database already exists. Skipping setup.');
} else {
  console.log('Database not found. Creating and seeding a new one...');
  
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const createTables = `
>>>>>>> f17c8dd (you observe i rolled back again.)
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
        category TEXT NOT NULL,
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

<<<<<<< HEAD
db.exec(createTables);
console.log('Tables created or already exist.');

// Seed the database only if it was just created
if (!dbExists) {
    console.log('New database file created, seeding with initial data...');
    
    const tx = db.transaction(() => {
        const insertUser = db.prepare('INSERT INTO users (name, email, avatar, password) VALUES (?, ?, ?, ?)');
        for (const user of users) {
            insertUser.run(user.name, user.email, user.avatar, user.password);
        }

        const getUserId = (email: string): number | undefined => {
            const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number };
            return user?.id;
        };
        
        // Seed contacts so every user is a contact of every other user
        const allUserIds = db.prepare('SELECT id FROM users').all() as {id: number}[];
        const insertContact = db.prepare('INSERT INTO contacts (ownerId, contactUserId) VALUES (?, ?)');
        for (const owner of allUserIds) {
            for (const contact of allUserIds) {
                if (owner.id !== contact.id) {
                    insertContact.run(owner.id, contact.id);
                }
            }
        }

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
                    insertRecipient.run(emailId, recipientId, email.status, email.read ? 1 : 0);
                }
            }
        }
    });

    tx();
    console.log('Database seeded successfully.');
} else {
    console.log('Database already exists, skipping seeding.');
=======
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
>>>>>>> f17c8dd (you observe i rolled back again.)
}

// This is just to satisfy the module system, the script's purpose is its side effects.
export {};
