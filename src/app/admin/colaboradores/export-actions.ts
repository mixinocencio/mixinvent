"use server";

import { prisma } from "@/lib/prisma";
import { buildColaboradoresAdminWhere } from "./filters";

const AUDIT_HEADERS = [
  "SamAccountName",
  "Nome",
  "E-mail (UPN)",
  "Cargo",
  "Departamento",
  "Cidade",
  "Status",
  "Licenças O365",
] as const;

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildAuditCsv(rows: { cells: string[] }[]): string {
  const lines = [AUDIT_HEADERS.map(escapeCsvCell).join(",")];
  for (const { cells } of rows) {
    lines.push(cells.map(escapeCsvCell).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

export async function exportColaboradoresAuditoriaCsv(filters: {
  q?: string;
  status?: string;
}): Promise<{ ok: true; csv: string } | { ok: false; error: string }> {
  try {
    const where = buildColaboradoresAdminWhere(filters.q, filters.status);
    const users = await prisma.user.findMany({
      where,
      orderBy: { nome: "asc" },
      select: {
        samAccountName: true,
        nome: true,
        email: true,
        userPrincipalName: true,
        cargo: true,
        cidade: true,
        status: true,
        licencasO365: true,
        departamentoEntra: true,
        departamento: { select: { nome: true } },
      },
    });

    const rows = users.map((u) => {
      const dept =
        u.departamento?.nome?.trim() || u.departamentoEntra?.trim() || "";
      const upn = (u.userPrincipalName?.trim() || u.email || "").trim();
      return {
        cells: [
          u.samAccountName?.trim() ?? "",
          u.nome?.trim() ?? "",
          upn,
          u.cargo?.trim() ?? "",
          dept,
          u.cidade?.trim() ?? "",
          u.status === "ATIVO" ? "Ativo" : "Inativo",
          u.licencasO365?.trim() ?? "",
        ],
      };
    });

    return { ok: true, csv: buildAuditCsv(rows) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || "Falha ao gerar o relatório." };
  }
}
