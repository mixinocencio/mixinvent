import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssetStatusBadge } from "@/lib/asset-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MovimentacaoForm } from "./MovimentacaoForm";
import { ArrowLeft } from "lucide-react";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const acaoLogLabel = {
  CHECKOUT: "Checkout",
  CHECKIN: "Check-in",
  MANUTENCAO: "Manutenção",
} as const;

export default async function EquipamentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const r = await withDb(() =>
    Promise.all([
      prisma.asset.findUnique({
        where: { id },
        include: {
          category: true,
          usuarioAtual: { select: { id: true, nome: true, email: true } },
          logs: {
            orderBy: { dataMovimentacao: "desc" },
            include: { user: { select: { nome: true, email: true } } },
          },
        },
      }),
      prisma.user.findMany({
        where: { status: "ATIVO" },
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, email: true },
      }),
    ]),
  );
  if (!r.ok) return <DbOfflineNotice title="Detalhe do equipamento" />;
  const [asset, usuariosAtivos] = r.data;

  if (!asset) notFound();

  const valorFmt =
    asset.valor != null ? money.format(Number(asset.valor)) : "—";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/equipamentos"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1 px-0")}
        >
          <ArrowLeft className="size-4" />
          Equipamentos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {asset.tagPatrimonio}
            </h1>
            <p className="text-muted-foreground">
              {asset.marca ?? "—"} {asset.modelo ?? ""} · {asset.category.nome}
            </p>
          </div>
          <AssetStatusBadge status={asset.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados do equipamento</CardTitle>
            <CardDescription>Informações cadastrais e de software.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <DetailRow label="Hostname" value={asset.hostname} />
            <DetailRow label="Número de série" value={asset.numeroSerie} />
            <DetailRow label="Sistema operacional" value={asset.sistemaOperacional} />
            <DetailRow label="Antivírus / EDR" value={asset.statusAntivirus} />
            <DetailRow
              label="Data de compra"
              value={
                asset.dataCompra
                  ? new Intl.DateTimeFormat("pt-BR").format(asset.dataCompra)
                  : null
              }
            />
            <DetailRow label="Valor" value={valorFmt} raw />
            <DetailRow
              label="Usuário atual"
              value={
                asset.usuarioAtual
                  ? `${asset.usuarioAtual.nome} (${asset.usuarioAtual.email})`
                  : null
              }
              raw
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimentar</CardTitle>
            <CardDescription>
              Checkout, check-in ou manutenção. O histórico é gravado automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MovimentacaoForm assetId={asset.id} usuarios={usuariosAtivos} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Movimentações registradas para este ativo.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asset.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma movimentação ainda.
                  </TableCell>
                </TableRow>
              ) : (
                asset.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(log.dataMovimentacao)}
                    </TableCell>
                    <TableCell>{acaoLogLabel[log.acao]}</TableCell>
                    <TableCell>
                      <span className="font-medium">{log.user.nome}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{log.user.email}</span>
                    </TableCell>
                    <TableCell className="max-w-[240px] text-muted-foreground">
                      {log.observacao ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
  raw,
}: {
  label: string;
  value: string | null | undefined;
  raw?: boolean;
}) {
  const display = raw ? value : value ?? null;
  const text = display === null || display === "" ? "—" : display;
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/80 py-2 last:border-0 sm:flex-row sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium sm:text-right">{text}</span>
    </div>
  );
}
