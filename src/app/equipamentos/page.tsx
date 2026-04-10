import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { EquipamentosTable } from "@/components/equipamentos/equipamentos-table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function EquipamentosPage() {
  const r = await withDb(() =>
    prisma.asset.findMany({
      orderBy: { tagPatrimonio: "asc" },
      include: {
        category: true,
        brand: true,
        model: true,
        stockType: true,
        usuarioAtual: { select: { id: true, nome: true, email: true } },
      },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Equipamentos" />;
  const assets = r.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Equipamentos</h1>
          <p className="text-muted-foreground">Patrimônio de TI e vínculo com colaboradores.</p>
        </div>
        <Link
          href="/equipamentos/novo"
          className={cn(buttonVariants({ size: "default" }), "gap-1.5 no-underline")}
        >
          <Plus className="size-4" />
          Novo equipamento
        </Link>
      </div>

      <EquipamentosTable data={assets} />
    </div>
  );
}
