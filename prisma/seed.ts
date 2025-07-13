
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const usersToSeed = [
    { name: 'Charlie Davis', email: 'charlie.davis@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Alice Williams', email: 'alice.williams@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Frank Miller', email: 'frank.miller@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Grace Lee', email: 'grace.lee@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Bob Johnson', email: 'bob.johnson@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Diana Prince', email: 'diana.prince@example.com', avatar: 'https://placehold.co/40x40.png' },
    { name: 'Eve Adams', email: 'eve.adams@example.com', avatar: 'https://placehold.co/40x40.png' },
];

const emailsToSeed = [
  // --- Inbox for Charlie Davis (15+ emails) ---
  {
    from: 'alice.williams@example.com',
    to: ['charlie.davis@example.com', 'frank.miller@example.com'],
    subject: 'Project Phoenix Kick-off',
    body: 'Team, I am thrilled to officially kick off Project Phoenix! This project represents a major step forward for our department, and I am confident that with our combined expertise, we can achieve outstanding results. The initial project brief and timeline are attached. Please review them thoroughly before our planning session on Monday morning. Your feedback and questions are highly encouraged as we embark on this exciting journey together. Let\'s make this a monumental success!',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    readBy: [],
    statusFor: {},
  },
  {
    from: 'bob.johnson@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Your Weekly Tech Digest',
    body: 'Hi Charlie, here’s your weekly roundup of the most interesting articles in the tech world. This week, we cover the latest advancements in AI-driven development tools, a deep dive into the ethics of machine learning models, and a look at the future of quantum computing. I think you\'ll find the piece on sustainable software engineering particularly insightful. Let me know if any of these topics spark ideas for our ongoing projects. Enjoy the read!',
    date: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    readBy: [],
    statusFor: {},
  },
  {
    from: 'diana.prince@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Quick question about the Q3 report',
    body: 'Hello Charlie, I hope you\'re having a productive week. I am currently finalizing the Q3 financial report and had a quick question regarding the data you provided for the marketing expenses section. Could you please clarify if the figures include the projected ad spend for the last week of September? The numbers seem slightly lower than our initial forecast, and I want to ensure everything is accurate before submission. Your prompt response would be greatly appreciated. Thanks a bunch!',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    readBy: ['charlie.davis@example.com'],
    statusFor: {},
  },
  {
    from: 'grace.lee@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Feedback on the new UI mockups',
    body: 'Hi Charlie, attached you will find the latest set of UI mockups for the new user dashboard. We have incorporated the feedback from the last review session, focusing on a cleaner layout and more intuitive navigation. Please take a look and let us know your thoughts. We are particularly interested in your opinion on the new color scheme and the placement of the main call-to-action buttons. Your feedback is crucial for us to proceed to the next stage of development.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    readBy: [],
    statusFor: {},
  },
  {
    from: 'frank.miller@example.com',
    to: ['charlie.davis@example.com', 'alice.williams@example.com'],
    subject: 'Brainstorming session for the new campaign',
    body: 'Hi both, I\'ve scheduled a brainstorming session for this Thursday at 2 PM to discuss ideas for the upcoming "Innovate & Elevate" marketing campaign. The goal is to generate a wide range of creative concepts that we can refine later. Please come prepared to share your wildest and most ambitious ideas – no thought is too small or too out-there at this stage. I\'ve booked the main conference room. Looking forward to a productive and creative meeting with you both!',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    readBy: ['charlie.davis@example.com'],
    statusFor: {},
  },
   {
    from: 'eve.adams@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Your subscription is expiring soon',
    body: 'Dear Charlie, this is a friendly reminder that your premium subscription to "CodeStream Pro" is set to expire in 7 days. To ensure uninterrupted access to all our advanced features, including real-time collaboration and AI-powered code suggestions, please renew your subscription at your earliest convenience. You can renew by visiting your account settings page. We value your membership and look forward to continuing to support your development workflow. Thank you for being a loyal customer!',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    readBy: [],
    statusFor: {},
  },
  {
    from: 'bob.johnson@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Following up on our conversation',
    body: 'Hi Charlie, it was great chatting with you earlier today. As we discussed, I\'ve attached the market analysis report we mentioned. It provides a detailed overview of current industry trends and competitor strategies, which I believe will be very valuable for our strategic planning. Please take some time to review it. I am keen to hear your thoughts and discuss how we can leverage these insights in our next quarterly meeting. Let\'s connect again next week.',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'alice.williams@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Important: Security Update Required',
    body: 'Hi Charlie, this is an automated message from IT. To enhance our security measures, we are requiring all employees to update their passwords by the end of this week. Your new password must be at least 12 characters long and include a mix of uppercase letters, lowercase letters, numbers, and special symbols. Please visit the internal password portal to make this change. Failure to comply will result in a temporary suspension of your network access. Thank you for your cooperation.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    readBy: ['charlie.davis@example.com'],
    statusFor: {},
  },
  {
    from: 'grace.lee@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Holiday Office Closure Notice',
    body: 'Hello Team, this is a reminder that our offices will be closed next Monday in observance of the public holiday. Normal business operations will resume on Tuesday. Please ensure all your time-sensitive tasks are completed or handed over before the long weekend. We hope you enjoy the extra day off to rest and recharge with your loved ones. Let\'s come back energized and ready for a productive week ahead. Best wishes for a wonderful and safe holiday!',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'diana.prince@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Your flight details for the conference',
    body: 'Hi Charlie, please find your flight and hotel booking confirmations for the upcoming "Future of Web" conference in San Francisco. Your flight departs next Wednesday at 8:00 AM, and you are booked at the Grand Hyatt near the convention center. I have also attached a schedule of the keynote sessions you might find interesting. Please double-check all the details and let me know if you need any adjustments. Have a safe and productive trip!',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'frank.miller@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Lunch next week?',
    body: 'Hey Charlie, it feels like it has been a while since we last caught up properly. Would you be free to grab lunch sometime next week? My schedule is pretty flexible, so just let me know which day works best for you. There\'s a new Italian place that opened up downtown that I\'ve been wanting to try out. It would be great to hear what you\'ve been up to outside of work. Let me know what you think!',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    readBy: ['charlie.davis@example.com'],
    statusFor: {},
  },
  {
    from: 'eve.adams@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Your Order has Shipped!',
    body: 'Great news, Charlie! Your recent order (#G45-2B341) from "Gadget Hub" has been shipped and is on its way to you. The estimated delivery date is this Friday. You can track your package using the tracking number provided in this email. We are so excited for you to receive your new items and hope you enjoy them. Thank you for shopping with us, and we look forward to seeing you again soon!',
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'alice.williams@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Post-mortem for Project Delta',
    body: 'Hi Charlie, I am organizing the post-mortem meeting for Project Delta, which concluded last month. The session is scheduled for this Friday at 11 AM. The purpose of this meeting is to discuss what went well, what challenges we faced, and what we can learn for future projects. Please come prepared to share your honest and constructive feedback. Your perspective is highly valuable to the team\'s continuous improvement process. A calendar invite will follow shortly. Thank you!',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'grace.lee@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Invitation to team-building event',
    body: 'Hi everyone, you are cordially invited to our quarterly team-building event! This quarter, we\'re going bowling! It will be a fun evening of friendly competition, food, and great company. The event will be held next Thursday evening at "Super Strikes Bowling Alley." Please RSVP by the end of this week so we can finalize the booking and food arrangements. We can\'t wait to see you all there and have some fun outside of the office environment!',
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'bob.johnson@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'New article publication',
    body: 'Hello Charlie, I wanted to share some exciting news with you. My latest article, "The Unstructured Data Revolution," has just been published in "Modern Data Journal." It explores how new technologies are enabling us to extract powerful insights from unstructured data sources like text and images. Given your work in this area, I thought you might find it an interesting read. I\'ve attached a PDF copy for your convenience. I would love to hear your thoughts when you get a moment.',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  
  // --- Archive for Charlie Davis (5 emails) ---
  {
    from: 'grace.lee@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'RE: Weekly Design Sync',
    body: 'Hi Charlie, thanks for the quick feedback on the latest design mockups. Your suggestions were very helpful, and we have already started implementing them. The proposed changes to the user onboarding flow, in particular, were brilliant. We believe this will significantly improve the new user experience. We will send over the revised versions for a final check by the end of the week. No further action is needed from you at this time. Thanks again for your valuable input!',
    date: new Date(Date.now() - 28 * 60 * 60 * 1000), // 28 hours ago
    readBy: ['charlie.davis@example.com'],
    statusFor: { 'charlie.davis@example.com': 'archive' },
  },
  {
    from: 'frank.miller@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Fwd: Company All-Hands Deck',
    body: 'FYI: Here is the slide deck from yesterday\'s company all-hands meeting, as requested. It covers the financial performance for the last quarter and outlines our strategic priorities for the next six months. The CEO\'s vision for international expansion is particularly interesting. I thought you would want to have a copy for your records and for reference in our upcoming team meetings. Let me know if you have any trouble accessing the file. Cheers, Frank.',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    readBy: ['charlie.davis@example.com'],
    statusFor: { 'charlie.davis@example.com': 'archive' },
  },
  {
    from: 'diana.prince@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Your Expense Report Has Been Approved',
    body: 'Hello Charlie, this is an automated notification to inform you that your recent expense report, submitted for the "Future of Web" conference, has been reviewed and approved. The total reimbursement amount will be deposited into your bank account within the next 3-5 business days. You can view the details of the approved report in the employee portal. No further action is required from your side. Thank you for your timely submission and for representing our company at the event.',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    readBy: ['charlie.davis@example.com'],
    statusFor: { 'charlie.davis@example.com': 'archive' },
  },
  {
    from: 'eve.adams@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Welcome to the "Agile Thinkers" Newsletter',
    body: 'Hi Charlie, thank you for subscribing to the "Agile Thinkers" weekly newsletter! We are excited to have you as part of our community. Every Tuesday, you will receive a curated list of articles, case studies, and practical tips on agile methodologies, project management, and team collaboration. Our goal is to provide you with valuable content that you can apply directly to your work. We hope you enjoy our first issue, which is attached. Welcome aboard!',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    readBy: ['charlie.davis@example.com'],
    statusFor: { 'charlie.davis@example.com': 'archive' },
  },
  {
    from: 'bob.johnson@example.com',
    to: ['charlie.davis@example.com'],
    subject: 'Minutes from the Q3 Planning Meeting',
    body: 'Hi team, please find attached the meeting minutes from our Q3 planning session held last week. The document summarizes the key discussion points, decisions made, and the action items assigned to each team member. Please review the action items listed under your name and ensure they are integrated into your work plan. Let\'s work together to make this quarter our most successful one yet. Thank you all for your active participation and valuable contributions during the meeting.',
    date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
    readBy: ['charlie.davis@example.com'],
    statusFor: { 'charlie.davis@example.com': 'archive' },
  },

  // --- Sent by Charlie Davis (7 emails) ---
  {
    from: 'charlie.davis@example.com',
    to: ['alice.williams@example.com'],
    subject: 'Re: Project Phoenix Kick-off',
    body: 'Thanks, Alice. The documents look comprehensive and provide a great starting point for the project. I have a few initial questions regarding the proposed timeline and budget allocation, which I will bring up during our meeting on Monday. I\'m particularly interested in discussing the resource plan for the development phase. Overall, this looks very promising, and I am excited to get started. Looking forward to our discussion and a successful project launch.',
    date: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
    readBy: [],
    statusFor: {},
  },
  {
    from: 'charlie.davis@example.com',
    to: ['bob.johnson@example.com', 'frank.miller@example.com'],
    subject: 'Re: Lunch Plans?',
    body: 'I\'m in for lunch on Friday! That new Italian place sounds like a great idea, Frank. What time were you thinking? I should be free anytime after 12:30 PM. It will be good to catch up and take a break from the project work. Bob, I hope you can make it as well. Let me know the final plan once you have decided on a time. Looking forward to it, guys!',
    date: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
    readBy: ['bob.johnson@example.com'],
    statusFor: {},
  },
  {
    from: 'charlie.davis@example.com',
    to: ['grace.lee@example.com'],
    subject: 'My feedback on the new UI mockups',
    body: 'Hi Grace, thank you for sending over the new UI mockups. They look fantastic! I love the modern feel and the improved navigation flow. The new color palette is very professional and aligns well with our brand identity. My only suggestion would be to consider increasing the font size for the helper text slightly for better accessibility. Other than that, I think this is a huge improvement. Great work by you and your team on this!',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'charlie.davis@example.com',
    to: ['diana.prince@example.com'],
    subject: 'Re: Quick question about the Q3 report',
    body: 'Hi Diana, thanks for reaching out for clarification. You are correct, the figures I sent over did not include the projected ad spend for the final week of September. I have just updated the spreadsheet with the latest projections and have attached the revised version to this email. Apologies for the oversight. Please let me know if you need anything else from my side to complete the report. Happy to help in any way I can.',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'charlie.davis@example.com',
    to: ['eve.adams@example.com'],
    subject: 'Inquiry about bulk licensing',
    body: 'Hello, my team and I are very impressed with your "CodeStream Pro" tool, and we are interested in purchasing licenses for our entire development department of about 25 developers. Could you please provide me with information on your enterprise or bulk licensing options? We would be looking for a single annual subscription that covers all our developers. Any information on pricing, support, and deployment options would be greatly appreciated. Thank you for your time and assistance.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
   {
    from: 'charlie.davis@example.com',
    to: ['alice.williams@example.com', 'frank.miller@example.com', 'grace.lee@example.com'],
    subject: 'Summary of our weekly sync',
    body: 'Hi Team, here is a quick summary of our weekly sync meeting today. We aligned on the key priorities for the upcoming sprint, with a focus on finalizing the user authentication module. Grace, the design team will provide the final assets by tomorrow. Frank, your team will take the lead on the backend integration. I will oversee the overall progress and help resolve any blockers. Let\'s maintain this momentum and aim to complete the module by the end of next week. Great job, everyone!',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
  {
    from: 'charlie.davis@example.com',
    to: ['bob.johnson@example.com'],
    subject: 'Thanks for the article!',
    body: 'Hi Bob, thanks so much for sharing your new article on unstructured data. I just finished reading it, and it was absolutely fascinating. The case studies you included were particularly insightful and gave me several new ideas for how we could approach our own data analysis challenges. You have a real talent for making complex topics accessible and engaging. I would love to chat more about it over coffee sometime next week if you are free. Congratulations again on the publication!',
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    readBy: [],
    statusFor: {},
  },
];


async function main() {
    console.log('Start seeding...');

    // Clean up existing data
    await prisma.emailRecipient.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Existing data cleared.');

    // Seed users
    for (const u of usersToSeed) {
        await prisma.user.create({
            data: u,
        });
    }
    console.log('Users seeded.');

    const allUsers = await prisma.user.findMany();
    const userMap = new Map(allUsers.map(u => [u.email, u]));

    // Seed contacts (everyone is a contact of everyone else)
    for (const owner of allUsers) {
        for (const contact of allUsers) {
            if (owner.id !== contact.id) {
                await prisma.contact.create({
                    data: {
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
        const sender = userMap.get(e.from);
        if (!sender) {
            console.warn(`Sender not found: ${e.from}`);
            continue;
        }

        const createdEmail = await prisma.email.create({
            data: {
                senderId: sender.id,
                subject: e.subject,
                body: e.body,
                sentAt: e.date,
                senderStatus: 'sent', // Set default status for sender
            },
        });

        const recipients = e.to.map(email => userMap.get(email)).filter(Boolean) as {id: number, email: string}[];
        for (const recipient of recipients) {
            const status = (e.statusFor as any)[recipient.email] || 'inbox';
            const read = e.readBy.includes(recipient.email);
            
            await prisma.emailRecipient.create({
                data: {
                    emailId: createdEmail.id,
                    recipientId: recipient.id,
                    read: read,
                    status: status,
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
