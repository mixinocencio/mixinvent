import { isPrismaConnectionError } from "@/lib/is-prisma-connection-error";

/** Códigos típicos quando o banco existe mas o schema ainda não foi aplicado (migrate). */
const SCHEMA_NOT_READY = new Set(["P2021", "P2022", "P2010", "P1017"]);

/**
 * True quando não devemos quebrar a página com 500: sem conexão ou tabelas/colunas ausentes.
 */
export function isPrismaAppBlockedError(e: unknown): boolean {
  if (isPrismaConnectionError(e)) return true;
  if (typeof e !== "object" || e === null) return false;
  const code = (e as { code?: string }).code;
  return typeof code === "string" && SCHEMA_NOT_READY.has(code);
}

export function isPrismaMigrateLikelyNeeded(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const code = (e as { code?: string }).code;
  return code === "P2021" || code === "P2022";
}
