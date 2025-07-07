
import type { User, Email } from './data';

export const users: User[] = [
    { id: 1, name: 'Charlie Davis', email: 'charlie.davis@example.com', avatar: 'https://placehold.co/40x40.png' },
    { id: 2, name: 'Alice Williams', email: 'alice.williams@example.com', avatar: 'https://placehold.co/40x40.png' },
    { id: 3, name: 'Frank Miller', email: 'frank.miller@example.com', avatar: 'https://placehold.co/40x40.png' },
    { id: 4, name: 'Grace Lee', email: 'grace.lee@example.com', avatar: 'https://placehold.co/40x40.png' },
    { id: 5, name: 'Bob Johnson', email: 'bob.johnson@example.com', avatar: 'https://placehold.co/40x40.png' },
];

const rawEmails = [
    {
        from: 'alice.williams@example.com',
        to: ['charlie.davis@example.com', 'frank.miller@example.com'],
        subject: 'Project Update',
        body: 'Hi team, Here is the latest update on the project. We are on track to meet the deadline. Please find the report attached.',
        date: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        read: false,
        status: 'inbox',
    },
    {
        from: 'bob.johnson@example.com',
        to: ['charlie.davis@example.com'],
        subject: 'Lunch tomorrow?',
        body: 'Hey! Are you free for lunch tomorrow? Thinking of trying that new Italian place.',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        status: 'inbox',
    },
    {
        from: 'charlie.davis@example.com',
        to: ['alice.williams@example.com'],
        subject: 'Your invoice',
        body: 'Please find attached your invoice for last month. Let me know if you have any questions.',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        status: 'inbox',
    },
    {
        from: 'grace.lee@example.com',
        to: ['charlie.davis@example.com'],
        subject: 'Re: Design Feedback',
        body: 'Thanks for the feedback! I\'ve updated the designs based on your comments. Let me know what you think.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        status: 'archive',
    },
     {
        from: 'frank.miller@example.com',
        to: ['charlie.davis@example.com'],
        subject: 'Fwd: Company All-Hands',
        body: 'FYI.',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        status: 'inbox',
    },
];

export const emails: Email[] = rawEmails.flatMap((email, index) => {
    const sender = users.find(u => u.email === email.from);
    if (!sender) return [];

    const recipients = users.filter(u => email.to.includes(u.email));

    const recipientEmails = recipients.map(recipient => ({
        id: (index * 100) + recipient.id, // Create a unique ID for each recipient copy
        senderId: sender.id,
        senderName: sender.name,
        senderEmail: sender.email,
        subject: email.subject,
        body: email.body,
        sentAt: email.date,
        read: recipient.email === 'charlie.davis@example.com' ? email.read : true,
        status: recipient.email === 'charlie.davis@example.com' ? (email.status as 'inbox' | 'archive') : 'inbox',
        recipients: [{ name: recipient.name, email: recipient.email }]
    }));
    
    // Also create a 'sent' version for the sender
    const sentEmail = {
        id: (index * 100), // Base ID for the sent item
        senderId: sender.id,
        senderName: sender.name,
        senderEmail: sender.email,
        subject: email.subject,
        body: email.body,
        sentAt: email.date,
        status: 'sent' as const,
        recipients: recipients.map(r => ({ name: r.name, email: r.email }))
    };
    
    return [...recipientEmails, sentEmail];
}).filter(Boolean) as Email[];


// Make everyone a contact of everyone else
export const contacts: { ownerId: number, contactUserId: number }[] = [];
for (const owner of users) {
    for (const contact of users) {
        if (owner.id !== contact.id) {
            contacts.push({ ownerId: owner.id, contactUserId: contact.id });
        }
    }
}
