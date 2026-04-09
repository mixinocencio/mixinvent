import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { AssetForm } from "@/components/equipamentos/asset-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function NovoEquipamentoPage() {
  const r = await withDb(() =>
    Promise.all([
      prisma.category.findMany({
        where: { tipo: "PATRIMONIO" },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),
      prisma.company.findMany({
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),
      prisma.brand.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
      prisma.deviceModel.findMany({
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, brandId: true, brand: { select: { nome: true } } },
      }),
      prisma.stockType.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    ]),
  );
  if (!r.ok) return <DbOfflineNotice title="Novo equipamento" />;
  const [categorias, empresas, marcas, modelosRaw, tiposEstoque] = r.data;

  const modelos = modelosRaw.map((m) => ({
    id: m.id,
    nome: m.nome,
    brandId: m.brandId,
    brandNome: m.brand.nome,
  }));

  const missingDeps: string[] = [];
  if (categorias.length === 0) missingDeps.push("categoria do tipo Patrimônio");
  if (empresas.length === 0) missingDeps.push("empresa");
  if (marcas.length === 0) missingDeps.push("marca");
  if (modelos.length === 0) missingDeps.push("modelo");
  if (tiposEstoque.length === 0) missingDeps.push("tipo de estoque");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/equipamentos"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1 px-0")}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Novo equipamento</h1>
          <p className="text-muted-foreground">Cadastro completo do ativo de TI.</p>
        </div>
      </div>
      {missingDeps.length > 0 ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          Cadastre ao menos uma <strong>{missingDeps.join(", ")}</strong> antes de incluir
          equipamentos.
        </p>
      ) : (
        <AssetForm
          categorias={categorias}
          empresas={empresas}
          marcas={marcas}
          modelos={modelos}
          tiposEstoque={tiposEstoque}
        />
      )}
    </div>
  );
}
