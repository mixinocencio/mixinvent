import { Prisma } from "@prisma/client";

export const PRISMA_FK_DELETE_MESSAGE =
  "Não é possível excluir este item pois existem registros vinculados a ele.";

export function prismaFkDeleteError(e: unknown): { error: string } | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
    return { error: PRISMA_FK_DELETE_MESSAGE };
  }
  return null;
}
