import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { NovaEntradaCompraForm } from "@/components/compras/nova-entrada-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function NovaCompraPage() {
  const r = await withDb(() =>
    Promise.all([
      prisma.supplier.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, cnpj: true },
      }),
      prisma.deviceModel.findMany({
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, isSerialized: true, brand: { select: { nome: true } } },
      }),
      prisma.consumable.findMany({
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),
      prisma.category.findMany({
        where: { tipo: "PATRIMONIO" },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),
      prisma.company.findMany({
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),
      prisma.stockType.findMany({
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),
    ]),
  );

  if (!r.ok) return <DbOfflineNotice title="Nova entrada por NF" />;

  const [fornecedores, modelosRaw, insumos, categorias, empresas, tiposEstoque] = r.data;

  const modelos = modelosRaw.map((m) => ({
    id: m.id,
    nome: m.nome,
    brandNome: m.brand.nome,
    isSerialized: m.isSerialized,
  }));

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
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
            <Receipt className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Entrada por nota fiscal</h1>
            <p className="text-muted-foreground">
              Registre a compra e gere patrimônio ou atualize o estoque de insumos vinculados à NF.
            </p>
          </div>
        </div>
      </div>

      <NovaEntradaCompraForm
        fornecedores={fornecedores}
        modelos={modelos}
        insumos={insumos}
        categorias={categorias}
        empresas={empresas}
        tiposEstoque={tiposEstoque}
      />
    </div>
  );
}
