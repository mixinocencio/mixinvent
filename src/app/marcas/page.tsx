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
import { MarcaForm } from "@/components/marcas/marca-form";
import { MarcaRowActions } from "@/components/marcas/marca-actions";

export default async function MarcasPage() {
  const r = await withDb(() =>
    prisma.brand.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: { select: { models: true, assets: true } },
      },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Marcas" />;
  const marcas = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Marcas</h1>
        <p className="text-muted-foreground">Cadastro e listagem de marcas de equipamentos.</p>
      </div>
      <MarcaForm />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden lg:table-cell">Site</TableHead>
              <TableHead className="hidden sm:table-cell">Suporte</TableHead>
              <TableHead className="text-right">Modelos</TableHead>
              <TableHead className="text-right">Patrimônios</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marcas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma marca cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              marcas.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="hidden max-w-[180px] truncate lg:table-cell">
                    {m.site ? (
                      <a
                        href={m.site.startsWith("http") ? m.site : `https://${m.site}`}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {m.site}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-muted-foreground sm:table-cell">
                    {m.emailSuporte ?? m.telefoneSuporte ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m._count.models}</TableCell>
                  <TableCell className="text-right tabular-nums">{m._count.assets}</TableCell>
                  <TableCell className="text-right">
                    <MarcaRowActions item={m} />
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
