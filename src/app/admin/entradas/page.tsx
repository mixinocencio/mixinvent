import Link from "next/link";
import { ArrowLeft, ListPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntradaRapidaForm } from "./entrada-rapida-form";

export default async function AdminEntradasPage() {
  const [categorias, empresas, marcas, modelosRaw, tiposEstoque] = await Promise.all([
    prisma.category.findMany({
      where: { tipo: "PATRIMONIO" },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.company.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.brand.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.deviceModel.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, brandId: true },
    }),
    prisma.stockType.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  const modelos = modelosRaw.map((m) => ({
    id: m.id,
    nome: m.nome,
    brandId: m.brandId,
  }));

  const bloqueado =
    categorias.length === 0 ||
    empresas.length === 0 ||
    marcas.length === 0 ||
    modelos.length === 0 ||
    tiposEstoque.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/dashboard"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1 px-0")}
        >
          <ArrowLeft className="size-4" />
          Voltar ao dashboard
        </Link>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ListPlus className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Nova entrada (NF)</h1>
            <p className="text-muted-foreground">
              Cadastro rápido mestre-detalhe: uma nota fiscal e vários patrimônios na mesma operação.
            </p>
          </div>
        </div>
      </div>

      {bloqueado ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Cadastre ao menos uma categoria de <strong>Patrimônio</strong>, empresa, marca, modelo e tipo de
          estoque antes de usar esta tela.
        </div>
      ) : (
        <EntradaRapidaForm
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
