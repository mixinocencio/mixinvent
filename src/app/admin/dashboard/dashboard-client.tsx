"use client";

import type { ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { AlertTriangle, Laptop, LayoutGrid, Monitor, UserX, XCircle } from "lucide-react";
import type { DashboardFiltersInput, DashboardMetrics } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SELECT_ALL = "__all__";

/** Paleta Slate / Blue / Indigo — cores distintas por fatia/barra. */
const CHART_FILLS = [
  "#0f172a",
  "#1e3a5f",
  "#312e81",
  "#4338ca",
  "#3b82f6",
  "#2563eb",
  "#6366f1",
  "#64748b",
  "#94a3b8",
  "#4f46e5",
];

function colorAt(i: number) {
  return CHART_FILLS[i % CHART_FILLS.length]!;
}

type TooltipPayloadItem = {
  name?: string;
  value?: number;
  payload?: { name?: string; value?: number };
};

function ChartTooltipCount({
  active,
  payload,
  label,
  unit = "equipamentos",
}: {
  active?: boolean;
  payload?: readonly TooltipPayloadItem[] | TooltipPayloadItem[];
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]!;
  const title =
    (typeof item.payload?.name === "string" && item.payload.name) ||
    (typeof item.name === "string" && item.name) ||
    (label != null && String(label).length > 0 ? String(label) : null) ||
    "—";
  const count = typeof item.value === "number" ? item.value : Number(item.value ?? 0);
  return (
    <div className="rounded-lg border border-border/80 bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-muted-foreground mt-0.5 tabular-nums">
        <span className="font-semibold text-foreground">{count}</span> {unit}
      </p>
    </div>
  );
}

type Props = {
  initial: DashboardMetrics;
  companies: { id: string; nome: string }[];
  departments: { id: string; nome: string }[];
  currentFilters: DashboardFiltersInput;
};

function filtersToSearchParams(f: DashboardFiltersInput): URLSearchParams {
  const u = new URLSearchParams();
  const keys: (keyof DashboardFiltersInput)[] = [
    "companyId",
    "departmentId",
    "startDate",
    "endDate",
    "brand",
    "obsUnidade",
    "obsDepartamento",
  ];
  for (const k of keys) {
    const v = f[k];
    if (typeof v === "string" && v.trim()) u.set(k, v.trim());
  }
  return u;
}

function mergeFilters(
  base: DashboardFiltersInput,
  patch: Partial<Record<keyof DashboardFiltersInput, string | undefined>>,
): DashboardFiltersInput {
  const out: Record<string, string | undefined> = { ...base };
  for (const [k, v] of Object.entries(patch) as [
    keyof DashboardFiltersInput,
    string | undefined,
  ][]) {
    if (v == null || v === "" || v === SELECT_ALL) {
      delete out[k];
    } else {
      out[k] = v.trim();
    }
  }
  return out as DashboardFiltersInput;
}

function hasAnyFilter(f: DashboardFiltersInput): boolean {
  return Object.values(f).some((v) => typeof v === "string" && v.trim().length > 0);
}

type LegendEntry = { value?: string | number; color?: string };

function BrandDonutLegend({
  payload,
  onPick,
}: {
  payload?: readonly LegendEntry[];
  onPick: (brandName: string) => void;
}) {
  if (!payload?.length) return null;
  return (
    <ul className="mx-auto mt-2 flex max-w-full flex-wrap justify-center gap-x-4 gap-y-2 border-t border-border/60 px-2 pt-3 text-xs">
      {payload.map((entry: LegendEntry, i: number) => (
        <li
          key={`${String(entry.value)}-${i}`}
          className="flex min-w-0 max-w-[14rem] items-center gap-2 text-muted-foreground"
        >
          <span
            className="size-2.5 shrink-0 rounded-sm ring-1 ring-border/60"
            style={{ backgroundColor: entry.color }}
            aria-hidden
          />
          <button
            type="button"
            className="truncate text-left transition-colors hover:text-foreground hover:underline"
            onClick={() => onPick(String(entry.value))}
          >
            {entry.value}
          </button>
        </li>
      ))}
    </ul>
  );
}

function StaticDonutLegend({ payload }: { payload?: readonly LegendEntry[] }) {
  if (!payload?.length) return null;
  return (
    <ul className="mx-auto mt-2 flex max-w-full flex-wrap justify-center gap-x-4 gap-y-2 border-t border-border/60 px-2 pt-3 text-xs text-muted-foreground">
      {payload.map((entry: LegendEntry, i: number) => (
        <li
          key={`${String(entry.value)}-${i}`}
          className="flex min-w-0 max-w-[14rem] items-center gap-2"
        >
          <span
            className="size-2.5 shrink-0 rounded-sm ring-1 ring-border/60"
            style={{ backgroundColor: entry.color }}
            aria-hidden
          />
          <span className="truncate">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  value: number;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/80", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-heading text-2xl font-semibold tabular-nums">{value}</div>
        {description && <CardDescription className="mt-1 text-xs">{description}</CardDescription>}
      </CardContent>
    </Card>
  );
}

export function DashboardClient({
  initial,
  companies,
  departments,
  currentFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const data = initial;

  const pushFilters = (patch: Partial<Record<keyof DashboardFiltersInput, string | undefined>>) => {
    const next = mergeFilters(currentFilters, patch);
    const qs = filtersToSearchParams(next).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const showBarUnidade = !currentFilters.obsUnidade?.trim();
  const showPieDepartamento = !currentFilters.obsDepartamento?.trim();
  const pieData = data.porDepartamento.filter((d) => d.value > 0);
  const barUnidadeData = data.porUnidade.filter((d) => d.value > 0);
  const marcaData = data.porMarca.filter((d) => d.value > 0);
  const tipoData = data.porTipo.filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard gerencial</h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Filtros por empresa, setor e período (data de compra). Tipos de ativo são consolidados
              (Notebook / Desktop / demais). Clique nas fatias do gráfico de marcas, nas barras de
              departamento/unidade ou na legenda de marcas para refinar o painel.
            </p>
          </div>
          {hasAnyFilter(currentFilters) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => router.push(pathname)}
            >
              <XCircle className="size-4" />
              Limpar filtros
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="dash-company">Empresa</Label>
            <Select
              value={currentFilters.companyId ?? SELECT_ALL}
              onValueChange={(v) =>
                pushFilters({
                  companyId: v == null || v === SELECT_ALL ? undefined : v,
                })
              }
            >
              <SelectTrigger id="dash-company" className="w-full">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>Todas as empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="dash-dept">Setor (departamento do colaborador)</Label>
            <Select
              value={currentFilters.departmentId ?? SELECT_ALL}
              onValueChange={(v) =>
                pushFilters({
                  departmentId: v == null || v === SELECT_ALL ? undefined : v,
                })
              }
            >
              <SelectTrigger id="dash-dept" className="w-full">
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>Todos os setores</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dash-start">Data compra (de)</Label>
            <Input
              id="dash-start"
              type="date"
              value={currentFilters.startDate ?? ""}
              onChange={(e) =>
                pushFilters({ startDate: e.target.value || undefined })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dash-end">Data compra (até)</Label>
            <Input
              id="dash-end"
              type="date"
              value={currentFilters.endDate ?? ""}
              onChange={(e) =>
                pushFilters({ endDate: e.target.value || undefined })
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          title="Total de ativos"
          value={data.resumo.total}
          description="No escopo dos filtros ativos"
          icon={LayoutGrid}
        />
        <SummaryCard
          title="Notebooks"
          value={data.resumo.notebooks}
          description="Por categoria (nome)"
          icon={Laptop}
        />
        <SummaryCard
          title="Desktops"
          value={data.resumo.desktops}
          description="Inclui demais formatos"
          icon={Monitor}
        />
        <SummaryCard
          title="Alerta garantia"
          value={data.resumo.garantiasVencendo}
          description="Vencidas ou nos próximos 30 dias"
          icon={AlertTriangle}
          className="border-amber-500/20 bg-amber-500/5"
        />
        <Card
          className={cn(
            "border-border/80",
            data.resumo.riscoDesligados > 0 &&
              "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/35",
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={cn(
                "text-sm font-medium",
                data.resumo.riscoDesligados > 0 && "text-red-800 dark:text-red-200",
              )}
            >
              Equip. com desligados
            </CardTitle>
            <UserX
              className={cn(
                "size-4",
                data.resumo.riscoDesligados > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground",
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "font-heading text-2xl font-semibold tabular-nums",
                data.resumo.riscoDesligados > 0 && "text-red-700 dark:text-red-300",
              )}
            >
              {data.resumo.riscoDesligados}
            </div>
            <CardDescription
              className={cn(
                "mt-1 text-xs",
                data.resumo.riscoDesligados > 0 && "text-red-800/90 dark:text-red-200/90",
              )}
            >
              EM_USO com colaborador inativo no cadastro (respeita empresa / setor / demais filtros).
              {data.resumo.riscoDesligados > 0 ? (
                <>
                  {" "}
                  <Link
                    href="/admin/auditoria"
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "h-auto p-0 text-xs underline-offset-2",
                    )}
                  >
                    Abrir auditoria
                  </Link>
                </>
              ) : null}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Tipos de ativo (normalizados)</CardTitle>
          <CardDescription>
            Agrupa nomes de categoria (ex.: Laptop, Note Book → Notebook). Sem fatias duplicadas para
            o mesmo tipo consolidado.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[280px] pt-2">
          {tipoData.length === 0 ? (
            <p className="text-muted-foreground flex min-h-[220px] items-center justify-center text-sm">
              Nenhum ativo no escopo atual.
            </p>
          ) : (
            <div className="flex w-full flex-col">
              <div className="h-[min(300px,40vh)] min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                    <Pie
                      data={tipoData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius="48%"
                      outerRadius="78%"
                      paddingAngle={2}
                      label={false}
                    >
                      {tipoData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={colorAt(i)}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipCount
                          active={active}
                          payload={payload as unknown as TooltipPayloadItem[] | undefined}
                          label={label}
                        />
                      )}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      content={(props: { payload?: readonly LegendEntry[] }) => (
                        <StaticDonutLegend payload={props.payload} />
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Ativos por marca</CardTitle>
          <CardDescription>
            Donut interativo: clique na fatia ou no item da legenda para filtrar por marca (ex.: Dell).
            {currentFilters.brand ? (
              <span className="text-foreground mt-1 block text-xs font-medium">
                Filtro ativo: {currentFilters.brand}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] pt-2">
          {marcaData.length === 0 ? (
            <p className="text-muted-foreground flex min-h-[240px] items-center justify-center text-sm">
              Nenhuma marca no escopo atual.
            </p>
          ) : (
            <div className="flex w-full flex-col">
              <div className="h-[min(320px,42vh)] min-h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                    <Pie
                      data={marcaData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius="46%"
                      outerRadius="74%"
                      paddingAngle={2}
                      label={false}
                    >
                      {marcaData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={colorAt(i)}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                          style={{ cursor: "pointer" }}
                          onClick={() => pushFilters({ brand: entry.name })}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipCount
                          active={active}
                          payload={payload as unknown as TooltipPayloadItem[] | undefined}
                          label={label}
                        />
                      )}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      content={(props: { payload?: readonly LegendEntry[] }) => (
                        <BrandDonutLegend
                          payload={props.payload}
                          onPick={(name) => pushFilters({ brand: name })}
                        />
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div
        className={cn(
          "grid gap-6",
          showBarUnidade && showPieDepartamento ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {showBarUnidade && (
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle>Ativos por unidade (observações)</CardTitle>
              <CardDescription>
                Distribuição pelo campo extras.unidade no JSON de observações. Clique para filtrar.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-2">
              {barUnidadeData.length === 0 ? (
                <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  Nenhuma unidade registrada nas observações.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barUnidadeData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      interval={0}
                      angle={-28}
                      textAnchor="end"
                      height={72}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} width={36} />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipCount
                          active={active}
                          payload={payload as unknown as TooltipPayloadItem[] | undefined}
                          label={label}
                        />
                      )}
                    />
                    <Bar dataKey="value" name="Ativos" radius={[6, 6, 0, 0]}>
                      {barUnidadeData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={colorAt(i)}
                          style={{ cursor: "pointer" }}
                          onClick={() => pushFilters({ obsUnidade: entry.name })}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {showPieDepartamento && (
          <Card className={cn("border-border/80", !showBarUnidade && "mx-auto w-full max-w-3xl")}>
            <CardHeader>
              <CardTitle>Ativos por departamento (observações)</CardTitle>
              <CardDescription>
                Barras horizontais para nomes longos. Campo extras.departamento — clique na barra para
                filtrar.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[min(400px,55vh)] min-h-[280px] pt-2">
              {pieData.length === 0 ? (
                <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  Nenhum departamento registrado nas observações.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={pieData}
                    margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={148}
                      tick={{ fontSize: 10, fill: "#475569" }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipCount
                          active={active}
                          payload={payload as unknown as TooltipPayloadItem[] | undefined}
                          label={label}
                        />
                      )}
                    />
                    <Bar dataKey="value" name="Ativos" radius={[0, 4, 4, 0]}>
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={colorAt(i)}
                          style={{ cursor: "pointer" }}
                          onClick={() => pushFilters({ obsDepartamento: entry.name })}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
