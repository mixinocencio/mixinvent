"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { ExportButton } from "@/components/relatorios/export-button";
import type { AuditoriaGeralRow } from "@/lib/relatorios/auditoria-geral";

export type AuditoriaResumoRow = {
  SamAccountName: string;
  Nome: string;
  Cargo: string;
  Empresa: string;
  Departamento: string;
};

function displayCell(v: string) {
  return v === "" ? "—" : v;
}

const columns: ColumnDef<AuditoriaResumoRow>[] = [
  {
    accessorKey: "SamAccountName",
    meta: { label: "SamAccountName" },
    header: "SamAccountName",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{displayCell(row.original.SamAccountName)}</span>
    ),
  },
  {
    accessorKey: "Nome",
    meta: { label: "Nome" },
    header: "Nome",
    cell: ({ row }) => <span className="font-medium">{displayCell(row.original.Nome)}</span>,
  },
  {
    accessorKey: "Cargo",
    meta: { label: "Cargo" },
    header: "Cargo",
    cell: ({ row }) => displayCell(row.original.Cargo),
  },
  {
    accessorKey: "Empresa",
    meta: { label: "Empresa" },
    header: "Empresa",
    cell: ({ row }) => displayCell(row.original.Empresa),
  },
  {
    accessorKey: "Departamento",
    meta: { label: "Departamento" },
    header: "Departamento",
    cell: ({ row }) => displayCell(row.original.Departamento),
  },
];

export function AuditoriaResumoView({
  tableData,
  exportData,
}: {
  tableData: AuditoriaResumoRow[];
  exportData: AuditoriaGeralRow[];
}) {
  return (
    <DataTable
      columns={columns}
      data={tableData}
      searchKey="Nome"
      searchPlaceholder="Buscar por nome, SamAccountName, cargo, empresa, departamento…"
      emptyMessage="Nenhum registro encontrado para esta busca."
      emptyDataMessage="Nenhum registro para exibir."
      toolbarEnd={<ExportButton data={exportData} />}
    />
  );
}
