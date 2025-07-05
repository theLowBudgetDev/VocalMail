// All users have the password "password" for simplicity
export const users = [
    { id: 1, name: 'Charlie Davis', email: 'charlie.davis@example.com', avatar: 'C' },
    { id: 2, name: 'Alice Williams', email: 'alice.williams@example.com', avatar: 'A' },
    { id: 3, name: 'Frank Miller', email: 'frank.miller@example.com', avatar: 'F' },
    { id: 4, name: 'Grace Lee', email: 'grace.lee@example.com', avatar: 'G' },
    { id: 5, name: 'Bob Johnson', email: 'bob.johnson@example.com', avatar: 'B' },
];

// Contacts are defined by email for easier lookup during seeding
export const contacts = [
    // Charlie's Contacts
    { ownerEmail: 'charlie.davis@example.com', contactUserEmail: 'alice.williams@example.com' },
    { ownerEmail: 'charlie.davis@example.com', contactUserEmail: 'bob.johnson@example.com' },

    // Alice's Contacts
    { ownerEmail: 'alice.williams@example.com', contactUserEmail: 'charlie.davis@example.com' },
    { ownerEmail: 'alice.williams@example.com', contactUserEmail: 'frank.miller@example.com' },
    { ownerEmail: 'alice.williams@example.com', contactUserEmail: 'grace.lee@example.com' },

    // Frank's Contacts
    { ownerEmail: 'frank.miller@example.com', contactUserEmail: 'alice.williams@example.com' },
    { ownerEmail: 'frank.miller@example.com', contactUserEmail: 'bob.johnson@example.com' },

    // Grace's Contacts
    { ownerEmail: 'grace.lee@example.com', contactUserEmail: 'alice.williams@example.com' },
    
    // Bob has no contacts
];

// The `to` array contains emails of recipients.
// `tag` refers to the initial state in the recipient's inbox.
export const emails = [
    {
        from: 'alice.williams@example.com',
        to: ['charlie.davis@example.com', 'frank.miller@example.com'],
        subject: 'Project Phoenix Kick-off',
        body: 'Team, excited to kick off Project Phoenix! The initial documents are attached. Please review them before our meeting on Monday. Let\'s make this a success!',
        date: '2024-05-20T10:00:00Z',
        read: false,
        tag: 'inbox',
        category: 'important',
    },
    {
        from: 'charlie.davis@example.com',
        to: ['alice.williams@example.com'],
        subject: 'Re: Project Phoenix Kick-off',
        body: 'Thanks, Alice. The documents look great. I have a few questions about the timeline, which I\'ll bring up on Monday. Looking forward to it.',
        date: '2024-05-20T11:30:00Z',
        read: false,
        tag: 'inbox',
        category: 'important',
    },
    {
        from: 'frank.miller@example.com',
        to: ['alice.williams@example.com'],
        subject: 'Re: Project Phoenix Kick-off',
        body: 'All looks good on my end. I\'ve already started on my assigned tasks.',
        date: '2024-05-20T12:00:00Z',
        read: true,
        tag: 'inbox',
        category: 'important',
    },
    {
        from: 'grace.lee@example.com',
        to: ['alice.williams@example.com'],
        subject: 'Weekly Design Sync',
        body: 'Hi Alice, here are the latest design mockups for your review. Please provide feedback by EOD tomorrow. Thanks!',
        date: '2024-05-19T15:00:00Z',
        read: true,
        tag: 'archive',
        category: 'important',
    },
    {
        from: 'bob.johnson@example.com',
        to: ['frank.miller@example.com', 'charlie.davis@example.com'],
        subject: 'Lunch Plans?',
        body: 'Hey guys, are we still on for lunch this Friday? Let me know!',
        date: '2024-05-21T09:00:00Z',
        read: false,
        tag: 'inbox',
        category: 'personal',
    },
    {
        from: 'charlie.davis@example.com',
        to: ['bob.johnson@example.com'],
        subject: 'Re: Lunch Plans?',
        body: 'I\'m in!',
        date: '2024-05-21T09:15:00Z',
        read: false,
        tag: 'inbox',
        category: 'personal',
    }
];
