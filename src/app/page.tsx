import Link from "next/link";
import type { AssetLogAcao, AssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPrismaAppBlockedError, isPrismaMigrateLikelyNeeded } from "@/lib/is-prisma-app-blocked";
import {
  evalWarranty,
  linearDepreciatedAmount,
  warrantyExpiresWithinWindow,
} from "@/lib/dashboard-metrics";
import { startOfDayLocal } from "@/lib/warranty-dates";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricHelp } from "@/components/dashboard/metric-help";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  Monitor,
  Package,
  PackageX,
  Receipt,
  ShieldAlert,
  ShoppingCart,
  UserCheck,
} from "lucide-react";

const moneyFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function labelStatus(s: AssetStatus): string {
  switch (s) {
    case "DISPONIVEL":
      return "Disponível";
    case "EM_USO":
      return "Em uso";
    case "MANUTENCAO":
      return "Manutenção";
    case "SUCATA":
      return "Sucata";
    default:
      return s;
  }
}

function labelAcaoLog(acao: AssetLogAcao): string {
  switch (acao) {
    case "CHECKOUT":
      return "Checkout";
    case "CHECKIN":
      return "Check-in";
    case "MANUTENCAO":
      return "Manutenção";
    default:
      return acao;
  }
}

const STATUS_ORDER: AssetStatus[] = ["DISPONIVEL", "EM_USO", "MANUTENCAO", "SUCATA"];

export default async function DashboardPage() {
  let dbOffline = false;
  let suggestMigrate = false;

  let totalAtivos = 0;
  let sumValorPatrimonio = 0;
  let sumDepreciacaoEstimada = 0;
  let emUso = 0;
  let garantiasProximos60 = 0;
  let insumosCriticosCount = 0;
  let statusCounts: Record<AssetStatus, number> = {
    DISPONIVEL: 0,
    EM_USO: 0,
    MANUTENCAO: 0,
    SUCATA: 0,
  };
  let consumables: {
    id: string;
    nome: string;
    quantidadeEstoque: number;
    estoqueMinimo: number;
  }[] = [];
  let categoriasPat: { id: string; nome: string; count: number }[] = [];
  let ultimosLogs: {
    id: string;
    acao: AssetLogAcao;
    dataMovimentacao: Date;
    observacao: string | null;
    userNome: string;
    tagPatrimonio: string;
    assetId: string;
  }[] = [];

  let bannerCritico = false;
  let bannerDetalhes: string[] = [];

  try {
    const todayStart = startOfDayLocal(new Date());
    const janelaGarantiaFim = startOfDayLocal(new Date());
    janelaGarantiaFim.setDate(janelaGarantiaFim.getDate() + 60);

    const [
      aggAssets,
      statusGroups,
      consumablesRaw,
      logsRaw,
      categoriesRaw,
      assetsForMetrics,
    ] = await Promise.all([
      prisma.asset.aggregate({
        _sum: { valor: true },
        _count: { _all: true },
      }),
      prisma.asset.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.consumable.findMany({
        select: {
          id: true,
          nome: true,
          quantidadeEstoque: true,
          estoqueMinimo: true,
        },
      }),
      prisma.assetLog.findMany({
        take: 5,
        orderBy: { dataMovimentacao: "desc" },
        include: {
          user: { select: { nome: true } },
          asset: { select: { id: true, tagPatrimonio: true } },
        },
      }),
      prisma.category.findMany({
        where: { tipo: "PATRIMONIO" },
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          _count: { select: { assets: true } },
        },
      }),
      prisma.asset.findMany({
        select: {
          dataCompra: true,
          valor: true,
          model: { select: { mesesGarantia: true, mesesDepreciacao: true } },
        },
      }),
    ]);

    totalAtivos = aggAssets._count._all;
    sumValorPatrimonio = Number(aggAssets._sum.valor ?? 0);

    for (const row of statusGroups) {
      statusCounts[row.status] = row._count._all;
    }
    emUso = statusCounts.EM_USO;

    consumables = consumablesRaw.map((c) => ({
      id: c.id,
      nome: c.nome,
      quantidadeEstoque: c.quantidadeEstoque,
      estoqueMinimo: c.estoqueMinimo,
    }));

    insumosCriticosCount = consumables.filter((c) => c.quantidadeEstoque < c.estoqueMinimo).length;

    categoriasPat = categoriesRaw.map((c) => ({
      id: c.id,
      nome: c.nome,
      count: c._count.assets,
    }));

    ultimosLogs = logsRaw.map((l) => ({
      id: l.id,
      acao: l.acao,
      dataMovimentacao: l.dataMovimentacao,
      observacao: l.observacao,
      userNome: l.user.nome,
      tagPatrimonio: l.asset.tagPatrimonio,
      assetId: l.asset.id,
    }));

    let anyGarantiaVenceHoje = false;
    for (const a of assetsForMetrics) {
      const v = a.valor != null ? Number(a.valor) : 0;
      sumDepreciacaoEstimada += linearDepreciatedAmount(
        v,
        a.dataCompra,
        a.model.mesesDepreciacao,
        todayStart,
      );

      const dc = a.dataCompra;
      const mesesG = a.model.mesesGarantia;
      if (dc && mesesG != null && mesesG > 0) {
        const w = evalWarranty(dc, mesesG, todayStart);
        if (w) {
          if (warrantyExpiresWithinWindow(w, todayStart, janelaGarantiaFim)) {
            garantiasProximos60 += 1;
          }
          if (w.fimStart.getTime() === todayStart.getTime()) {
            anyGarantiaVenceHoje = true;
          }
        }
      }
    }

    const anyInsumoZero = consumables.some((c) => c.quantidadeEstoque === 0);
    if (anyInsumoZero) {
      bannerCritico = true;
      const zeros = consumables.filter((c) => c.quantidadeEstoque === 0).map((c) => c.nome);
      bannerDetalhes.push(`Insumo(s) com estoque zero: ${zeros.slice(0, 4).join(", ")}${zeros.length > 4 ? "…" : ""}.`);
    }
    if (anyGarantiaVenceHoje) {
      bannerCritico = true;
      bannerDetalhes.push("Há equipamento(s) com término de garantia hoje (último dia de cobertura).");
    }
  } catch (e) {
    console.error("[dashboard]", e);
    if (isPrismaAppBlockedError(e)) {
      dbOffline = true;
      suggestMigrate = isPrismaMigrateLikelyNeeded(e);
    } else {
      throw e;
    }
  }

  const maxCat = categoriasPat.reduce((m, c) => Math.max(m, c.count), 0) || 1;
  const totalAssetsForPct = totalAtivos || 1;

  const dimmed = dbOffline && "pointer-events-none opacity-60";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Painel executivo</h1>
        <p className="text-muted-foreground">
          Indicadores de patrimônio, garantias, estoque e atividade — visão alinhada a inventário corporativo.
        </p>
      </div>

      {dbOffline && (
        <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
          <Database className="size-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-medium">Banco de dados indisponível</p>
            <p className="text-amber-900/90 dark:text-amber-100/90">
              O Next.js está no ar, mas o Prisma não conseguiu usar o banco. Confira se o PostgreSQL está
              rodando (<code className="rounded bg-background/60 px-1">npm run db:up</code>) e se{" "}
              <code className="rounded bg-background/60 px-1">DATABASE_URL</code> no{" "}
              <code className="rounded bg-background/60 px-1">.env</code> aponta para{" "}
              <code className="rounded bg-background/60 px-1">localhost:5432</code>.
            </p>
            {suggestMigrate && (
              <p className="pt-2 text-amber-900/90 dark:text-amber-100/90">
                Parece que as tabelas ainda não existem. No terminal, na pasta do projeto, rode:{" "}
                <code className="rounded bg-background/60 px-1">npx prisma migrate dev --name init</code> e, se
                quiser dados de exemplo,{" "}
                <code className="rounded bg-background/60 px-1">npm run db:seed</code>.
              </p>
            )}
          </div>
        </div>
      )}

      {!dbOffline && bannerCritico && (
        <Alert variant="destructive">
          <ShieldAlert className="size-4" />
          <AlertTitle>Atenção: situação crítica</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {bannerDetalhes.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/insumos"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-destructive/50")}
              >
                Revisar insumos
              </Link>
              <Link
                href="/equipamentos"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-destructive/50")}
              >
                Revisar equipamentos
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className={cn("grid gap-6 sm:grid-cols-2 xl:grid-cols-4", dimmed)}>
        <Card className="overflow-visible rounded-xl border-blue-500/20 bg-gradient-to-br from-blue-500/[0.07] to-transparent ring-1 ring-blue-500/10">
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Patrimônio</CardTitle>
              <MetricHelp label="Valor total: soma do campo valor de todos os ativos. A depreciação estimada usa o modelo do equipamento: meses de vida útil (mesesDepreciacao) e depreciação linear por mês completo desde a data de compra, limitada a 100% do valor de aquisição." />
            </div>
            <Layers className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight text-blue-800 dark:text-blue-200">
              {dbOffline ? "—" : moneyFmt.format(sumValorPatrimonio)}
            </p>
            <p className="text-muted-foreground text-xs">
              {dbOffline ? "—" : `${totalAtivos} ativo(s) cadastrado(s)`}
            </p>
            <div className="border-border/80 border-t pt-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Depreciação estimada (acum.)</span>
                <MetricHelp label="Para cada ativo com valor, data de compra e meses de depreciação no modelo: (valor ÷ meses de vida) × meses completos decorridos, sem ultrapassar o valor original. Apenas referência gerencial, não substitui política contábil." />
              </div>
              <p className="mt-0.5 font-medium tabular-nums text-foreground">
                {dbOffline ? "—" : moneyFmt.format(sumDepreciacaoEstimada)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible rounded-xl border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-transparent ring-1 ring-emerald-500/10">
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Operacionais</CardTitle>
              <MetricHelp label="Quantidade de ativos com status Em uso (vinculados a um colaborador no sistema)." />
            </div>
            <UserCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-heading text-2xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
              {dbOffline ? "—" : emUso}
            </p>
            <CardDescription className="text-xs">Ativos em uso no momento</CardDescription>
            <div className="space-y-1.5 border-border/80 border-t pt-2">
              <p className="text-muted-foreground text-xs font-medium">Distribuição por status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((st) => (
                  <Badge
                    key={st}
                    variant="outline"
                    className="border-border/80 tabular-nums text-[0.7rem] font-normal"
                  >
                    {labelStatus(st)}: {dbOffline ? "—" : statusCounts[st]}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "overflow-visible rounded-xl border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] to-transparent ring-1 ring-amber-500/15",
            !dbOffline && garantiasProximos60 > 0 && "ring-amber-500/35",
          )}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Garantias a vencer</CardTitle>
              <MetricHelp label="Equipamentos cuja data de término da garantia (data de compra + meses de garantia do modelo) cai entre hoje e os próximos 60 dias." />
            </div>
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "font-heading text-2xl font-semibold tabular-nums",
                !dbOffline && garantiasProximos60 > 0
                  ? "text-amber-900 dark:text-amber-200"
                  : "text-muted-foreground",
              )}
            >
              {dbOffline ? "—" : garantiasProximos60}
            </p>
            <CardDescription className="mt-1 text-xs">Janela: próximos 60 dias</CardDescription>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "overflow-visible rounded-xl border-red-500/20 bg-gradient-to-br from-red-500/[0.06] to-transparent ring-1 ring-red-500/10",
            !dbOffline && insumosCriticosCount > 0 && "ring-red-500/30",
          )}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Insumos críticos</CardTitle>
              <MetricHelp label="Insumos com quantidade em estoque estritamente abaixo do estoque mínimo configurado (recompra recomendada)." />
            </div>
            <PackageX className="size-4 shrink-0 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "font-heading text-2xl font-semibold tabular-nums",
                !dbOffline && insumosCriticosCount > 0 ? "text-red-800 dark:text-red-300" : "text-muted-foreground",
              )}
            >
              {dbOffline ? "—" : insumosCriticosCount}
            </p>
            <CardDescription className="mt-1 text-xs">Abaixo do mínimo</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className={cn("grid gap-6 lg:grid-cols-2", dimmed)}>
        <Card className="rounded-xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Últimas atividades</CardTitle>
            <CardDescription>Últimos 5 registros de movimentação de patrimônio</CardDescription>
          </CardHeader>
          <CardContent>
            {dbOffline ? (
              <p className="text-muted-foreground text-sm">—</p>
            ) : ultimosLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum log registrado ainda.</p>
            ) : (
              <ul className="space-y-3">
                {ultimosLogs.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-medium">
                        {labelAcaoLog(l.acao)}
                      </Badge>
                      <time
                        className="text-muted-foreground text-xs tabular-nums"
                        dateTime={l.dataMovimentacao.toISOString()}
                      >
                        {dateTimeFmt.format(l.dataMovimentacao)}
                      </time>
                    </div>
                    <p className="mt-1.5 text-foreground">
                      <span className="text-muted-foreground">Usuário:</span>{" "}
                      <span className="font-medium">{l.userNome}</span>
                      {" · "}
                      <span className="text-muted-foreground">Equipamento:</span>{" "}
                      <Link
                        href={`/equipamentos/${l.assetId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {l.tagPatrimonio}
                      </Link>
                    </p>
                    {l.observacao ? (
                      <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{l.observacao}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Distribuição por categoria</CardTitle>
            <CardDescription>Ativos por categoria de patrimônio (Notebook, Desktop, etc.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dbOffline ? (
              <p className="text-muted-foreground text-sm">—</p>
            ) : categoriasPat.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma categoria de patrimônio cadastrada.</p>
            ) : (
              <ul className="space-y-3">
                {categoriasPat.map((c) => {
                  const pct = Math.round((100 * c.count) / maxCat);
                  const share = Math.round((100 * c.count) / totalAssetsForPct);
                  return (
                    <li key={c.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{c.nome}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground text-xs">
                          {c.count} ({share}% do total)
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={c.count}
                        aria-valuemin={0}
                        aria-valuemax={maxCat}
                      >
                        <div
                          className="h-full rounded-full bg-primary/80 transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", dimmed)}>
        <Link
          href="/compras/nova"
          className={cn(
            buttonVariants({ variant: "outline", className: "justify-between gap-2 rounded-xl" }),
            "no-underline",
          )}
        >
          <span className="flex items-center gap-2">
            <Receipt className="size-4" />
            Entrada por NF
          </span>
          <ArrowRight className="size-4 opacity-60" />
        </Link>
        <Link
          href="/equipamentos/novo"
          className={cn(
            buttonVariants({ variant: "outline", className: "justify-between gap-2 rounded-xl" }),
            "no-underline",
          )}
        >
          <span className="flex items-center gap-2">
            <Monitor className="size-4" />
            Novo equipamento
          </span>
          <ArrowRight className="size-4 opacity-60" />
        </Link>
        <Link
          href="/insumos"
          className={cn(
            buttonVariants({ variant: "outline", className: "justify-between gap-2 rounded-xl" }),
            "no-underline",
          )}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="size-4" />
            Insumos
          </span>
          <ArrowRight className="size-4 opacity-60" />
        </Link>
        <Link
          href="/equipamentos"
          className={cn(
            buttonVariants({ variant: "outline", className: "justify-between gap-2 rounded-xl" }),
            "no-underline",
          )}
        >
          <span className="flex items-center gap-2">
            <Package className="size-4" />
            Equipamentos
          </span>
          <ArrowRight className="size-4 opacity-60" />
        </Link>
      </div>
    </div>
  );
}
