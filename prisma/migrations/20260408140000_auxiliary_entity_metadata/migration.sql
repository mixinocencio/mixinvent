-- Metadados enterprise nos cadastros auxiliares (benchmark Snipe-IT).

ALTER TABLE "companies" ADD COLUMN "cnpj" TEXT,
ADD COLUMN "email_contato" TEXT,
ADD COLUMN "telefone" TEXT,
ADD COLUMN "endereco" TEXT;

ALTER TABLE "brands" ADD COLUMN "site" TEXT,
ADD COLUMN "telefone_suporte" TEXT,
ADD COLUMN "email_suporte" TEXT;

ALTER TABLE "device_models" ADD COLUMN "part_number" TEXT,
ADD COLUMN "meses_garantia" INTEGER,
ADD COLUMN "meses_depreciacao" INTEGER;

ALTER TABLE "departments" ADD COLUMN "centro_custo" TEXT;
