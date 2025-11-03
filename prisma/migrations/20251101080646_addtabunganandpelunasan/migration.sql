/*
  Warnings:

  - Added the required column `jenisId` to the `Dapem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `produkId` to the `Dapem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dapem` ADD COLUMN `jenisId` VARCHAR(191) NOT NULL,
    ADD COLUMN `produkId` VARCHAR(191) NOT NULL,
    MODIFY `by_tabungan` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `jenis` ADD COLUMN `pelunasan` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `produk` MODIFY `by_tabungan` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `Produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_jenisId_fkey` FOREIGN KEY (`jenisId`) REFERENCES `Jenis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
