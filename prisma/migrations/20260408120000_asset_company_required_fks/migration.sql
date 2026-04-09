-- Empresa obrigatória no patrimônio; marca, modelo e tipo de estoque obrigatórios (sem SET NULL no delete).
--
-- Se `companies` (ou outras tabelas de lookup) estiverem vazias, o UPDATE com subconsulta não altera
-- nenhuma linha e o NOT NULL falha (23502). Por isso garantimos ao menos um registro antes do backfill.

-- Cadastros mínimos só quando a tabela está vazia (não sobrescreve dados existentes)
INSERT INTO "companies" ("id", "nome")
SELECT gen_random_uuid()::text, 'Empresa (ajustar nome)'
WHERE NOT EXISTS (SELECT 1 FROM "companies" LIMIT 1);

INSERT INTO "brands" ("id", "nome")
SELECT gen_random_uuid()::text, 'Marca (ajustar nome)'
WHERE NOT EXISTS (SELECT 1 FROM "brands" LIMIT 1);

INSERT INTO "stock_types" ("id", "nome")
SELECT gen_random_uuid()::text, 'Tipo de estoque (ajustar nome)'
WHERE NOT EXISTS (SELECT 1 FROM "stock_types" LIMIT 1);

INSERT INTO "device_models" ("id", "nome", "brand_id")
SELECT gen_random_uuid()::text, 'Modelo (ajustar nome)', b."id"
FROM "brands" b
WHERE NOT EXISTS (SELECT 1 FROM "device_models" LIMIT 1)
ORDER BY b."nome" ASC
LIMIT 1;

-- Permite reaplicar após falha parcial (coluna já pode existir)
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "company_id" TEXT;

UPDATE "assets"
SET "model_id" = (SELECT "id" FROM "device_models" ORDER BY "nome" ASC LIMIT 1)
WHERE "model_id" IS NULL;

UPDATE "assets" a
SET "brand_id" = (SELECT dm."brand_id" FROM "device_models" dm WHERE dm."id" = a."model_id")
WHERE "brand_id" IS NULL;

UPDATE "assets"
SET "stock_type_id" = (SELECT "id" FROM "stock_types" ORDER BY "nome" ASC LIMIT 1)
WHERE "stock_type_id" IS NULL;

UPDATE "assets"
SET "company_id" = (SELECT "id" FROM "companies" ORDER BY "nome" ASC LIMIT 1)
WHERE "company_id" IS NULL;

ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "assets_brand_id_fkey";
ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "assets_model_id_fkey";
ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "assets_stock_type_id_fkey";

ALTER TABLE "assets" ALTER COLUMN "company_id" SET NOT NULL;
ALTER TABLE "assets" ALTER COLUMN "brand_id" SET NOT NULL;
ALTER TABLE "assets" ALTER COLUMN "model_id" SET NOT NULL;
ALTER TABLE "assets" ALTER COLUMN "stock_type_id" SET NOT NULL;

ALTER TABLE "assets" ADD CONSTRAINT "assets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_stock_type_id_fkey" FOREIGN KEY ("stock_type_id") REFERENCES "stock_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
