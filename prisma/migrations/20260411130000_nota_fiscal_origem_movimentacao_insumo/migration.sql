-- CreateEnum
CREATE TYPE "OrigemEntrada" AS ENUM ('NOTA_FISCAL', 'AUDITORIA', 'IMPORTACAO_INICIAL');

-- CreateEnum
CREATE TYPE "TipoMovimentacaoInsumo" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "data_emissao" TIMESTAMP(3) NOT NULL,
    "valor_total" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "assets" ADD COLUMN "nota_fiscal_id" TEXT,
ADD COLUMN "origem" "OrigemEntrada" NOT NULL DEFAULT 'NOTA_FISCAL';

-- CreateTable
CREATE TABLE "movimentacoes_insumo" (
    "id" TEXT NOT NULL,
    "consumable_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "tipo" "TipoMovimentacaoInsumo" NOT NULL,
    "nota_fiscal_id" TEXT,
    "origem" "OrigemEntrada" NOT NULL DEFAULT 'NOTA_FISCAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_insumo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_insumo" ADD CONSTRAINT "movimentacoes_insumo_consumable_id_fkey" FOREIGN KEY ("consumable_id") REFERENCES "consumables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_insumo" ADD CONSTRAINT "movimentacoes_insumo_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
