import { Prisma } from "@prisma/client";

/** Filtros da listagem admin `/admin/colaboradores` (busca + status). */
export function buildColaboradoresAdminWhere(q?: string, status?: string): Prisma.UserWhereInput {
  const parts: Prisma.UserWhereInput[] = [];
  const qt = q?.trim();
  if (qt) {
    parts.push({
      OR: [
        { nome: { contains: qt, mode: "insensitive" } },
        { email: { contains: qt, mode: "insensitive" } },
        { departamentoEntra: { contains: qt, mode: "insensitive" } },
        { cargo: { contains: qt, mode: "insensitive" } },
      ],
    });
  }
  const st = status?.trim().toLowerCase();
  if (st === "ativo") {
    parts.push({ isActive: true });
  } else if (st === "inativo") {
    parts.push({ isActive: false });
  }
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}
