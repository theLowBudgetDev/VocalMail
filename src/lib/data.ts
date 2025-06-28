export type Email = {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to?: {
    name: string;
    email: string;
  };
  subject: string;
  body: string;
  date: string;
  read: boolean;
  tag: 'inbox' | 'sent' | 'archive';
  category: EmailCategory['id'];
  priority: number;
};

export type EmailCategory = {
    id: 'urgent' | 'important' | 'promotions' | 'social' | 'updates' | 'personal';
    name: string;
    color: 'destructive' | 'primary' | 'accent' | 'secondary' | 'muted' | 'foreground';
};

export const emailCategories: EmailCategory[] = [
    { id: 'urgent', name: 'Urgent', color: 'destructive' },
    { id: 'important', name: 'Important', color: 'primary' },
    { id: 'personal', name: 'Personal', color: 'accent' },
    { id: 'updates', name: 'Updates', color: 'secondary' },
    { id: 'promotions', name: 'Promotions', color: 'muted' },
    { id: 'social', name: 'Social', color: 'muted' },
];


export type Contact = {
    id: string;
    name: string;
    email: string;
    avatar: string;
}

export const emails: Email[] = [
  {
    id: '1',
    from: { name: 'Alice', email: 'alice@example.com' },
    subject: 'Project Update',
    body: 'Hi team, here is the latest update on the project. We are on track to meet the deadline. Please review the attached document and provide your feedback by EOD. Best, Alice',
    date: '2024-05-20T10:00:00Z',
    read: true,
    tag: 'inbox',
    category: 'important',
    priority: 2,
  },
  {
    id: '2',
    from: { name: 'Bob', email: 'bob@example.com' },
    subject: 'Lunch tomorrow?',
    body: 'Hey, are you free for lunch tomorrow? Thinking of trying that new Italian place. Let me know!',
    date: '2024-05-20T09:30:00Z',
    read: false,
    tag: 'inbox',
    category: 'personal',
    priority: 3,
  },
  {
    id: '3',
    from: { name: 'Charlie', email: 'charlie@example.com' },
    subject: 'Your order has shipped',
    body: 'Great news! Your order #12345 has shipped and is on its way. You can track it here. Thanks for shopping with us!',
    date: '2024-05-19T15:45:00Z',
    read: true,
    tag: 'inbox',
    category: 'updates',
    priority: 4,
  },
  {
    id: '4',
    from: { name: 'Diana', email: 'diana@example.com' },
    subject: 'Re: Question about invoice',
    body: 'Hi, thanks for reaching out. I have attached the corrected invoice. Please let me know if you have any other questions. Regards, Diana',
    date: '2024-05-19T11:20:00Z',
    read: false,
    tag: 'inbox',
    category: 'important',
    priority: 2,
  },
  {
    id: '5',
    from: { name: 'Me', email: 'me@vocalmail.com' },
    to: { name: 'Alice', email: 'alice@example.com'},
    subject: 'Meeting Notes',
    body: 'Hi Alice, attached are the notes from today\'s meeting. Key takeaways: we need to finalize the Q3 budget and onboard the new hires. Action items are assigned within the document.',
    date: '2024-05-18T17:00:00Z',
    read: true,
    tag: 'sent',
    category: 'important',
    priority: 2,
  },
  {
    id: '6',
    from: { name: 'Eve', email: 'eve@example.com' },
    subject: 'Vacation Photos',
    body: 'Hey! Finally got around to uploading my vacation photos. Here is the link to the album. Hope you enjoy them!',
    date: '2024-05-18T14:30:00Z',
    read: true,
    tag: 'archive',
    category: 'personal',
    priority: 5,
  },
  {
    id: '7',
    from: { name: 'Frank', email: 'frank@example.com' },
    subject: 'Weekly Report',
    body: 'Please find the weekly report attached. The key highlight this week is the 20% increase in user engagement. We should discuss this in our next sync.',
    date: '2024-05-17T18:00:00Z',
    read: false,
    tag: 'inbox',
    category: 'important',
    priority: 2,
  },
  {
    id: '8',
    from: { name: 'Me', email: 'me@vocalmail.com' },
    to: { name: 'Bob', email: 'bob@example.com'},
    subject: 'Re: Lunch tomorrow?',
    body: 'Hi Bob, I\'m free tomorrow! That Italian place sounds great. What time works for you?',
    date: '2024-05-20T09:45:00Z',
    read: true,
    tag: 'sent',
    category: 'personal',
    priority: 3,
  },
  {
    id: '9',
    from: { name: 'Grace', email: 'grace@example.com' },
    subject: 'Confirmation: Your subscription has been renewed',
    body: 'This email is to confirm that your subscription to Pro Services has been successfully renewed. No action is required from your side.',
    date: '2024-05-16T11:00:00Z',
    read: true,
    tag: 'archive',
    category: 'updates',
    priority: 5,
  },
  {
    id: '10',
    from: { name: 'Henry', email: 'henry@example.com' },
    subject: 'Quick question about the Q3 budget',
    body: 'Hi, I was reviewing the Q3 budget and had a quick question about the marketing spend allocation. Do you have a moment to chat this afternoon? Thanks, Henry.',
    date: '2024-05-20T11:00:00Z',
    read: false,
    tag: 'inbox',
    category: 'important',
    priority: 2,
  },
  {
    id: '11',
    from: { name: 'Ivy', email: 'ivy@example.com' },
    subject: 'Your flight check-in is now open',
    body: 'Check-in for your flight VA243 to San Francisco is now open. Please check in online to save time at the airport.',
    date: '2024-05-15T12:00:00Z',
    read: true,
    tag: 'archive',
    category: 'updates',
    priority: 4,
  },
  {
    id: '12',
    from: { name: 'Me', email: 'me@vocalmail.com' },
    to: { name: 'Jack', email: 'jack@example.com'},
    subject: 'Follow up on our call',
    body: 'Hi Jack, it was great chatting with you earlier. As discussed, I\'m sending over the proposal for your review. Please let me know if you have any feedback.',
    date: '2024-05-17T16:20:00Z',
    read: true,
    tag: 'sent',
    category: 'important',
    priority: 2,
  },
   {
    id: '13',
    from: { name: 'Alice', email: 'alice@example.com' },
    subject: 'Brainstorming Session',
    body: 'Hi all, I\'ve scheduled a brainstorming session for the new feature tomorrow at 2 PM. Please come prepared with your ideas.',
    date: '2024-05-20T14:00:00Z',
    read: false,
    tag: 'inbox',
    category: 'important',
    priority: 2,
  },
  {
    id: '14',
    from: { name: 'System Alert', email: 'no-reply@system.com' },
    subject: 'Security Alert: New device login',
    body: 'A new device has logged into your account. If this was you, you can safely ignore this email. If not, please change your password immediately.',
    date: '2024-05-14T08:00:00Z',
    read: true,
    tag: 'archive',
    category: 'urgent',
    priority: 1,
  },
  {
    id: '15',
    from: { name: 'Jack', email: 'jack@example.com' },
    subject: 'Re: Follow up on our call',
    body: 'Thanks for sending this over so quickly. The proposal looks great. I have a few minor comments which I have added to the document. Let\'s connect next week to finalize.',
    date: '2024-05-18T10:00:00Z',
    read: false,
    tag: 'inbox',
    category: 'important',
    priority: 2,
  },
   {
    id: '16',
    from: { name: 'Shopify', email: 'news@shopify.com' },
    subject: 'Black Friday Deals are here!',
    body: 'Don\'t miss out on our biggest sale of the year. Get up to 50% off on all products. Shop now!',
    date: '2024-05-20T18:00:00Z',
    read: false,
    tag: 'inbox',
    category: 'promotions',
    priority: 5,
  },
];

export const contacts: Contact[] = [
    // Existing contacts
    { id: '1', name: 'Alice', email: 'alice@example.com', avatar: 'A' },
    { id: '2', name: 'Bob', email: 'bob@example.com', avatar: 'B' },
    { id: '3', name: 'Charlie', email: 'charlie@example.com', avatar: 'C' },
    { id: '4', name: 'Diana', email: 'diana@example.com', avatar: 'D' },
    { id: '5', name: 'Eve', email: 'eve@example.com', avatar: 'E' },
    // New contacts for testing
    { id: '6', name: 'Frank', email: 'frank@example.com', avatar: 'F' },
    { id: '7', name: 'Grace', email: 'grace@example.com', avatar: 'G' },
    { id: '8', name: 'Henry', email: 'henry@example.com', avatar: 'H' },
    { id: '9', name: 'Ivy', email: 'ivy@example.com', avatar: 'I' },
    { id: '10', name: 'Jack', email: 'jack@example.com', avatar: 'J' },
];

export function getEmailById(id: string): Email | undefined {
    return emails.find(email => email.id === id);
}
