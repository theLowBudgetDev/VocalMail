
'use server';

import { revalidatePath } from 'next/cache';
import { PrismaClient } from '@prisma/client';
import { cache } from 'react';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

// --- AUTH ACTIONS (MOCKED) ---

export const getLoggedInUser = cache(async () => {
    // In this authentication-free version, we always return a default user.
    // We'll use Charlie Davis, who is one of the seeded users.
    try {
        const user = await prisma.user.findFirst({
            where: { email: 'charlie.davis@example.com' },
        });
        if (!user) {
            // This might happen if the seed script hasn't run or if Charlie is deleted.
            // As a fallback, find any user.
            return await prisma.user.findFirst();
        }
        return user;
    } catch (error) {
        console.error("Database query failed:", error);
        // Instead of throwing an error, return null. The UI will handle this.
        return null;
    }
});

// --- DATA READ ACTIONS ---

export const getUsers = cache(async () => {
    return prisma.user.findMany();
});

function toEmailViewModel(dbEmail: any, userId: number) {
     const isSender = dbEmail.senderId === userId;
     const recipientInfo = dbEmail.recipients.find((r: any) => r.recipientId === userId);
     
     let status = 'inbox';
     if (isSender) {
        status = dbEmail.senderStatus;
     } else if (recipientInfo) {
        status = recipientInfo.status;
     }

     if (status === 'deleted') return null;

     if (isSender) {
        return {
            id: dbEmail.id,
            senderId: dbEmail.senderId,
            senderName: dbEmail.sender.name,
            senderEmail: dbEmail.sender.email,
            subject: dbEmail.subject,
            body: dbEmail.body,
            sentAt: dbEmail.sentAt.toISOString(),
            status: 'sent',
            recipients: dbEmail.recipients.map((r: any) => ({
                name: r.recipient.name,
                email: r.recipient.email,
            })),
        };
     } else {
         return {
            id: dbEmail.id,
            senderId: dbEmail.senderId,
            senderName: dbEmail.sender.name,
            senderEmail: dbEmail.sender.email,
            subject: dbEmail.subject,
            body: dbEmail.body,
            sentAt: dbEmail.sentAt.toISOString(),
            read: recipientInfo?.read || false,
            status: recipientInfo?.status || 'inbox',
            recipients: [{ name: recipientInfo.recipient.name, email: recipientInfo.recipient.email}],
        };
     }
}

export async function getInboxEmails(userId: number) {
    const userEmails = await prisma.email.findMany({
        where: {
            recipients: {
                some: {
                    recipientId: userId,
                    status: 'inbox',
                },
            },
        },
        include: {
            sender: true,
            recipients: {
                include: {
                    recipient: true,
                },
            },
        },
        orderBy: {
            sentAt: 'desc',
        },
    });

    return userEmails.map(email => toEmailViewModel(email, userId)).filter(Boolean);
}

export async function getArchivedEmails(userId: number) {
    const userEmails = await prisma.email.findMany({
        where: {
            recipients: {
                some: {
                    recipientId: userId,
                    status: 'archive',
                },
            },
        },
        include: {
            sender: true,
            recipients: {
                include: {
                    recipient: true,
                },
            },
        },
        orderBy: {
            sentAt: 'desc',
        },
    });
     return userEmails.map(email => toEmailViewModel(email, userId)).filter(Boolean);
}

export async function getSentEmails(userId: number) {
    const sentEmails = await prisma.email.findMany({
        where: {
            senderId: userId,
            senderStatus: 'sent',
        },
        include: {
            sender: true,
            recipients: {
                include: {
                    recipient: true,
                },
            },
        },
        orderBy: {
            sentAt: 'desc',
        },
    });
     return sentEmails.map(email => toEmailViewModel(email, userId)).filter(Boolean);
}

export async function searchEmails(userId: number, searchTerm: string) {
    const lowercasedTerm = searchTerm.toLowerCase();

    const results = await prisma.email.findMany({
        where: {
            OR: [
                { senderId: userId },
                { recipients: { some: { recipientId: userId } } },
            ],
            AND: [
                {
                    OR: [
                        { subject: { contains: lowercasedTerm } },
                        { body: { contains: lowercasedTerm } },
                        { sender: { name: { contains: lowercasedTerm } } },
                    ]
                },
                {
                    NOT: [
                        { senderStatus: 'deleted' },
                        { recipients: { some: { status: 'deleted' } } }
                    ]
                }
            ]
        },
        include: {
            sender: true,
            recipients: { include: { recipient: true } },
        },
        orderBy: { sentAt: 'desc' },
    });

     return results.map(email => toEmailViewModel(email, userId)).filter(Boolean);
}


export async function getContacts(userId: number) {
    const contacts = await prisma.contact.findMany({
        where: { ownerId: userId },
        include: { contactUser: true },
        orderBy: { contactUser: { name: 'asc' } },
    });

    return contacts.map(c => ({...c.contactUser}));
}

// --- DATA WRITE ACTIONS ---

export async function markEmailAsRead(emailId: number, userId: number) {
    await prisma.emailRecipient.update({
        where: { emailId_recipientId: { emailId, recipientId: userId } },
        data: { read: true },
    });
    revalidatePath('/inbox');
}

export async function archiveEmail(emailId: number, userId: number) {
    await prisma.emailRecipient.update({
        where: { emailId_recipientId: { emailId, recipientId: userId } },
        data: { status: 'archive' },
    });
    revalidatePath('/inbox');
    revalidatePath('/archive');
}

export async function unarchiveEmail(emailId: number, userId: number) {
    await prisma.emailRecipient.update({
        where: { emailId_recipientId: { emailId, recipientId: userId } },
        data: { status: 'inbox' },
    });
    revalidatePath('/inbox');
    revalidatePath('/archive');
}

export async function deleteUserEmail(emailId: number, userId: number, type: 'inbox' | 'archive' | 'sent' | 'search', originalStatus?: string) {
    const email = await prisma.email.findUnique({
        where: { id: emailId },
        include: { recipients: true },
    });

    if (!email) return;

    if (email.senderId === userId) {
        // It's a sent email
        await prisma.email.update({
            where: { id: emailId },
            data: { senderStatus: 'deleted' },
        });
    } else {
        // It's a received email
        await prisma.emailRecipient.update({
            where: { emailId_recipientId: { emailId, recipientId: userId } },
            data: { status: 'deleted' },
        });
    }

    revalidatePath('/inbox');
    revalidatePath('/archive');
    revalidatePath('/sent');
    revalidatePath('/search');
}


export async function addContact(ownerId: number, contactEmail: string) {
    const contactUser = await prisma.user.findUnique({ where: { email: contactEmail } });
    if (!contactUser) {
        throw new Error("User with that email does not exist.");
    }
    if (ownerId === contactUser.id) {
         throw new Error("You cannot add yourself as a contact.");
    }
    const exists = await prisma.contact.findUnique({
        where: { ownerId_contactUserId: { ownerId, contactUserId: contactUser.id } },
    });
    if (exists) {
        throw new Error("This person is already in your contacts.");
    }

    await prisma.contact.create({ data: { ownerId, contactUserId: contactUser.id } });
    revalidatePath('/contacts');
}

export async function deleteContact(ownerId: number, contactUserId: number) {
    await prisma.contact.delete({
        where: { ownerId_contactUserId: { ownerId, contactUserId } }
    });
    revalidatePath('/contacts');
}

export async function sendEmail(senderId: number, to: string, subject: string, body: string) {
    const recipient = await prisma.user.findUnique({ where: { email: to } });
    if (!recipient) {
        throw new Error(`Recipient email "${to}" not found.`);
    }

    await prisma.email.create({
        data: {
            senderId,
            subject,
            body,
            senderStatus: 'sent',
            recipients: {
                create: {
                    recipientId: recipient.id,
                    status: 'inbox',
                    read: false,
                },
            },
        },
    });

    revalidatePath('/sent');
    revalidatePath('/inbox'); // Also revalidate inbox for the recipient
}
