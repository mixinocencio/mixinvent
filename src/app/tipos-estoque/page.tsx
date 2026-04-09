import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TipoEstoqueForm } from "@/components/tipos-estoque/tipo-estoque-form";
import { TipoEstoqueRowActions } from "@/components/tipos-estoque/tipo-estoque-actions";

export default async function TiposEstoquePage() {
  const r = await withDb(() =>
    prisma.stockType.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { assets: true } } },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Tipos de estoque" />;
  const tipos = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Tipos de estoque</h1>
        <p className="text-muted-foreground">Classificação de localização ou estoque de patrimônio.</p>
      </div>
      <TipoEstoqueForm />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Patrimônios</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhum tipo de estoque cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              tipos.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{t._count.assets}</TableCell>
                  <TableCell className="text-right">
                    <TipoEstoqueRowActions item={t} />
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
