/*
  Warnings:

  - You are about to drop the column `order` on the `VehicleImage` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VehicleImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "vehicleId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleImage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VehicleImage" ("alt", "createdAt", "id", "url", "vehicleId") SELECT "alt", "createdAt", "id", "url", "vehicleId" FROM "VehicleImage";
DROP TABLE "VehicleImage";
ALTER TABLE "new_VehicleImage" RENAME TO "VehicleImage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
