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
import { Badge } from "@/components/ui/badge";
import { CategoriaForm } from "./CategoriaForm";
import { CategoriaRowActions } from "@/components/categorias/categoria-actions";

const tipoLabel = { PATRIMONIO: "Patrimônio", INSUMO: "Insumo" } as const;

export default async function CategoriasPage() {
  const r = await withDb(() =>
    prisma.category.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: { select: { assets: true, consumables: true } },
      },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Categorias" />;
  const categorias = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-muted-foreground">Classificação de patrimônio e insumos.</p>
      </div>
      <CategoriaForm />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Equipamentos</TableHead>
              <TableHead className="text-right">Insumos</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              categorias.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tipoLabel[c.tipo]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c._count.assets}</TableCell>
                  <TableCell className="text-right tabular-nums">{c._count.consumables}</TableCell>
                  <TableCell className="text-right">
                    <CategoriaRowActions item={c} />
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
