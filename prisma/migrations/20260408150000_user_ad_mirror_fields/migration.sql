-- Campos espelhando atributos comuns do Active Directory.

ALTER TABLE "users" ADD COLUMN "user_principal_name" TEXT,
ADD COLUMN "telefone" TEXT,
ADD COLUMN "estado" TEXT;

CREATE UNIQUE INDEX "users_user_principal_name_key" ON "users"("user_principal_name");
