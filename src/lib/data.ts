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
};

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
  },
  {
    id: '2',
    from: { name: 'Bob', email: 'bob@example.com' },
    subject: 'Lunch tomorrow?',
    body: 'Hey, are you free for lunch tomorrow? Thinking of trying that new Italian place. Let me know!',
    date: '2024-05-20T09:30:00Z',
    read: false,
    tag: 'inbox',
  },
  {
    id: '3',
    from: { name: 'Charlie', email: 'charlie@example.com' },
    subject: 'Your order has shipped',
    body: 'Great news! Your order #12345 has shipped and is on its way. You can track it here. Thanks for shopping with us!',
    date: '2024-05-19T15:45:00Z',
    read: true,
    tag: 'inbox',
  },
  {
    id: '4',
    from: { name: 'Diana', email: 'diana@example.com' },
    subject: 'Re: Question about invoice',
    body: 'Hi, thanks for reaching out. I have attached the corrected invoice. Please let me know if you have any other questions. Regards, Diana',
    date: '2024-05-19T11:20:00Z',
    read: false,
    tag: 'inbox',
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
  },
  {
    id: '6',
    from: { name: 'Eve', email: 'eve@example.com' },
    subject: 'Vacation Photos',
    body: 'Hey! Finally got around to uploading my vacation photos. Here is the link to the album. Hope you enjoy them!',
    date: '2024-05-18T14:30:00Z',
    read: true,
    tag: 'archive',
  },
];

export const contacts: Contact[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com', avatar: 'A' },
    { id: '2', name: 'Bob', email: 'bob@example.com', avatar: 'B' },
    { id: '3', name: 'Charlie', email: 'charlie@example.com', avatar: 'C' },
    { id: '4', name: 'Diana', email: 'diana@example.com', avatar: 'D' },
    { id: '5', name: 'Eve', email: 'eve@example.com', avatar: 'E' },
];

export function getEmailById(id: string): Email | undefined {
    return emails.find(email => email.id === id);
}
