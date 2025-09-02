/*
  Warnings:

  - You are about to drop the column `barcode` on the `label_entries` table. All the data in the column will be lost.
  - You are about to drop the column `data_fab` on the `label_entries` table. All the data in the column will be lost.
  - You are about to drop the column `designacao` on the `label_entries` table. All the data in the column will be lost.
  - You are about to drop the column `lote` on the `label_entries` table. All the data in the column will be lost.
  - You are about to drop the column `pais_origem` on the `label_entries` table. All the data in the column will be lost.
  - You are about to drop the column `registro` on the `label_entries` table. All the data in the column will be lost.
  - You are about to drop the column `tensao` on the `label_entries` table. All the data in the column will be lost.
  - You are about to drop the column `validade` on the `label_entries` table. All the data in the column will be lost.
  - You are about to drop the column `fabricadoEm` on the `lote_entries` table. All the data in the column will be lost.
  - You are about to drop the column `produto` on the `lote_entries` table. All the data in the column will be lost.
  - Added the required column `label_id` to the `product_entries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `label_entries` DROP COLUMN `barcode`,
    DROP COLUMN `data_fab`,
    DROP COLUMN `designacao`,
    DROP COLUMN `lote`,
    DROP COLUMN `pais_origem`,
    DROP COLUMN `registro`,
    DROP COLUMN `tensao`,
    DROP COLUMN `validade`;

-- AlterTable
ALTER TABLE `lote_entries` DROP COLUMN `fabricadoEm`,
    DROP COLUMN `produto`;

-- AlterTable
ALTER TABLE `product_entries` ADD COLUMN `label_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `product_entries` ADD CONSTRAINT `product_entries_label_id_fkey` FOREIGN KEY (`label_id`) REFERENCES `label_entries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
