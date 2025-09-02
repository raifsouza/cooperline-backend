-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `nivel_acesso` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NOT NULL,
    `nome_produto` VARCHAR(191) NOT NULL,
    `tamanho_padrao` VARCHAR(191) NOT NULL,
    `designacao` VARCHAR(191) NOT NULL,
    `tensao` VARCHAR(191) NOT NULL,
    `massa_bruta_kg_100m` DOUBLE NOT NULL,
    `norma_aplicada` VARCHAR(191) NOT NULL,
    `composicao` VARCHAR(191) NOT NULL,
    `numero_registro` VARCHAR(191) NOT NULL,
    `cod_barras` VARCHAR(191) NOT NULL,
    `pedido_oc` VARCHAR(191) NULL,
    `retalho` VARCHAR(191) NULL,
    `massa_liquida_kg_100m` DOUBLE NOT NULL,

    UNIQUE INDEX `product_entries_codigo_key`(`codigo`),
    UNIQUE INDEX `product_entries_cod_barras_key`(`cod_barras`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `label_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(191) NOT NULL,
    `original_content` TEXT NOT NULL,
    `designacao` VARCHAR(191) NULL,
    `tensao` VARCHAR(191) NULL,
    `data_fab` VARCHAR(191) NULL,
    `pais_origem` VARCHAR(191) NULL,
    `validade` VARCHAR(191) NULL,
    `lote` VARCHAR(191) NULL,
    `registro` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NULL,

    UNIQUE INDEX `label_entries_file_name_key`(`file_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lote_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lote` VARCHAR(191) NOT NULL,
    `produto` VARCHAR(191) NOT NULL,
    `fabricadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrintHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `userMatricula` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `printerName` VARCHAR(191) NOT NULL,
    `copies` INTEGER NOT NULL,
    `reprint` BOOLEAN NOT NULL DEFAULT false,
    `labelName` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NULL,
    `productCode` VARCHAR(191) NULL,
    `productLote` VARCHAR(191) NULL,
    `zplContentSent` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
