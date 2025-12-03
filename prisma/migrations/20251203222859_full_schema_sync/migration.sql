/*
  Warnings:

  - You are about to drop the column `name` on the `Family` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Member` table. All the data in the column will be lost.
  - Added the required column `address` to the `Family` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Family` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyName` to the `Family` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joinDate` to the `Family` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Family` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Family` table without a default value. This is not possible if the table is not empty.
  - Made the column `status` on table `Family` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `birthDate` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Family" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "membershipNumber" TEXT,
    "familyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "joinDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "aiSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Family" ("createdAt", "createdBy", "id", "membershipNumber", "status") SELECT coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "createdBy", "id", "membershipNumber", "status" FROM "Family";
DROP TABLE "Family";
ALTER TABLE "new_Family" RENAME TO "Family";
CREATE TABLE "new_Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "gender" TEXT,
    "notes" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "familyId" INTEGER NOT NULL,
    CONSTRAINT "Member_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("familyId", "id") SELECT "familyId", "id" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
