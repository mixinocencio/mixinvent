import { prisma } from "@/lib/prisma";
import { isPrismaAppBlockedError, isPrismaMigrateLikelyNeeded } from "@/lib/is-prisma-app-blocked";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Monitor, Wrench, Database } from "lucide-react";

export default async function DashboardPage() {
  let totalEquipamentos = 0;
  let emUso = 0;
  let manutencao = 0;
  let totalInsumos = 0;
  let qtdInsumosItens = 0;
  let dbOffline = false;
  let suggestMigrate = false;

  try {
    const [t, u, m, ins, consumablesAgg] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "EM_USO" } }),
      prisma.asset.count({ where: { status: "MANUTENCAO" } }),
      prisma.consumable.count(),
      prisma.consumable.aggregate({ _sum: { quantidadeEstoque: true } }),
    ]);
    totalEquipamentos = t;
    emUso = u;
    manutencao = m;
    totalInsumos = ins;
    qtdInsumosItens = consumablesAgg._sum.quantidadeEstoque ?? 0;
  } catch (e) {
    console.error("[dashboard]", e);
    if (isPrismaAppBlockedError(e)) {
      dbOffline = true;
      suggestMigrate = isPrismaMigrateLikelyNeeded(e);
    } else {
      throw e;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-muted-foreground">Visão geral dos equipamentos e insumos.</p>
      </div>

      {dbOffline && (
        <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
          <Database className="size-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-medium">Banco de dados indisponível</p>
            <p className="text-amber-900/90 dark:text-amber-100/90">
              O Next.js está no ar, mas o Prisma não conseguiu usar o banco. Confira se o PostgreSQL
              está rodando (<code className="rounded bg-background/60 px-1">npm run db:up</code>) e se{" "}
              <code className="rounded bg-background/60 px-1">DATABASE_URL</code> no{" "}
              <code className="rounded bg-background/60 px-1">.env</code> aponta para{" "}
              <code className="rounded bg-background/60 px-1">localhost:5432</code>.
            </p>
            {suggestMigrate && (
              <p className="pt-2 text-amber-900/90 dark:text-amber-100/90">
                Parece que as tabelas ainda não existem. No terminal, na pasta do projeto, rode:{" "}
                <code className="rounded bg-background/60 px-1">npx prisma migrate dev --name init</code>{" "}
                e, se quiser dados de exemplo,{" "}
                <code className="rounded bg-background/60 px-1">npm run db:seed</code>.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={dbOffline ? "opacity-70" : undefined}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Equipamentos (total)</CardTitle>
            <Monitor className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{dbOffline ? "—" : totalEquipamentos}</p>
            <CardDescription className="mt-1">Cadastro de ativos</CardDescription>
          </CardContent>
        </Card>
        <Card className={dbOffline ? "opacity-70" : undefined}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em uso</CardTitle>
            <Monitor className="size-4 text-blue-500/80" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
              {dbOffline ? "—" : emUso}
            </p>
            <CardDescription className="mt-1">Alocados a colaboradores</CardDescription>
          </CardContent>
        </Card>
        <Card className={dbOffline ? "opacity-70" : undefined}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
            <Wrench className="size-4 text-amber-500/80" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
              {dbOffline ? "—" : manutencao}
            </p>
            <CardDescription className="mt-1">Fora da operação</CardDescription>
          </CardContent>
        </Card>
        <Card className={dbOffline ? "opacity-70" : undefined}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Insumos</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{dbOffline ? "—" : totalInsumos}</p>
            <CardDescription className="mt-1">
              {dbOffline
                ? "Conecte o banco para ver os totais"
                : `SKUs cadastrados · ${qtdInsumosItens} unidades em estoque`}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
