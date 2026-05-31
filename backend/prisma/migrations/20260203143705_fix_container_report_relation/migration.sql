/*
  Warnings:

  - You are about to drop the column `status` on the `Container` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Container` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Report` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- AlterTable
ALTER TABLE "Container" DROP COLUMN "status",
DROP COLUMN "updatedAt",
ALTER COLUMN "capacity" DROP NOT NULL,
ALTER COLUMN "fillLevel" DROP NOT NULL,
ALTER COLUMN "fillLevel" DROP DEFAULT,
ALTER COLUMN "zone" DROP NOT NULL,
ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "latitude" DROP DEFAULT,
ALTER COLUMN "longitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "status",
DROP COLUMN "updatedAt",
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
