-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_models" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,

    CONSTRAINT "device_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_types" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "stock_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "device_models" ADD CONSTRAINT "device_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "company_id" TEXT;

ALTER TABLE "users" DROP COLUMN "empresa";

ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "assets" ADD COLUMN "brand_id" TEXT,
ADD COLUMN "model_id" TEXT,
ADD COLUMN "stock_type_id" TEXT;

ALTER TABLE "assets" DROP COLUMN "marca",
DROP COLUMN "modelo";

ALTER TABLE "assets" ADD CONSTRAINT "assets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "device_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_stock_type_id_fkey" FOREIGN KEY ("stock_type_id") REFERENCES "stock_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
