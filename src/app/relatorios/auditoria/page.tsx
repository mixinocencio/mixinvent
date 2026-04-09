import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { ExportButton } from "@/components/relatorios/export-button";
import {
  type AuditoriaGeralRow,
  emptyAuditoriaRow,
} from "@/lib/relatorios/auditoria-geral";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssetStatus, UserStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const userStatusLabel: Record<UserStatus, string> = {
  ATIVO: "Usuário ativo",
  INATIVO: "Usuário inativo",
};

const assetStatusLabel: Record<AssetStatus, string> = {
  DISPONIVEL: "Disponível (estoque)",
  EM_USO: "Em uso",
  MANUTENCAO: "Manutenção",
  SUCATA: "Sucata",
};

function baseUserRow(u: {
  samAccountName: string | null;
  nome: string;
  cargo: string | null;
  licencasO365: string | null;
  departamento: { nome: string } | null;
  company: { nome: string } | null;
}): Omit<AuditoriaGeralRow, "Equipamento (Hostname)" | "Service Tag" | "Tipo (Categoria)" | "Marca" | "Modelo" | "Antivirus" | "Status"> {
  return {
    SamAccountName: u.samAccountName ?? "",
    "Nome (User)": u.nome,
    Cargo: u.cargo ?? "",
    Empresa: u.company?.nome ?? "",
    Departamento: u.departamento?.nome ?? "",
    "Licenças O365": u.licencasO365 ?? "",
  };
}

function displayCell(v: string) {
  return v === "" ? "—" : v;
}

export default async function AuditoriaGeralPage() {
  const r = await withDb(() =>
    Promise.all([
      prisma.user.findMany({
        orderBy: { nome: "asc" },
        include: {
          departamento: true,
          company: true,
          assetsEmUso: { include: { category: true, brand: true, model: true } },
        },
      }),
      prisma.asset.findMany({
        where: { userId: null },
        orderBy: { tagPatrimonio: "asc" },
        include: { category: true, brand: true, model: true },
      }),
    ]),
  );
  if (!r.ok) return <DbOfflineNotice title="Auditoria Geral (Sumário Executivo)" />;
  const [users, equipamentosEstoque] = r.data;

  const dadosMapeados: AuditoriaGeralRow[] = [];

  for (const u of users) {
    const uBase = baseUserRow(u);
    if (u.assetsEmUso.length === 0) {
      const row = emptyAuditoriaRow();
      Object.assign(row, uBase, {
        "Equipamento (Hostname)": "",
        "Service Tag": "",
        "Tipo (Categoria)": "",
        Marca: "",
        Modelo: "",
        Antivirus: "",
        Status: userStatusLabel[u.status],
      });
      dadosMapeados.push(row);
    } else {
      for (const a of u.assetsEmUso) {
        const row = emptyAuditoriaRow();
        Object.assign(row, uBase, {
          "Equipamento (Hostname)": a.hostname ?? "",
          "Service Tag": a.tagPatrimonio,
          "Tipo (Categoria)": a.category.nome,
          Marca: a.brand.nome,
          Modelo: a.model.nome,
          Antivirus: a.statusAntivirus ?? "",
          Status: `${assetStatusLabel[a.status]} · ${userStatusLabel[u.status]}`,
        });
        dadosMapeados.push(row);
      }
    }
  }

  for (const a of equipamentosEstoque) {
    const row = emptyAuditoriaRow();
    Object.assign(row, {
      SamAccountName: "",
      "Nome (User)": "",
      Cargo: "",
      Empresa: "",
      Departamento: "",
      "Equipamento (Hostname)": a.hostname ?? "",
      "Service Tag": a.tagPatrimonio,
      "Tipo (Categoria)": a.category.nome,
      Marca: a.brand.nome,
      Modelo: a.model.nome,
      Antivirus: a.statusAntivirus ?? "",
      "Licenças O365": "",
      Status: assetStatusLabel[a.status],
    });
    dadosMapeados.push(row);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Auditoria Geral (Sumário Executivo)
          </h1>
          <p className="text-muted-foreground">
            Cruzamento de colaboradores, licenças O365, contas AD e equipamentos alocados ou em
            estoque.
          </p>
        </div>
        <ExportButton data={dadosMapeados} />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SamAccountName</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Hostname</TableHead>
              <TableHead>Service Tag</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Antivírus</TableHead>
              <TableHead>Licenças O365</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dadosMapeados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground">
                  Nenhum registro para exibir.
                </TableCell>
              </TableRow>
            ) : (
              dadosMapeados.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="whitespace-nowrap">{displayCell(row.SamAccountName)}</TableCell>
                  <TableCell className="font-medium">{displayCell(row["Nome (User)"])}</TableCell>
                  <TableCell>{displayCell(row.Cargo)}</TableCell>
                  <TableCell>{displayCell(row.Empresa)}</TableCell>
                  <TableCell>{displayCell(row.Departamento)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {displayCell(row["Equipamento (Hostname)"])}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {displayCell(row["Service Tag"])}
                  </TableCell>
                  <TableCell>{displayCell(row["Tipo (Categoria)"])}</TableCell>
                  <TableCell>{displayCell(row.Marca)}</TableCell>
                  <TableCell>{displayCell(row.Modelo)}</TableCell>
                  <TableCell>{displayCell(row.Antivirus)}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={row["Licenças O365"]}>
                    {displayCell(row["Licenças O365"])}
                  </TableCell>
                  <TableCell className="max-w-[220px] text-sm">{displayCell(row.Status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
