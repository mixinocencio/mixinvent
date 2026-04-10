import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { NovoInsumoButton } from "@/components/insumos/insumo-form";
import { InsumosTable } from "@/components/insumos/insumos-table";

export default async function InsumosPage() {
  const r = await withDb(() =>
    Promise.all([
      prisma.consumable.findMany({
        orderBy: { nome: "asc" },
        include: { category: true },
      }),
      prisma.category.findMany({
        where: { tipo: "INSUMO" },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true },
      }),
    ]),
  );
  if (!r.ok) return <DbOfflineNotice title="Insumos" />;
  const [insumos, categorias] = r.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Insumos</h1>
          <p className="text-muted-foreground">Materiais de consumo e controle de estoque.</p>
        </div>
        <NovoInsumoButton categorias={categorias} />
      </div>

      <InsumosTable data={insumos} categorias={categorias} />
    </div>
  );
}
