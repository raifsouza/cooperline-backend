/*
  Warnings:

  - A unique constraint covering the columns `[lote]` on the table `lote_entries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nome]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `lote_entries_lote_key` ON `lote_entries`(`lote`);

-- CreateIndex
CREATE UNIQUE INDEX `usuarios_nome_key` ON `usuarios`(`nome`);
