/**
 * Detecta falhas de conexão do Prisma sem depender de `instanceof` (evita edge cases entre bundles)
 * e sem importar o namespace `Prisma` (evita efeitos colaterais em alguns ambientes).
 */
export function isPrismaConnectionError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const err = e as { code?: string; name?: string; message?: string };

  if (err.code === "P5010" || err.code === "P1001" || err.code === "P1000") return true;
  if (err.name === "PrismaClientInitializationError") return true;

  const msg = typeof err.message === "string" ? err.message : "";
  if (/fetch failed|can't reach database server|connection refused|ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(msg)) {
    return true;
  }

  return false;
}
