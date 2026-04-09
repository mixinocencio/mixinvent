"use server";

import { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeAssetType } from "@/lib/utils/asset-normalization";

export type DashboardNameValue = { name: string; value: number };

export type DashboardFiltersInput = {
  companyId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  /** Nome da marca (filtro vindo do gráfico / URL). */
  brand?: string;
  /** Drill-down: extras.unidade nas observações. */
  obsUnidade?: string;
  /** Drill-down: extras.departamento nas observações. */
  obsDepartamento?: string;
};

export type DashboardMetrics = {
  resumo: {
    total: number;
    notebooks: number;
    desktops: number;
    garantiasVencendo: number;
    /** EM_USO vinculado a colaborador inativo (Entra / cadastro). */
    riscoDesligados: number;
  };
  porUnidade: DashboardNameValue[];
  porDepartamento: DashboardNameValue[];
  porMarca: DashboardNameValue[];
  /** Tipos consolidados a partir do nome da categoria (Notebook / Desktop / …). */
  porTipo: DashboardNameValue[];
  unidadesDisponiveis: string[];
  filters: DashboardFiltersInput;
};

type ParsedExtras = {
  unidade: string | null;
  departamento: string | null;
  warrantyRaw: string | null;
};

function strExtra(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t || null;
  }
  const s = String(v).trim();
  return s || null;
}

function parseObservacoes(obs: string | null | undefined): ParsedExtras {
  const empty: ParsedExtras = { unidade: null, departamento: null, warrantyRaw: null };
  if (!obs?.trim()) return empty;
  try {
    const root = JSON.parse(obs) as Record<string, unknown>;
    const extras =
      root.extras && typeof root.extras === "object" && !Array.isArray(root.extras)
        ? (root.extras as Record<string, unknown>)
        : {};
    return {
      unidade:
        strExtra(extras.unidade) ??
        strExtra(extras.Unidade) ??
        strExtra((extras as { unit?: unknown }).unit),
      departamento:
        strExtra(extras.departamento) ?? strExtra(extras.Department) ?? strExtra(extras.setor),
      warrantyRaw:
        strExtra(extras.warrantyDate) ??
        strExtra(extras.warranty) ??
        strExtra(extras.warrantyExpiry) ??
        strExtra(extras.dataGarantia) ??
        strExtra((extras as { "Warranty Expiry Date"?: unknown })["Warranty Expiry Date"]),
    };
  } catch {
    return empty;
  }
}

function parseDayStart(iso: string): Date | null {
  const t = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDayEnd(iso: string): Date | null {
  const t = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Filtros indexáveis no Prisma (sem JSON em observações). */
function buildPrismaAssetWhere(f: DashboardFiltersInput): Prisma.AssetWhereInput {
  const parts: Prisma.AssetWhereInput[] = [];

  if (f.companyId?.trim()) {
    parts.push({ companyId: f.companyId.trim() });
  }
  if (f.departmentId?.trim()) {
    parts.push({
      usuarioAtual: { departamentoId: f.departmentId.trim() },
    });
  }
  if (f.brand?.trim()) {
    parts.push({
      brand: { nome: { equals: f.brand.trim(), mode: "insensitive" } },
    });
  }

  const start = f.startDate ? parseDayStart(f.startDate) : null;
  const end = f.endDate ? parseDayEnd(f.endDate) : null;
  if (start || end) {
    const dataCompra: Prisma.DateTimeNullableFilter = {};
    if (start) dataCompra.gte = start;
    if (end) dataCompra.lte = end;
    parts.push({ dataCompra });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

function parseWarrantyDate(raw: string | null): Date | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const iso = new Date(s);
  if (!Number.isNaN(iso.getTime())) return iso;
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(s);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    const dt = new Date(y, mo, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const n = Number(s);
  if (Number.isFinite(n) && n > 1e12) {
    const dt = new Date(n);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

function isGarantiaNoAlerta(d: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 30);
  return end.getTime() <= limit.getTime();
}

function incrementMap(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function mapToSortedNameValue(map: Map<string, number>): DashboardNameValue[] {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-BR"));
}

function matchesObsDrill(
  extras: ParsedExtras,
  f: DashboardFiltersInput,
): boolean {
  if (f.obsUnidade?.trim()) {
    const u = (extras.unidade ?? "").trim();
    if (u.toLowerCase() !== f.obsUnidade.trim().toLowerCase()) return false;
  }
  if (f.obsDepartamento?.trim()) {
    const dLabel = (extras.departamento ?? "").trim() || "Sem departamento";
    if (dLabel.toLowerCase() !== f.obsDepartamento.trim().toLowerCase()) return false;
  }
  return true;
}

/**
 * Métricas do dashboard. Filtros Prisma (empresa, setor, datas, marca) + drill nas observações (unidade / departamento texto).
 */
export async function getDashboardMetrics(
  filters: DashboardFiltersInput = {},
): Promise<DashboardMetrics> {
  const prismaWhere = buildPrismaAssetWhere(filters);

  const assets = await prisma.asset.findMany({
    where: prismaWhere,
    select: {
      id: true,
      observacoes: true,
      status: true,
      category: { select: { nome: true } },
      brand: { select: { nome: true } },
      usuarioAtual: {
        select: {
          isActive: true,
          status: true,
          departamentoId: true,
        },
      },
    },
  });

  const filtered = assets.filter((a) => matchesObsDrill(parseObservacoes(a.observacoes), filters));

  const unidadesSet = new Set<string>();
  for (const a of filtered) {
    const { unidade } = parseObservacoes(a.observacoes);
    if (unidade) unidadesSet.add(unidade);
  }
  const unidadesDisponiveis = [...unidadesSet].sort((x, y) =>
    x.localeCompare(y, "pt-BR", { sensitivity: "base" }),
  );

  let notebooks = 0;
  let desktops = 0;
  let garantiasVencendo = 0;
  let riscoDesligados = 0;

  const byUnidade = new Map<string, number>();
  const byDepartamento = new Map<string, number>();
  const byMarca = new Map<string, number>();
  const byTipo = new Map<string, number>();

  for (const a of filtered) {
    const extras = parseObservacoes(a.observacoes);
    const catNome = a.category?.nome ?? "";
    const tipoNorm = normalizeAssetType(catNome || "") || "Sem tipo";

    incrementMap(byTipo, tipoNorm);

    if (tipoNorm === "Notebook") notebooks += 1;
    else if (tipoNorm === "Desktop") desktops += 1;
    else desktops += 1;

    const w = parseWarrantyDate(extras.warrantyRaw);
    if (w && isGarantiaNoAlerta(w)) garantiasVencendo += 1;

    if (a.status === "EM_USO" && a.usuarioAtual) {
      const u = a.usuarioAtual;
      if (!u.isActive || u.status === UserStatus.INATIVO) {
        riscoDesligados += 1;
      }
    }

    const uLabel = extras.unidade?.trim() || "Sem unidade";
    incrementMap(byUnidade, uLabel);

    const dLabel = extras.departamento?.trim() || "Sem departamento";
    incrementMap(byDepartamento, dLabel);

    const marcaNome = a.brand?.nome?.trim() || "Sem marca";
    incrementMap(byMarca, marcaNome);
  }

  const obsUnidadeFiltro = filters.obsUnidade?.trim();
  let porUnidade: DashboardNameValue[];
  if (obsUnidadeFiltro) {
    porUnidade = [{ name: obsUnidadeFiltro, value: filtered.length }];
  } else {
    porUnidade = mapToSortedNameValue(byUnidade);
  }

  const obsDepFiltro = filters.obsDepartamento?.trim();
  let porDepartamento: DashboardNameValue[];
  if (obsDepFiltro) {
    porDepartamento = [{ name: obsDepFiltro, value: filtered.length }];
  } else {
    porDepartamento = mapToSortedNameValue(byDepartamento);
  }

  const porMarca = mapToSortedNameValue(byMarca);
  const porTipo = mapToSortedNameValue(byTipo);

  return {
    resumo: {
      total: filtered.length,
      notebooks,
      desktops,
      garantiasVencendo,
      riscoDesligados,
    },
    porUnidade,
    porDepartamento,
    porMarca,
    porTipo,
    unidadesDisponiveis,
    filters,
  };
}
