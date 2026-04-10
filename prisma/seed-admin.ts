/**
 * Cria ou atualiza o administrador mestre (AuthUser / role ADMIN) para a infraestrutura EBEG.
 *
 * Uso:
 *   MIXINVENT_ADMIN_PASSWORD="senha_forte" npx tsx prisma/seed-admin.ts
 *
 * Opcional:
 *   MIXINVENT_ADMIN_EMAIL — padrão: seu-email@ebeg.com.br
 */
import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { hashAuthPassword } from "../src/lib/auth-password";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = "seu-email@ebeg.com.br";

async function main() {
  const password = process.env.MIXINVENT_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    console.error(
      "Defina MIXINVENT_ADMIN_PASSWORD no ambiente (mínimo 12 caracteres). Ex.: MIXINVENT_ADMIN_PASSWORD='...' npx tsx prisma/seed-admin.ts",
    );
    process.exit(1);
  }

  const email = (process.env.MIXINVENT_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();

  const passwordHash = await hashAuthPassword(password);

  await prisma.authUser.upsert({
    where: { email },
    create: {
      email,
      name: "Administrador mestre",
      passwordHash,
      role: "ADMIN",
    },
    update: {
      name: "Administrador mestre",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Administrador mestre EBEG criado/atualizado: ${email} (role: ADMIN, hash: Argon2id).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
