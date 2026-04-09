import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { ColaboradoresDataTable, type ColaboradorListRow } from "@/components/colaboradores/data-table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildColaboradoresAdminWhere } from "./filters";

const PAGE_SIZE = 25;

const userListSelect = {
  id: true,
  nome: true,
  email: true,
  samAccountName: true,
  userPrincipalName: true,
  departamentoEntra: true,
  cargo: true,
  telefone: true,
  cidade: true,
  estado: true,
  licencasO365: true,
  companyId: true,
  departamentoId: true,
  isActive: true,
  status: true,
  entraId: true,
  departamento: { select: { nome: true } },
} as const;

function toListRow(u: {
  id: string;
  nome: string;
  email: string;
  samAccountName: string | null;
  userPrincipalName: string | null;
  departamentoEntra: string | null;
  cargo: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  licencasO365: string | null;
  companyId: string | null;
  departamentoId: string | null;
  isActive: boolean;
  status: "ATIVO" | "INATIVO";
  entraId: string | null;
  departamento: { nome: string } | null;
}): ColaboradorListRow {
  const dept = u.departamento?.nome?.trim() || u.departamentoEntra?.trim() || null;
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    samAccountName: u.samAccountName,
    userPrincipalName: u.userPrincipalName,
    cargo: u.cargo,
    telefone: u.telefone,
    cidade: u.cidade,
    estado: u.estado,
    licencasO365: u.licencasO365,
    companyId: u.companyId,
    departamentoId: u.departamentoId,
    status: u.status,
    departamentoLabel: dept,
    statusLabel: u.status === "ATIVO" ? "Ativo" : "Inativo",
    entraId: u.entraId,
  };
}

export default async function AdminColaboradoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const where = buildColaboradoresAdminWhere(sp.q, sp.status);
  const requestedPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (requestedPage - 1) * PAGE_SIZE;

  const first = await withDb(() =>
    Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: PAGE_SIZE,
        orderBy: { nome: "asc" },
        select: userListSelect,
      }),
      prisma.company.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
      prisma.department.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    ]),
  );

  if (!first.ok) return <DbOfflineNotice title="Colaboradores" />;

  const [total, rowsInitial, empresas, departamentos] = first.data;
  const totalPages = total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
  let currentPage = Math.min(requestedPage, totalPages);
  let rows = rowsInitial;

  if (rows.length === 0 && total > 0 && requestedPage > totalPages) {
    const fix = await withDb(() =>
      prisma.user.findMany({
        where,
        skip: (totalPages - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { nome: "asc" },
        select: userListSelect,
      }),
    );
    if (!fix.ok) return <DbOfflineNotice title="Colaboradores" />;
    rows = fix.data;
    currentPage = totalPages;
  }

  const data = rows.map(toListRow);
  const statusFilter = (sp.status ?? "").trim().toLowerCase();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Colaboradores</h1>
          <p className="text-muted-foreground">
            Listagem paginada com filtros. Para cadastro e edição completa, use a área de cadastros.
          </p>
        </div>
        <Link
          href="/colaboradores"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 no-underline")}
        >
          Ir para cadastro
        </Link>
      </div>

      <ColaboradoresDataTable
        data={data}
        totalPages={totalPages}
        currentPage={currentPage}
        statusFilter={statusFilter}
        empresas={empresas}
        departamentos={departamentos}
      />
    </div>
  );
}
