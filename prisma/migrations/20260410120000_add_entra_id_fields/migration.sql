-- AlterTable
ALTER TABLE "users" ADD COLUMN "entra_id" TEXT,
ADD COLUMN "departamento_entra" TEXT,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "users_entra_id_key" ON "users"("entra_id");
