-- Notas fiscais de compra e vínculo com ativos/insumos.

CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "numero_nf" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "data_compra" TIMESTAMP(3) NOT NULL,
    "valor_total" DECIMAL(14,2) NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "assets" ADD COLUMN "purchase_order_id" TEXT;

ALTER TABLE "consumables" ADD COLUMN "purchase_order_id" TEXT;

ALTER TABLE "assets"
ADD CONSTRAINT "assets_purchase_order_id_fkey"
FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "consumables"
ADD CONSTRAINT "consumables_purchase_order_id_fkey"
FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
