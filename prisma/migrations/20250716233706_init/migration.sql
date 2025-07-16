/*
  Warnings:

  - You are about to drop the `AudioCache` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AudioCache";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "audio_cache" (
    "text" TEXT NOT NULL PRIMARY KEY,
    "audioDataUri" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "ownerId" INTEGER NOT NULL,
    "contactUserId" INTEGER NOT NULL,

    PRIMARY KEY ("ownerId", "contactUserId"),
    CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contact_contactUserId_fkey" FOREIGN KEY ("contactUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("contactUserId", "ownerId") SELECT "contactUserId", "ownerId" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE TABLE "new_EmailRecipient" (
    "emailId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,

    PRIMARY KEY ("emailId", "recipientId"),
    CONSTRAINT "EmailRecipient_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailRecipient_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailRecipient" ("emailId", "read", "recipientId", "status") SELECT "emailId", "read", "recipientId", "status" FROM "EmailRecipient";
DROP TABLE "EmailRecipient";
ALTER TABLE "new_EmailRecipient" RENAME TO "EmailRecipient";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
