import { PrismaClient } from "@prisma/client";

/**
 * Incremente quando o schema Prisma ganhar modelos/delegates novos.
 * Evita reutilizar um `PrismaClient` antigo em `globalThis` (comum no Next em dev),
 * o que causa `prisma.systemSetting` undefined após `prisma generate`.
 */
const PRISMA_CLIENT_REV = 4;

type GlobalPrisma = {
  prisma?: PrismaClient;
  __prismaClientRev?: number;
};

const g = globalThis as unknown as GlobalPrisma;

function makeClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma: PrismaClient =
  g.__prismaClientRev === PRISMA_CLIENT_REV && g.prisma
    ? g.prisma
    : (() => {
        if (g.prisma) {
          void g.prisma.$disconnect().catch(() => {});
        }
        const client = makeClient();
        g.prisma = client;
        g.__prismaClientRev = PRISMA_CLIENT_REV;
        return client;
      })();
