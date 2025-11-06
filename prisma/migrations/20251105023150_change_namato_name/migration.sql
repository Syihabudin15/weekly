/*
  Warnings:

  - You are about to drop the column `nama` on the `datadebitur` table. All the data in the column will be lost.
  - You are about to drop the column `alamat` on the `datakeluarga` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `datakeluarga` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `datakeluarga` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `datakeluarga` table. All the data in the column will be lost.
  - You are about to drop the column `nik` on the `datakeluarga` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal_lahir` on the `datakeluarga` table. All the data in the column will be lost.
  - Added the required column `name` to the `DataDebitur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `DataKeluarga` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dapem` ADD COLUMN `process_date` DATETIME(3) NULL,
    ADD COLUMN `process_desc` TEXT NULL;

-- AlterTable
ALTER TABLE `datadebitur` DROP COLUMN `nama`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `datakeluarga` DROP COLUMN `alamat`,
    DROP COLUMN `email`,
    DROP COLUMN `gender`,
    DROP COLUMN `nama`,
    DROP COLUMN `nik`,
    DROP COLUMN `tanggal_lahir`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;
