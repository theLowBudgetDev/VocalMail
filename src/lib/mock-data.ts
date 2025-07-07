
import type { User, Email } from './data';

export const users: User[] = [
    { id: 1, name: 'Charlie Davis', email: 'charlie.davis@example.com', avatar: 'C' },
    { id: 2, name: 'Alice Williams', email: 'alice.williams@example.com', avatar: 'A' },
    { id: 3, name: 'Frank Miller', email: 'frank.miller@example.com', avatar: 'F' },
    { id: 4, name: 'Grace Lee', email: 'grace.lee@example.com', avatar: 'G' },
    { id: 5, name: 'Bob Johnson', email: 'bob.johnson@example.com', avatar: 'B' },
];

const rawEmails = [
    {
        from: 'alice.williams@example.com',
        to: ['charlie.davis@example.com', 'frank.miller@example.com'],
        subject: 'Project Phoenix Kick-off',
        body: 'Team, excited to kick off Project Phoenix! The initial documents are attached. Please review them before our meeting on Monday. Let\'s make this a success!',
        date: '2024-05-20T10:00:00Z',
        read: false,
        status: 'inbox',
    },
    {
        from: 'charlie.davis@example.com',
        to: ['alice.williams@example.com'],
        subject: 'Re: Project Phoenix Kick-off',
        body: 'Thanks, Alice. The documents look great. I have a few questions about the timeline, which I\'ll bring up on Monday. Looking forward to it.',
        date: '2024-05-20T11:30:00Z',
        read: false,
        status: 'inbox',
    },
    {
        from: 'frank.miller@example.com',
        to: ['alice.williams@example.com'],
        subject: 'Re: Project Phoenix Kick-off',
        body: 'All looks good on my end. I\'ve already started on my assigned tasks.',
        date: '2024-05-20T12:00:00Z',
        read: true,
        status: 'inbox',
    },
    {
        from: 'grace.lee@example.com',
        to: ['alice.williams@example.com'],
        subject: 'Weekly Design Sync',
        body: 'Hi Alice, here are the latest design mockups for your review. Please provide feedback by EOD tomorrow. Thanks!',
        date: '2024-05-19T15:00:00Z',
        read: true,
        status: 'archive',
    },
    {
        from: 'bob.johnson@example.com',
        to: ['frank.miller@example.com', 'charlie.davis@example.com'],
        subject: 'Lunch Plans?',
        body: 'Hey guys, are we still on for lunch this Friday? Let me know!',
        date: '2024-05-21T09:00:00Z',
        read: false,
        status: 'inbox',
    },
    {
        from: 'charlie.davis@example.com',
        to: ['bob.johnson@example.com'],
        subject: 'Re: Lunch Plans?',
        body: 'I\'m in!',
        date: '2024-05-21T09:15:00Z',
        read: false,
        status: 'inbox',
    }
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
        read: email.read,
        status: email.status as 'inbox' | 'archive',
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
