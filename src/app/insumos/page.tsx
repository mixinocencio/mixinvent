import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { NovoInsumoButton } from "@/components/insumos/insumo-form";
import { InsumoRowActions } from "@/components/insumos/insumo-actions";
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

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Estoque mínimo</TableHead>
              <TableHead className="text-right">Estoque atual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum insumo cadastrado. Cadastre categorias do tipo Insumo e clique em Novo Insumo.
                </TableCell>
              </TableRow>
            ) : (
              insumos.map((i) => {
                const baixo = i.quantidadeEstoque <= i.estoqueMinimo;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell>{i.category.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.estoqueMinimo}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.quantidadeEstoque}</TableCell>
                    <TableCell>
                      {baixo ? (
                        <Badge variant="destructive">Estoque Baixo</Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <InsumoRowActions item={i} categorias={categorias} />
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
