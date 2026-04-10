"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Search } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 50] as const;

function collectSearchableText(value: unknown, depth = 0): string {
  if (depth > 4) return "";
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => collectSearchableText(v, depth + 1)).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((v) => collectSearchableText(v, depth + 1))
      .join(" ");
  }
  return "";
}

function defaultGlobalFilter<TData>(row: Row<TData>, _columnId: string, filterValue: unknown): boolean {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const haystack = collectSearchableText(row.original).toLowerCase();
  return haystack.includes(q);
}

function searchKeyGlobalFilter<TData>(
  searchKey: string,
  row: Row<TData>,
  _columnId: string,
  filterValue: unknown,
): boolean {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  try {
    const primary = String(row.getValue(searchKey) ?? "").toLowerCase();
    if (primary.includes(q)) return true;
  } catch {
    /* coluna pode não existir como accessor */
  }
  return defaultGlobalFilter(row, _columnId, filterValue);
}

function columnHeaderLabel<TData, TValue>(column: Column<TData, TValue>): string {
  const meta = column.columnDef.meta as { label?: string } | undefined;
  if (meta?.label) return meta.label;
  const h = column.columnDef.header;
  if (typeof h === "string") return h;
  return column.id;
}

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Coluna usada como foco da busca (accessorKey / id); a filtragem continua abrangendo o registro. */
  searchKey?: string;
  searchPlaceholder?: string;
  /** Texto quando não há linhas após filtro */
  emptyMessage?: string;
  /** Texto quando `data` está vazio */
  emptyDataMessage?: string;
  className?: string;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  emptyMessage = "Nenhum resultado encontrado.",
  emptyDataMessage = "Nenhum registro cadastrado.",
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const globalFilterFn = React.useMemo(
    () =>
      searchKey
        ? (row: Row<TData>, columnId: string, value: unknown) =>
            searchKeyGlobalFilter<TData>(searchKey, row, columnId, value)
        : defaultGlobalFilter<TData>,
    [searchKey],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
    },
  });

  React.useEffect(() => {
    table.setPageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apenas reagir à busca; `table` é estável o suficiente
  }, [globalFilter]);

  const hasData = data.length > 0;
  const filteredRows = table.getFilteredRowModel().rows.length;

  const placeholder =
    searchPlaceholder ??
    (searchKey ? `Buscar… (inclui ${searchKey} e demais campos)` : "Buscar em todas as colunas…");

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={placeholder}
            className="h-9 pl-9"
            aria-label={placeholder}
            autoComplete="off"
          />
        </div>
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
              <DropdownMenuLabel>Visibilidade</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().map((column) => {
                if (!column.getCanHide()) return null;
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  >
                    {columnHeaderLabel(column)}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={cn(header.column.id === "actions" && "w-12 text-right")}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-0 py-1 text-left font-medium hover:text-foreground",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        ) : header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        ) : (
                          <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {!hasData ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyDataMessage}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasData ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {filteredRows === 0 ? (
              "0 resultados"
            ) : (
              <>
                Mostrando{" "}
                <span className="font-medium text-foreground">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>
                {" – "}
                <span className="font-medium text-foreground">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    filteredRows,
                  )}
                </span>{" "}
                de <span className="font-medium text-foreground">{filteredRows}</span> resultado(s)
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm whitespace-nowrap">Linhas</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(v) => {
                  table.setPageSize(Number(v));
                  table.setPageIndex(0);
                }}
              >
                <SelectTrigger className="h-8 w-[4.5rem]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
