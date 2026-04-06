import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssetStatusBadge } from "@/lib/asset-status-badge";
import { Plus } from "lucide-react";

export default async function EquipamentosPage() {
  const r = await withDb(() =>
    prisma.asset.findMany({
      orderBy: { tagPatrimonio: "asc" },
      include: {
        category: true,
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
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Hostname</TableHead>
              <TableHead>Usuário atual</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum equipamento cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`/equipamentos/${a.id}`} className="text-primary hover:underline">
                      {a.tagPatrimonio}
                    </Link>
                  </TableCell>
                  <TableCell>{a.category.nome}</TableCell>
                  <TableCell>{a.hostname ?? "—"}</TableCell>
                  <TableCell>
                    {a.usuarioAtual ? (
                      <span>{a.usuarioAtual.nome}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <AssetStatusBadge status={a.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
