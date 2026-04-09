-- Endereço estruturado (substitui o campo livre `endereco`).

ALTER TABLE "companies" DROP COLUMN IF EXISTS "endereco",
ADD COLUMN "cep" TEXT,
ADD COLUMN "rua" TEXT,
ADD COLUMN "numero" TEXT,
ADD COLUMN "complemento" TEXT,
ADD COLUMN "bairro" TEXT,
ADD COLUMN "cidade" TEXT,
ADD COLUMN "estado" TEXT;
