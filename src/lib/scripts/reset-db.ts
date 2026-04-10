/**
 * Script temporário: apaga todos os dados das tabelas de negócio (Go Live / pré-produção).
 * Não remove `_prisma_migrations`. Após uso, delete este arquivo por segurança.
 *
 * Uso: npm run db:reset-data
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Nomes físicos no PostgreSQL (@@map), ordem irrelevante com CASCADE na mesma instrução. */
const TABLES = [
  "asset_logs", // movimentações / checklists (JSON em checklist_result)
  "movimentacoes_insumo",
  "assets",
  "consumables",
  "notas_fiscais",
  "purchase_orders",
  "suppliers",
  "users",
  "departments",
  "companies",
  "categories",
  "device_models",
  "brands",
  "stock_types",
  "system_settings",
] as const;

async function main() {
  const quoted = TABLES.map((t) => `"${t}"`).join(",\n  ");
  const sql = `
TRUNCATE TABLE
  ${quoted}
RESTART IDENTITY CASCADE;
`.trim();

  console.warn(
    "[reset-db] Executando TRUNCATE em todas as tabelas de dados (estrutura e migrations intactas)…",
  );
  await prisma.$executeRawUnsafe(sql);
  console.warn("[reset-db] Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
