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

export default async function InsumosPage() {
  const r = await withDb(() =>
    prisma.consumable.findMany({
      orderBy: { nome: "asc" },
      include: { category: true },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Insumos" />;
  const insumos = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Insumos</h1>
        <p className="text-muted-foreground">Materiais de consumo e níveis de estoque.</p>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead>Alerta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum insumo cadastrado. Crie categorias do tipo Insumo e registre itens no banco.
                </TableCell>
              </TableRow>
            ) : (
              insumos.map((i) => {
                const baixo = i.quantidadeEstoque <= i.estoqueMinimo;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell>{i.category.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.quantidadeEstoque}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.estoqueMinimo}</TableCell>
                    <TableCell>
                      {baixo ? (
                        <Badge variant="destructive">Abaixo do mínimo</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
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
