-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `permissions` TEXT NOT NULL DEFAULT '[]',
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Unit` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Unit_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `position` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `roleId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Produk` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `max_tenor` INTEGER NOT NULL,
    `max_plafon` INTEGER NOT NULL,
    `by_admin` DOUBLE NOT NULL,
    `by_tabungan` INTEGER NOT NULL,
    `by_materai` INTEGER NOT NULL,
    `by_tatalaksana` DOUBLE NOT NULL,
    `margin` DOUBLE NOT NULL,
    `dsr` DOUBLE NOT NULL DEFAULT 70,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jenis` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `pelunasan` BOOLEAN NOT NULL DEFAULT false,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dapem` (
    `id` VARCHAR(191) NOT NULL,
    `salary` INTEGER NOT NULL,
    `dsr` DOUBLE NOT NULL,
    `tenor` INTEGER NOT NULL,
    `plafon` INTEGER NOT NULL,
    `by_admin` DOUBLE NOT NULL,
    `by_tabungan` INTEGER NOT NULL,
    `by_materai` INTEGER NOT NULL,
    `by_tatalaksana` DOUBLE NOT NULL,
    `pelunasan` INTEGER NOT NULL,
    `margin` DOUBLE NOT NULL,
    `description` TEXT NULL,
    `status_sub` ENUM('DRAFT', 'PENDING', 'SETUJU', 'TOLAK', 'BATAL', 'LUNAS') NOT NULL DEFAULT 'DRAFT',
    `status_dev` BOOLEAN NOT NULL DEFAULT false,
    `file_permohonan` VARCHAR(191) NULL,
    `file_akad` VARCHAR(191) NULL,
    `file_pencairan` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `process_desc` TEXT NULL,
    `process_date` DATETIME(3) NULL,
    `dataDebiturId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `petugasId` VARCHAR(191) NULL,
    `approvedById` VARCHAR(191) NULL,
    `produkId` VARCHAR(191) NOT NULL,
    `jenisId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataDebitur` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NOT NULL,
    `no_kk` VARCHAR(191) NULL,
    `salary` INTEGER NOT NULL,
    `tanggal_lahir` DATETIME(3) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `kelurahan` VARCHAR(191) NOT NULL,
    `kecamatan` VARCHAR(191) NOT NULL,
    `kota` VARCHAR(191) NOT NULL,
    `provinsi` VARCHAR(191) NOT NULL,
    `kode_pos` VARCHAR(191) NOT NULL,
    `geo_lokasi` VARCHAR(191) NULL,
    `no_telepon` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `jenis_kelamin` ENUM('L', 'P') NOT NULL,
    `pekerjaan` VARCHAR(191) NOT NULL,
    `alamat_pekerjaan` TEXT NOT NULL,
    `files` TEXT NULL,
    `status_kawin` ENUM('K', 'BK', 'J', 'D') NOT NULL,

    UNIQUE INDEX `DataDebitur_nik_key`(`nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jaminan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `taksiran` INTEGER NOT NULL DEFAULT 0,
    `dapemId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataKeluarga` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `hubungan` VARCHAR(191) NOT NULL,
    `no_telepon` VARCHAR(191) NOT NULL,
    `dataDebiturId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JadwalAngsuran` (
    `id` VARCHAR(191) NOT NULL,
    `jadwal_bayar` DATETIME(3) NOT NULL,
    `tanggal_bayar` DATETIME(3) NULL,
    `pokok` INTEGER NOT NULL,
    `margin` INTEGER NOT NULL,
    `angsuran_ke` INTEGER NOT NULL,
    `keterangan` VARCHAR(191) NULL,
    `file` VARCHAR(191) NULL,
    `status_kunjungan` ENUM('BELUM', 'SUDAH') NOT NULL DEFAULT 'BELUM',
    `dapemId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pelunasan` (
    `id` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `file` VARCHAR(191) NULL,
    `status_sub` ENUM('DRAFT', 'PENDING', 'SETUJU', 'TOLAK', 'BATAL', 'LUNAS') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` BOOLEAN NOT NULL DEFAULT true,
    `dapemId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `Produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_jenisId_fkey` FOREIGN KEY (`jenisId`) REFERENCES `Jenis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_dataDebiturId_fkey` FOREIGN KEY (`dataDebiturId`) REFERENCES `DataDebitur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_petugasId_fkey` FOREIGN KEY (`petugasId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jaminan` ADD CONSTRAINT `Jaminan_dapemId_fkey` FOREIGN KEY (`dapemId`) REFERENCES `Dapem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataKeluarga` ADD CONSTRAINT `DataKeluarga_dataDebiturId_fkey` FOREIGN KEY (`dataDebiturId`) REFERENCES `DataDebitur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JadwalAngsuran` ADD CONSTRAINT `JadwalAngsuran_dapemId_fkey` FOREIGN KEY (`dapemId`) REFERENCES `Dapem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pelunasan` ADD CONSTRAINT `Pelunasan_dapemId_fkey` FOREIGN KEY (`dapemId`) REFERENCES `Dapem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
