"use server";

import { revalidatePath } from "next/cache";
import { AssetLogAcao, AssetStatus, CategoryType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeAssetType } from "@/lib/utils/asset-normalization";

const CSV_LOG_CREATE = "Criado via importação CSV.";
const CSV_LOG_UPDATE = "Atualizado via importação CSV.";

/** Lê célula com tolerância a variações de cabeçalho (case-insensitive). */
function getCsvCell(row: Record<string, unknown>, ...headerAliases: string[]): string {
  const map = new Map<string, string>();
  for (const [k, v] of Object.entries(row)) {
    const key = String(k).trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, v == null ? "" : String(v).trim());
    }
  }
  for (const alias of headerAliases) {
    const val = map.get(alias.trim().toLowerCase());
    if (val != null && val !== "") return val;
  }
  return "";
}

function serviceTagFromRow(row: Record<string, unknown>): string {
  return getCsvCell(
    row,
    "Service Tag",
    "service tag",
    "Serial Number",
    "serial number",
    "Número de série",
    "Numero de Serie",
  ).trim();
}

function hasResponsibleUser(row: Record<string, unknown>): boolean {
  const r = getCsvCell(
    row,
    "Responsavel",
    "Responsável",
    "Responsible",
    "Last Logon User",
    "last logon user",
    "Usuário",
    "Usuario",
  );
  return r.length > 0;
}

function buildExtrasForObservacoes(row: Record<string, unknown>): Record<string, string> {
  const pairs: [string, string[]][] = [
    ["memoria", ["Memory", "RAM", "Memória", "memória"]],
    ["ip", ["IP Address", "IP", "IPv4", "Endereço IP"]],
    ["departamento", ["Department", "Departamento", "department"]],
    ["usuario", ["Last Logon User", "User", "Usuário", "Usuario", "Usuario logado"]],
    ["warrantyDate", ["Warranty Date", "Warranty Expiry", "Data de Garantia", "Data Garantia"]],
  ];
  const out: Record<string, string> = {};
  for (const [key, aliases] of pairs) {
    const v = getCsvCell(row, ...aliases);
    if (v) out[key] = v;
  }
  return out;
}

function mergeObservacoes(
  existing: string | null | undefined,
  extras: Record<string, string>,
): string | null {
  if (Object.keys(extras).length === 0 && !existing?.trim()) return null;

  let root: Record<string, unknown> = {};
  if (existing?.trim()) {
    try {
      root = JSON.parse(existing) as Record<string, unknown>;
    } catch {
      root = { legado: existing.trim() };
    }
  }
  const prevExtras =
    root.extras && typeof root.extras === "object" && !Array.isArray(root.extras)
      ? { ...(root.extras as Record<string, string>) }
      : {};
  root.importacaoCsv = true;
  root.extras = { ...prevExtras, ...extras };
  try {
    return JSON.stringify(root);
  } catch {
    return existing ?? JSON.stringify({ importacaoCsv: true, extras });
  }
}

async function getOrCreateCompany(nomeRaw: string): Promise<string> {
  const nome = (nomeRaw || "Importação CSV — sem empresa").trim().slice(0, 255);
  const found = await prisma.company.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (found) return found.id;
  const c = await prisma.company.create({
    data: { nome },
    select: { id: true },
  });
  return c.id;
}

async function getOrCreateBrand(nomeRaw: string): Promise<string> {
  const nome = (nomeRaw || "Importação CSV").trim().slice(0, 255);
  const found = await prisma.brand.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (found) return found.id;
  const b = await prisma.brand.create({ data: { nome }, select: { id: true } });
  return b.id;
}

async function getOrCreateCategoryPatrimonio(nomeRaw: string): Promise<string> {
  const normalized = normalizeAssetType((nomeRaw || "Computador").trim());
  const nome = (normalized.trim() || "Computador").slice(0, 255);
  const found = await prisma.category.findFirst({
    where: {
      tipo: CategoryType.PATRIMONIO,
      nome: { equals: nome, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (found) return found.id;
  const c = await prisma.category.create({
    data: { nome, tipo: CategoryType.PATRIMONIO },
    select: { id: true },
  });
  return c.id;
}

async function getOrCreateModel(brandId: string, modelNomeRaw: string): Promise<string> {
  const nome = (modelNomeRaw || "Desconhecido (CSV)").trim().slice(0, 255);
  const found = await prisma.deviceModel.findFirst({
    where: { brandId, nome: { equals: nome, mode: "insensitive" } },
    select: { id: true },
  });
  if (found) return found.id;
  const m = await prisma.deviceModel.create({
    data: { nome, brandId, isSerialized: true },
    select: { id: true },
  });
  return m.id;
}

async function getDefaultStockTypeId(): Promise<string> {
  const first = await prisma.stockType.findFirst({
    orderBy: { nome: "asc" },
    select: { id: true },
  });
  if (first) return first.id;
  const st = await prisma.stockType.create({
    data: { nome: "Estoque Geral" },
    select: { id: true },
  });
  return st.id;
}

async function findAssetByNumeroSerie(numeroSerie: string) {
  return prisma.asset.findFirst({
    where: { numeroSerie: { equals: numeroSerie.trim(), mode: "insensitive" } },
    select: { id: true, tagPatrimonio: true, observacoes: true },
  });
}

async function hostnameAvailable(hostname: string, excludeAssetId?: string) {
  const other = await prisma.asset.findFirst({
    where: {
      hostname,
      ...(excludeAssetId ? { NOT: { id: excludeAssetId } } : {}),
    },
    select: { id: true },
  });
  return !other;
}

export type ImportarEquipamentosCSVResult =
  | { ok: true; processed: number; skippedEmpty: number; failed: number }
  | { ok: false; error: string };

/**
 * Importação em massa a partir de linhas já parseadas (ex.: Papa.parse com `header: true`).
 * Match por número de série / Service Tag; resilient a células nulas.
 */
export async function importarEquipamentosCSV(
  parsedData: unknown[],
): Promise<ImportarEquipamentosCSVResult> {
  if (!Array.isArray(parsedData)) {
    return { ok: false, error: "Dados inválidos: esperado um array de linhas." };
  }

  const logUser = await prisma.user.findFirst({
    where: { status: "ATIVO" },
    orderBy: { nome: "asc" },
    select: { id: true },
  });

  let processed = 0;
  let skippedEmpty = 0;
  let failed = 0;

  const stockTypeId = await getDefaultStockTypeId();

  for (const raw of parsedData) {
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
      failed += 1;
      continue;
    }
    const row = raw as Record<string, unknown>;

    const serviceTag = serviceTagFromRow(row);
    if (!serviceTag) {
      skippedEmpty += 1;
      continue;
    }

    try {
      const empresa = getCsvCell(row, "Empresa", "Company", "empresa");
      const manufacturer = getCsvCell(
        row,
        "Computer Manufacturer",
        "computer manufacturer",
        "Manufacturer",
        "Marca",
      );
      const computerType = getCsvCell(
        row,
        "Computer Type",
        "computer type",
        "Tipo",
        "Device Type",
      );
      const deviceModel = getCsvCell(row, "Device Model", "device model", "Model", "Modelo");
      const computerName = getCsvCell(
        row,
        "Computer Name",
        "computer name",
        "Hostname",
        "host name",
      );
      const os = getCsvCell(
        row,
        "Operating System",
        "operating system",
        "OS",
        "Sistema Operacional",
      );

      const companyId = await getOrCreateCompany(empresa);
      const brandId = await getOrCreateBrand(manufacturer);
      const categoryId = await getOrCreateCategoryPatrimonio(computerType);
      const modelId = await getOrCreateModel(brandId, deviceModel);
      const modelMeta = await prisma.deviceModel.findUnique({
        where: { id: modelId },
        select: { brandId: true },
      });
      if (!modelMeta) {
        failed += 1;
        continue;
      }

      const extras = buildExtrasForObservacoes(row);
      const status: AssetStatus = hasResponsibleUser(row)
        ? AssetStatus.EM_USO
        : AssetStatus.DISPONIVEL;

      const hostTrim = computerName.trim() || null;
      const existing = await findAssetByNumeroSerie(serviceTag);

      if (existing) {
        const canSetHost = !hostTrim || (await hostnameAvailable(hostTrim, existing.id));
        const observacoes = mergeObservacoes(existing.observacoes, extras);

        const updateData: Prisma.AssetUpdateInput = {
          sistemaOperacional: os.trim() || null,
          brand: { connect: { id: modelMeta.brandId } },
          model: { connect: { id: modelId } },
          category: { connect: { id: categoryId } },
          company: { connect: { id: companyId } },
          stockType: { connect: { id: stockTypeId } },
          status,
          ...(canSetHost && hostTrim ? { hostname: hostTrim } : {}),
          ...(observacoes != null ? { observacoes } : {}),
          ...(status === AssetStatus.DISPONIVEL ? { userId: null } : {}),
        };

        await prisma.$transaction(async (tx) => {
          await tx.asset.update({
            where: { id: existing.id },
            data: updateData,
          });
          if (logUser) {
            await tx.assetLog.create({
              data: {
                assetId: existing.id,
                userId: logUser.id,
                acao: AssetLogAcao.MANUTENCAO,
                observacao: CSV_LOG_UPDATE,
              },
            });
          }
        });

        processed += 1;
        continue;
      }

      let tag = serviceTag.trim();
      const tagTaken = await prisma.asset.findUnique({
        where: { tagPatrimonio: tag },
        select: { id: true },
      });
      if (tagTaken) {
        const suffix = Math.random().toString(36).slice(2, 8);
        tag = `${serviceTag.trim()}-${suffix}`;
      }

      const canSetHostNew = !hostTrim || (await hostnameAvailable(hostTrim));
      const observacoes = mergeObservacoes(null, extras);

      await prisma.$transaction(async (tx) => {
        const a = await tx.asset.create({
          data: {
            tagPatrimonio: tag,
            hostname: canSetHostNew ? hostTrim : null,
            numeroSerie: serviceTag.trim(),
            sistemaOperacional: os.trim() || null,
            status,
            categoryId,
            companyId,
            brandId: modelMeta.brandId,
            modelId,
            stockTypeId,
            observacoes,
          },
          select: { id: true },
        });
        if (logUser) {
          await tx.assetLog.create({
            data: {
              assetId: a.id,
              userId: logUser.id,
              acao: AssetLogAcao.MANUTENCAO,
              observacao: CSV_LOG_CREATE,
            },
          });
        }
      });

      processed += 1;
    } catch (e) {
      console.error("[importarEquipamentosCSV]", serviceTag, e);
      failed += 1;
    }
  }

  revalidatePath("/equipamentos");
  revalidatePath("/movimentacoes");
  revalidatePath("/");
  revalidatePath("/admin/importacao");

  return { ok: true, processed, skippedEmpty, failed };
}
