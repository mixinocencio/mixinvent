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
import Link from "next/link";

const acaoLabel = {
  CHECKOUT: "Checkout",
  CHECKIN: "Check-in",
  MANUTENCAO: "Manutenção",
} as const;

function acaoBadgeVariant(acao: keyof typeof acaoLabel): "default" | "secondary" | "outline" {
  if (acao === "CHECKOUT") return "default";
  if (acao === "CHECKIN") return "secondary";
  return "outline";
}

export default async function MovimentacoesPage() {
  const r = await withDb(() =>
    prisma.assetLog.findMany({
      orderBy: { dataMovimentacao: "desc" },
      take: 100,
      include: {
        user: { select: { nome: true, email: true } },
        asset: { select: { id: true, tagPatrimonio: true } },
      },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Movimentações" />;
  const logs = r.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Movimentações</h1>
        <p className="text-muted-foreground">Últimos 100 registros de histórico de ativos.</p>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Chamado Nexus</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma movimentação registrada.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(log.dataMovimentacao)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/equipamentos/${log.asset.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {log.asset.tagPatrimonio}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={acaoBadgeVariant(log.acao)}>
                      {acaoLabel[log.acao]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{log.user.nome}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">{log.user.email}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {log.observacao ?? "—"}
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
