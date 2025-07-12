import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const usersToSeed = [
    { name: 'Charlie Davis', email: 'charlie.davis@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Alice Williams', email: 'alice.williams@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Frank Miller', email: 'frank.miller@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Grace Lee', email: 'grace.lee@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Bob Johnson', email: 'bob.johnson@example.com', avatar: 'https://placehold.co/40x40.png' },
];

const emailsToSeed = [
  {
    from: 'alice.williams@example.com',
    to: ['charlie.davis@example.com', 'frank.miller@example.com'],
    subject: 'Project Phoenix Kick-off',
    body: 'Team, excited to kick off Project Phoenix! The initial documents are attached. Please review them before our meeting on Monday. Let\'s make this a success!',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    readBy: [],
    statusFor: {},
  },
  {
    from: 'grace.lee@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Weekly Design Sync',
    body: 'Hi Charlie, here are the latest design mockups for your review. Please provide feedback by EOD tomorrow. Thanks!',
    date: new Date(Date.now() - 28 * 60 * 60 * 1000), // 28 hours ago
    readBy: ['charlie.davis@example.com'],
    statusFor: { 'charlie.davis@example.com': 'archive' },
  },
  {
    from: 'bob.johnson@example.com',
    to: ['frank.miller@example.com', 'charlie.davis@example.com'],
    subject: 'Lunch Plans?',
    body: 'Hey guys, are we still on for lunch this Friday? Let me know!',
    date: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    readBy: [],
    statusFor: {},
  },
   {
    from: 'charlie.davis@example.com',
    to: ['alice.williams@example.com'],
    subject: 'Re: Project Phoenix Kick-off',
    body: 'Thanks, Alice. The documents look great. I have a few questions about the timeline, which I\'ll bring up on Monday. Looking forward to it.',
    date: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
    readBy: [],
    statusFor: {},
  },
   {
    from: 'frank.miller@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Fwd: Company All-Hands',
    body: 'FYI.',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    readBy: ['charlie.davis@example.com'],
    statusFor: {},
  },
  {
    from: 'charlie.davis@example.com',
    to: ['bob.johnson@example.com'],
    subject: 'Re: Lunch Plans?',
    body: 'I\'m in!',
    date: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
    readBy: ['bob.johnson@example.com'],
    statusFor: {},
  }
];


async function main() {
    console.log('Start seeding...');

    // Seed users
    for (const u of usersToSeed) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: u,
        });
    }
    console.log('Users seeded.');

    const allUsers = await prisma.user.findMany();

    // Seed contacts (everyone is a contact of everyone else)
    for (const owner of allUsers) {
        for (const contact of allUsers) {
            if (owner.id !== contact.id) {
                await prisma.contact.upsert({
                    where: { ownerId_contactUserId: { ownerId: owner.id, contactUserId: contact.id } },
                    update: {},
                    create: {
                        ownerId: owner.id,
                        contactUserId: contact.id,
                    },
                });
            }
        }
    }
    console.log('Contacts seeded.');
    
    // Seed emails
    for (const e of emailsToSeed) {
        const sender = allUsers.find(u => u.email === e.from);
        if (!sender) continue;

        const createdEmail = await prisma.email.create({
            data: {
                senderId: sender.id,
                subject: e.subject,
                body: e.body,
                sentAt: e.date,
            },
        });

        const recipients = allUsers.filter(u => e.to.includes(u.email));
        for (const recipient of recipients) {
            await prisma.emailRecipient.create({
                data: {
                    emailId: createdEmail.id,
                    recipientId: recipient.id,
                    read: e.readBy.includes(recipient.email),
                    status: (e.statusFor as any)[recipient.email] || 'inbox',
                },
            });
        }
    }
    console.log('Emails seeded.');

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
