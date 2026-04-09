"use client";

import { Suspense, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Table as TanStackTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Columns3, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchInput } from "@/components/ui/search-input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { cn } from "@/lib/utils";
import { exportColaboradoresAuditoriaCsv } from "@/app/admin/colaboradores/export-actions";
import { ColaboradorRowActions, type ColaboradorRow } from "@/components/colaboradores/colaborador-actions";
import type { DepartamentoOption, EmpresaOption } from "@/components/colaboradores/colaborador-form";

export type ColaboradorListRow = ColaboradorRow & {
  departamentoLabel: string | null;
  statusLabel: string;
  entraId: string | null;
};

const STATUS_ALL = "__all__";

/** Rótulos do menu Colunas (sempre string — evita quebrar com header ReactNode). */
const COLUMN_MENU_LABELS: Record<string, string> = {
  nome: "Nome",
  email: "E-mail",
  departamento: "Departamento",
  cargo: "Cargo",
  status: "Status",
  entraId: "Entra ID",
};

function StatusColaboradorFilter({ statusFilter }: { statusFilter: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pushStatus = (value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value === STATUS_ALL || value === "") {
      p.delete("status");
    } else {
      p.set("status", value);
    }
    p.delete("page");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const selectValue =
    statusFilter === "ativo" || statusFilter === "inativo" ? statusFilter : STATUS_ALL;

  return (
    <div className="grid w-full gap-2 sm:w-48">
      <Label htmlFor="colab-status-filter">Status</Label>
      <Select value={selectValue} onValueChange={(v) => pushStatus(v ?? STATUS_ALL)}>
        <SelectTrigger id="colab-status-filter" className="w-full">
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={STATUS_ALL}>Todos</SelectItem>
          <SelectItem value="ativo">Ativos</SelectItem>
          <SelectItem value="inativo">Inativos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function formatYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function AuditoriaCsvExportButton() {
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 shrink-0"
      disabled={pending}
      onClick={() => {
        const q = searchParams.get("q") ?? undefined;
        const status = searchParams.get("status") ?? undefined;
        startTransition(async () => {
          const r = await exportColaboradoresAuditoriaCsv({ q, status });
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `relatorio_auditoria_usuarios_${formatYmdLocal(new Date())}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Exportar Relatório (CSV)
    </Button>
  );
}

function ColumnToggle({
  table,
}: {
  table: TanStackTable<ColaboradorListRow>;
}) {
  const hideableLeafColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && column.id.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 shrink-0")}
      >
        <Columns3 className="size-4" />
        Colunas
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          {hideableLeafColumns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(checked) => {
                column.toggleVisibility(checked === true);
              }}
            >
              {COLUMN_MENU_LABELS[column.id] ?? column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ColaboradoresDataTable({
  data,
  totalPages,
  currentPage,
  statusFilter,
  empresas,
  departamentos,
}: {
  data: ColaboradorListRow[];
  totalPages: number;
  currentPage: number;
  statusFilter: string;
  empresas: EmpresaOption[];
  departamentos: DepartamentoOption[];
}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    entraId: false,
  });

  const columns = useMemo<ColumnDef<ColaboradorListRow>[]>(
    () => [
      {
        id: "nome",
        accessorKey: "nome",
        header: "Nome",
        enableHiding: false,
        cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
      },
      {
        id: "email",
        accessorKey: "email",
        header: "E-mail",
        enableHiding: false,
      },
      {
        id: "departamento",
        accessorKey: "departamentoLabel",
        header: "Departamento",
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        id: "cargo",
        accessorKey: "cargo",
        header: "Cargo",
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        id: "status",
        accessorKey: "statusLabel",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
              row.original.statusLabel === "Ativo"
                ? "border-transparent bg-secondary text-secondary-foreground"
                : "text-muted-foreground",
            )}
          >
            {row.original.statusLabel}
          </span>
        ),
      },
      {
        id: "entraId",
        accessorKey: "entraId",
        header: "Entra ID",
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return v ? <span className="font-mono text-xs break-all">{v}</span> : "—";
        },
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <span className="text-right block w-full">Ações</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ColaboradorRowActions
              item={row.original}
              empresas={empresas}
              departamentos={departamentos}
            />
          </div>
        ),
      },
    ],
    [empresas, departamentos],
  );

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <Suspense
            fallback={<div className="h-9 max-w-md flex-1 animate-pulse rounded-lg bg-muted" aria-hidden />}
          >
            <SearchInput
              placeholder="Buscar por nome, e-mail, departamento ou cargo…"
              className="min-w-[min(100%,18rem)] flex-1 sm:max-w-md"
            />
          </Suspense>
          <Suspense
            fallback={<div className="h-8 w-48 animate-pulse rounded-lg bg-muted" aria-hidden />}
          >
            <StatusColaboradorFilter statusFilter={statusFilter} />
          </Suspense>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense
            fallback={
              <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0" disabled>
                <Download className="size-4" />
                Exportar Relatório (CSV)
              </Button>
            }
          >
            <AuditoriaCsvExportButton />
          </Suspense>
          <ColumnToggle table={table} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(1, table.getVisibleLeafColumns().length)}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="max-w-[min(100vw,22rem)] align-top">
                      <div className="break-words">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Suspense
        fallback={
          <div className="text-muted-foreground flex h-10 items-center text-sm">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Carregando paginação…
          </div>
        }
      >
        <PaginationControls currentPage={currentPage} totalPages={totalPages} />
      </Suspense>
    </div>
  );
}
