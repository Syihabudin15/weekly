/*
  Warnings:

  - You are about to drop the column `gaji` on the `datadebitur` table. All the data in the column will be lost.
  - Added the required column `salary` to the `DataDebitur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `datadebitur` DROP COLUMN `gaji`,
    ADD COLUMN `salary` INTEGER NOT NULL;
