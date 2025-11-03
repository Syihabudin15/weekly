/*
  Warnings:

  - You are about to alter the column `by_tatalaksana` on the `dapem` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - Added the required column `dsr` to the `Dapem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dapem` ADD COLUMN `dsr` DOUBLE NOT NULL,
    MODIFY `by_tatalaksana` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `produk` ADD COLUMN `dsr` DOUBLE NOT NULL DEFAULT 70;
