import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { buttonVariants } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssetStatusBadge } from "@/lib/asset-status-badge";
import { AssetTableActions } from "@/components/equipamentos/asset-table-actions";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";

function buildAssetSearchWhere(q: string): Prisma.AssetWhereInput {
  const term = q.trim();
  if (!term) return {};
  return {
    OR: [
      { tagPatrimonio: { contains: term, mode: "insensitive" } },
      { hostname: { contains: term, mode: "insensitive" } },
      { numeroSerie: { contains: term, mode: "insensitive" } },
      { observacoes: { contains: term, mode: "insensitive" } },
      { brand: { nome: { contains: term, mode: "insensitive" } } },
      { model: { nome: { contains: term, mode: "insensitive" } } },
      { usuarioAtual: { nome: { contains: term, mode: "insensitive" } } },
      { usuarioAtual: { email: { contains: term, mode: "insensitive" } } },
    ],
  };
}

export default async function EquipamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const qRaw = sp.q?.trim() ?? "";
  const where = buildAssetSearchWhere(qRaw);

  const r = await withDb(() =>
    prisma.asset.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { tagPatrimonio: "asc" },
      include: {
        category: true,
        brand: true,
        model: true,
        stockType: true,
        usuarioAtual: { select: { id: true, nome: true, email: true } },
      },
    }),
  );
  if (!r.ok) return <DbOfflineNotice title="Equipamentos" />;
  const assets = r.data;
  const hasSearch = qRaw.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Equipamentos</h1>
          <p className="text-muted-foreground">Patrimônio de TI e vínculo com colaboradores.</p>
        </div>
        <Link
          href="/equipamentos/novo"
          className={cn(buttonVariants({ size: "default" }), "gap-1.5 no-underline")}
        >
          <Plus className="size-4" />
          Novo equipamento
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="h-9 max-w-md animate-pulse rounded-lg bg-muted" aria-hidden />
        }
      >
        <SearchInput placeholder="Buscar por hostname, série, modelo, tag, marca ou usuário…" />
      </Suspense>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Hostname</TableHead>
              <TableHead>Usuário atual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {hasSearch
                    ? "Nenhum equipamento encontrado para esta busca."
                    : "Nenhum equipamento cadastrado."}
                </TableCell>
              </TableRow>
            ) : (
              assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`/equipamentos/${a.id}`} className="text-primary hover:underline">
                      {a.tagPatrimonio}
                    </Link>
                  </TableCell>
                  <TableCell>{a.category.nome}</TableCell>
                  <TableCell>{a.brand.nome}</TableCell>
                  <TableCell>{a.model.nome}</TableCell>
                  <TableCell>{a.hostname ?? "—"}</TableCell>
                  <TableCell>
                    {a.usuarioAtual ? (
                      <span>{a.usuarioAtual.nome}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <AssetStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AssetTableActions
                      asset={{ id: a.id, tagPatrimonio: a.tagPatrimonio, status: a.status }}
                    />
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
