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
import { ModeloForm } from "@/components/modelos/modelo-form";
import { ModeloRowActions } from "@/components/modelos/modelo-actions";

export default async function ModelosPage() {
  const r = await withDb(async () => {
    const [modelos, marcas] = await Promise.all([
      prisma.deviceModel.findMany({
        orderBy: [{ brand: { nome: "asc" } }, { nome: "asc" }],
        include: {
          brand: true,
          _count: { select: { assets: true } },
        },
      }),
      prisma.brand.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    ]);
    return { modelos, marcas };
  });
  if (!r.ok) return <DbOfflineNotice title="Modelos" />;
  const { modelos, marcas } = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Modelos</h1>
        <p className="text-muted-foreground">Modelos vinculados a marcas.</p>
      </div>
      <ModeloForm marcas={marcas} />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead className="hidden md:table-cell">Part number</TableHead>
              <TableHead className="text-right">Garantia (meses)</TableHead>
              <TableHead className="hidden text-center sm:table-cell">Serializado</TableHead>
              <TableHead className="text-right">Patrimônios</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum modelo cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              modelos.map((mo) => (
                <TableRow key={mo.id}>
                  <TableCell className="font-medium">{mo.nome}</TableCell>
                  <TableCell>{mo.brand.nome}</TableCell>
                  <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                    {mo.partNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {mo.mesesGarantia ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-center text-sm sm:table-cell">
                    {mo.isSerialized ? "Sim" : "Não"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{mo._count.assets}</TableCell>
                  <TableCell className="text-right">
                    <ModeloRowActions item={mo} marcas={marcas} />
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
