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
import { EmpresaForm } from "@/components/empresas/empresa-form";
import { EmpresaRowActions } from "@/components/empresas/empresa-actions";
import { formatCnpjDigits } from "@/lib/format-cnpj";

export default async function EmpresasPage() {
  const r = await withDb(() =>
    prisma.company.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { users: true } } },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Empresas" />;
  const empresas = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Empresas</h1>
        <p className="text-muted-foreground">Cadastro e listagem de empresas.</p>
      </div>
      <EmpresaForm />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">E-mail</TableHead>
              <TableHead className="text-right">Colaboradores</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma empresa cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              empresas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nome}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatCnpjDigits(e.cnpj)}
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-muted-foreground md:table-cell">
                    {e.emailContato ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{e._count.users}</TableCell>
                  <TableCell className="text-right">
                    <EmpresaRowActions item={e} />
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
