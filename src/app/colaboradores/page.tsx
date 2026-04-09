import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { ColaboradorForm } from "@/components/colaboradores/colaborador-form";
import { ColaboradorRowActions } from "@/components/colaboradores/colaborador-actions";
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

export default async function ColaboradoresPage() {
  const r = await withDb(() =>
    Promise.all([
      prisma.user.findMany({
        orderBy: { nome: "asc" },
        include: { departamento: true, company: true },
      }),
      prisma.company.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
      prisma.department.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    ]),
  );
  if (!r.ok) return <DbOfflineNotice title="Colaboradores" />;
  const [users, empresas, departamentos] = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Colaboradores</h1>
        <p className="text-muted-foreground">Cadastro para checkout de equipamentos e AD/O365.</p>
      </div>
      <ColaboradorForm empresas={empresas} departamentos={departamentos} />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail / UPN</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[72px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum colaborador cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div>{u.email}</div>
                      {u.userPrincipalName ? (
                        <div className="text-muted-foreground text-xs">{u.userPrincipalName}</div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{u.cargo ?? "—"}</TableCell>
                  <TableCell>{u.company?.nome ?? "—"}</TableCell>
                  <TableCell>{u.departamento?.nome ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "ATIVO" ? "secondary" : "outline"}>
                      {u.status === "ATIVO" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ColaboradorRowActions item={u} empresas={empresas} departamentos={departamentos} />
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
