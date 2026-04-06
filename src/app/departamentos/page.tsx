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
import { DepartamentoForm } from "./DepartamentoForm";

export default async function DepartamentosPage() {
  const r = await withDb(() =>
    prisma.department.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { users: true } } },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Departamentos" />;
  const departamentos = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Departamentos</h1>
        <p className="text-muted-foreground">Cadastro e listagem de departamentos.</p>
      </div>
      <DepartamentoForm />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead className="text-right">Colaboradores</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhum departamento cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              departamentos.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell>{d.localizacao ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{d._count.users}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
