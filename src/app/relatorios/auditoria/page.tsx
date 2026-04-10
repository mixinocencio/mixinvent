import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/with-db";
import { DbOfflineNotice } from "@/components/layout/db-offline";
import { AuditoriaResumoView } from "@/components/relatorios/auditoria-resumo-view";
import {
  type AuditoriaGeralRow,
  emptyAuditoriaRow,
} from "@/lib/relatorios/auditoria-geral";
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

  const tableData = dadosMapeados.map((row) => ({
    SamAccountName: row.SamAccountName,
    Nome: row["Nome (User)"],
    Cargo: row.Cargo,
    Empresa: row.Empresa,
    Departamento: row.Departamento,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Auditoria Geral (Sumário Executivo)
        </h1>
        <p className="text-muted-foreground">
          Cruzamento de colaboradores, licenças O365, contas AD e equipamentos alocados ou em
          estoque. Use Exportar CSV para o relatório completo (inclui equipamentos e status).
        </p>
      </div>

      <AuditoriaResumoView tableData={tableData} exportData={dadosMapeados} />
    </div>
  );
}
