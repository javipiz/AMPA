-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Family" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "membershipNumber" TEXT,
    "status" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT
);
INSERT INTO "new_Family" ("createdAt", "createdBy", "id", "membershipNumber", "name", "status") SELECT "createdAt", "createdBy", "id", "membershipNumber", "name", "status" FROM "Family";
DROP TABLE "Family";
ALTER TABLE "new_Family" RENAME TO "Family";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
