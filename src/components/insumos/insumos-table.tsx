"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Prisma } from "@prisma/client";

import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { InsumoRowActions } from "@/components/insumos/insumo-actions";
import type { CategoriaInsumoOption } from "@/components/insumos/insumo-form";

export type InsumoListRow = Prisma.ConsumableGetPayload<{
  include: { category: true };
}>;

function buildColumns(categorias: CategoriaInsumoOption[]): ColumnDef<InsumoListRow>[] {
  return [
    {
      accessorKey: "nome",
      meta: { label: "Nome" },
      header: "Nome",
      cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
    },
    {
      id: "categoria",
      accessorFn: (row) => row.category.nome,
      meta: { label: "Categoria" },
      header: "Categoria",
      cell: ({ row }) => row.original.category.nome,
    },
    {
      accessorKey: "estoqueMinimo",
      meta: { label: "Estoque mínimo" },
      header: "Estoque mínimo",
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">{row.original.estoqueMinimo}</span>
      ),
    },
    {
      accessorKey: "quantidadeEstoque",
      meta: { label: "Estoque atual" },
      header: "Estoque atual",
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">{row.original.quantidadeEstoque}</span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) =>
        row.quantidadeEstoque <= row.estoqueMinimo ? "Estoque Baixo" : "Normal",
      meta: { label: "Status" },
      header: "Status",
      cell: ({ row }) => {
        const baixo = row.original.quantidadeEstoque <= row.original.estoqueMinimo;
        return baixo ? (
          <Badge variant="destructive">Estoque Baixo</Badge>
        ) : (
          <Badge variant="outline">Normal</Badge>
        );
      },
    },
    {
      id: "actions",
      meta: { label: "Ações" },
      header: () => <span className="sr-only">Ações</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="text-right">
          <InsumoRowActions item={row.original} categorias={categorias} />
        </div>
      ),
    },
  ];
}

export function InsumosTable({
  data,
  categorias,
}: {
  data: InsumoListRow[];
  categorias: CategoriaInsumoOption[];
}) {
  const columns = React.useMemo(() => buildColumns(categorias), [categorias]);
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="nome"
      searchPlaceholder="Buscar por nome, categoria, estoque…"
      emptyMessage="Nenhum insumo encontrado para esta busca."
      emptyDataMessage="Nenhum insumo cadastrado. Cadastre categorias do tipo Insumo e clique em Novo Insumo."
    />
  );
}
