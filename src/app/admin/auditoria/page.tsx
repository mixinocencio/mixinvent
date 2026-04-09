import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

function tipoEquipamento(catNome: string): string {
  const n = catNome.toLowerCase();
  if (
    n.includes("notebook") ||
    n.includes("laptop") ||
    n.includes("note book") ||
    n.includes("chromebook")
  ) {
    return "Notebook";
  }
  if (n.includes("desktop") || n.includes("workstation") || n.includes("computador")) {
    return "Desktop";
  }
  return catNome.trim() || "—";
}

export default async function AdminAuditoriaPage() {
  const r = await withDb(() =>
    prisma.asset.findMany({
      where: {
        status: "EM_USO",
        usuarioAtual: {
          OR: [{ isActive: false }, { status: "INATIVO" }],
        },
      },
      include: {
        usuarioAtual: true,
        category: true,
        model: true,
        brand: true,
      },
      orderBy: { tagPatrimonio: "asc" },
    }),
  );

  if (!r.ok) return <DbOfflineNotice title="Auditoria" />;

  const assets = r.data;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex w-fit gap-1 px-0")}
      >
        <ArrowLeft className="size-4" />
        Voltar ao painel
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Auditoria — retenção indevida</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed">
          Equipamentos em <strong>EM_USO</strong> vinculados a colaboradores <strong>inativos</strong> (
          <code className="rounded bg-muted px-1">isActive = false</code> ou{" "}
          <code className="rounded bg-muted px-1">status = INATIVO</code>). Use o fluxo de check-in na ficha do
          equipamento para devolver ao estoque.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador inativo</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Marca / modelo</TableHead>
              <TableHead>Service tag</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                  Nenhum equipamento preso com colaborador inativo.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((a) => {
                const u = a.usuarioAtual;
                const cat = a.category?.nome ?? "";
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{u?.nome ?? "—"}</TableCell>
                    <TableCell className="max-w-[14rem] truncate">{u?.email ?? "—"}</TableCell>
                    <TableCell>{tipoEquipamento(cat)}</TableCell>
                    <TableCell className="max-w-[16rem]">
                      <span className="line-clamp-2">
                        {[a.brand?.nome, a.model?.nome].filter(Boolean).join(" / ") || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.numeroSerie ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/equipamentos/${a.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex no-underline")}
                      >
                        Ir para equipamento
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
