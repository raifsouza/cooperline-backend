/*
  Warnings:

  - You are about to drop the column `nome_produto` on the `product_entries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `product_entries` DROP COLUMN `nome_produto`,
    ADD COLUMN `nome_linha_1` VARCHAR(191) NULL,
    ADD COLUMN `nome_linha_2` VARCHAR(191) NULL,
    ADD COLUMN `nome_linha_3` VARCHAR(191) NULL,
    ADD COLUMN `nome_linha_4` VARCHAR(191) NULL,
    ADD COLUMN `nome_linha_5` VARCHAR(191) NULL,
    ADD COLUMN `nome_linha_6` VARCHAR(191) NULL;
