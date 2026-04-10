"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Prisma } from "@prisma/client";

import { DataTable } from "@/components/ui/data-table";
import { AssetStatusBadge } from "@/lib/asset-status-badge";
import { AssetTableActions } from "@/components/equipamentos/asset-table-actions";

export type AssetListRow = Prisma.AssetGetPayload<{
  include: {
    category: true;
    brand: true;
    model: true;
    stockType: true;
    usuarioAtual: { select: { id: true; nome: true; email: true } };
  };
}>;

const columns: ColumnDef<AssetListRow>[] = [
  {
    accessorKey: "tagPatrimonio",
    meta: { label: "Tag" },
    header: "Tag",
    cell: ({ row }) => (
      <Link
        href={`/equipamentos/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.tagPatrimonio}
      </Link>
    ),
  },
  {
    id: "categoria",
    accessorFn: (row) => row.category.nome,
    meta: { label: "Categoria" },
    header: "Categoria",
    cell: ({ row }) => row.original.category.nome,
  },
  {
    id: "marca",
    accessorFn: (row) => row.brand.nome,
    meta: { label: "Marca" },
    header: "Marca",
    cell: ({ row }) => row.original.brand.nome,
  },
  {
    id: "modelo",
    accessorFn: (row) => row.model.nome,
    meta: { label: "Modelo" },
    header: "Modelo",
    cell: ({ row }) => row.original.model.nome,
  },
  {
    accessorKey: "hostname",
    meta: { label: "Hostname" },
    header: "Hostname",
    cell: ({ row }) => row.original.hostname ?? "—",
  },
  {
    id: "usuarioAtual",
    accessorFn: (row) => row.usuarioAtual?.nome ?? "",
    meta: { label: "Usuário atual" },
    header: "Usuário atual",
    cell: ({ row }) =>
      row.original.usuarioAtual ? (
        <span>{row.original.usuarioAtual.nome}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "status",
    accessorFn: (row) => row.status,
    meta: { label: "Status" },
    header: "Status",
    cell: ({ row }) => <AssetStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    meta: { label: "Ações" },
    header: () => <span className="sr-only">Ações</span>,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="text-right">
        <AssetTableActions
          asset={{
            id: row.original.id,
            tagPatrimonio: row.original.tagPatrimonio,
            status: row.original.status,
          }}
        />
      </div>
    ),
  },
];

export function EquipamentosTable({ data }: { data: AssetListRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="hostname"
      searchPlaceholder="Buscar por tag, hostname, série, modelo, marca, usuário…"
      emptyMessage="Nenhum equipamento encontrado para esta busca."
      emptyDataMessage="Nenhum equipamento cadastrado."
    />
  );
}
