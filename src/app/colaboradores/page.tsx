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
import { ColaboradorForm } from "./ColaboradorForm";

export default async function ColaboradoresPage() {
  const r = await withDb(() =>
    Promise.all([
      prisma.user.findMany({
        orderBy: { nome: "asc" },
        include: { departamento: true },
      }),
      prisma.department.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    ]),
  );
  if (!r.ok) return <DbOfflineNotice title="Colaboradores" />;
  const [users, departamentos] = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Colaboradores</h1>
        <p className="text-muted-foreground">Cadastro para checkout de equipamentos e AD/O365.</p>
      </div>
      <ColaboradorForm departamentos={departamentos} />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum colaborador cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.departamento?.nome ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "ATIVO" ? "secondary" : "outline"}>
                      {u.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </Badge>
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
