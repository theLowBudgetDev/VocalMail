-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "emails" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "senderId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderStatus" TEXT NOT NULL,
    CONSTRAINT "emails_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_recipients" (
    "emailId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "read" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,

    PRIMARY KEY ("emailId", "recipientId"),
    CONSTRAINT "email_recipients_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_recipients_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contacts" (
    "ownerId" INTEGER NOT NULL,
    "contactUserId" INTEGER NOT NULL,

    PRIMARY KEY ("ownerId", "contactUserId"),
    CONSTRAINT "contacts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contacts_contactUserId_fkey" FOREIGN KEY ("contactUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audio_cache" (
    "text" TEXT NOT NULL PRIMARY KEY,
    "audioDataUri" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
