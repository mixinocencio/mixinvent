-- Fornecedores, vínculo da NF com fornecedor, flag de serialização por modelo.

CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "contact_email" TEXT,
    "phone" TEXT,
    "address" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "suppliers"("cnpj");

INSERT INTO "suppliers" ("id", "name", "cnpj", "contact_email", "phone", "address")
VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'Fornecedor legado (migração)',
    '00000000000191',
    NULL,
    NULL,
    NULL
);

ALTER TABLE "device_models" ADD COLUMN "is_serialized" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "purchase_orders" ADD COLUMN "supplier_id" TEXT;

UPDATE "purchase_orders"
SET "supplier_id" = 'a0000000-0000-4000-8000-000000000001'
WHERE "supplier_id" IS NULL;

ALTER TABLE "purchase_orders" DROP COLUMN "fornecedor";

ALTER TABLE "purchase_orders" ALTER COLUMN "supplier_id" SET NOT NULL;

ALTER TABLE "purchase_orders"
ADD CONSTRAINT "purchase_orders_supplier_id_fkey"
FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
