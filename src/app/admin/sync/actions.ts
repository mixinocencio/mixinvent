"use server";

import { AssetLogAcao, Prisma, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { fetchManageEngineDevices, type ManageEngineComputerNormalized } from "@/lib/integrations/manage-engine";
import {
  fetchEntraIdUsers,
  getGraphAccessToken,
  type GraphDirectoryUser,
} from "@/lib/integrations/microsoft-graph";
import { getResolvedEntraIdConfig } from "@/lib/settings/service";
import { normalizeAssetType } from "@/lib/utils/asset-normalization";

const SYNC_LOG_NOTE = "Atualizado via Sync (ManageEngine).";
const SYNC_CREATE_NOTE = "Criado via Sync (ManageEngine).";

function inferPatrimonioCategoryName(device: ManageEngineComputerNormalized): "Notebook" | "Desktop" {
  const raw = `${device.deviceType || ""} ${device.modelName || ""} ${device.hostname || ""}`.trim();
  const n = normalizeAssetType(raw);
  if (n === "Notebook" || n === "Desktop") return n;
  const hay = raw.toLowerCase();
  if (
    /latitude|thinkpad|macbook|surface|xps|inspiron|pavilion|elitebook|zenbook|swift|chromebook|netbook|ultrabook|tablet/.test(
      hay,
    )
  ) {
    return "Notebook";
  }
  return "Desktop";
}

function tagPatrimonioFor(device: ManageEngineComputerNormalized): string {
  const safe = device.serviceTag.replace(/[^\w.-]/gi, "-").slice(0, 40) || "SEM-SERIAL";
  return `ME-${safe}`;
}

async function resolveCategoryId(name: "Notebook" | "Desktop"): Promise<string | null> {
  const cat = await prisma.category.findFirst({
    where: {
      tipo: "PATRIMONIO",
      nome: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
  return cat?.id ?? null;
}

/** Categoria Patrimônio (Notebook/Desktop) após normalização — usada em create e update do sync. */
async function resolvePatrimonioCategoryIdForSync(
  device: ManageEngineComputerNormalized,
): Promise<string | null> {
  const catName = inferPatrimonioCategoryName(device);
  let categoryId = await resolveCategoryId(catName);
  if (!categoryId) {
    const fallback = await prisma.category.findFirst({
      where: { tipo: "PATRIMONIO" },
      orderBy: { nome: "asc" },
      select: { id: true },
    });
    categoryId = fallback?.id ?? null;
  }
  return categoryId;
}

async function getOrCreateBrand(nome: string): Promise<string> {
  const trimmed = nome.trim() || "Importado (Sync)";
  const found = await prisma.brand.findFirst({
    where: { nome: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (found) return found.id;
  const b = await prisma.brand.create({
    data: { nome: trimmed },
    select: { id: true },
  });
  return b.id;
}

async function getOrCreateModel(brandId: string, modelNome: string): Promise<string> {
  const nome = modelNome.trim() || "Desconhecido (Sync)";
  const found = await prisma.deviceModel.findFirst({
    where: {
      brandId,
      nome: { equals: nome, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (found) return found.id;
  const m = await prisma.deviceModel.create({
    data: {
      nome,
      brandId,
      isSerialized: true,
    },
    select: { id: true },
  });
  return m.id;
}

async function resolveModelId(device: ManageEngineComputerNormalized): Promise<string> {
  const brandName = device.manufacturerName?.trim() || "Importado (Sync)";
  const modelName = device.modelName?.trim() || "Desconhecido (Sync)";
  const brandId = await getOrCreateBrand(brandName);
  return getOrCreateModel(brandId, modelName);
}

async function findAssetByServiceTag(serviceTag: string) {
  const t = serviceTag.trim();
  if (!t) return null;
  return prisma.asset.findFirst({
    where: {
      numeroSerie: { equals: t, mode: "insensitive" },
    },
    select: { id: true },
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

export type SyncDevicesWithManageEngineResult =
  | {
      ok: true;
      updated: number;
      created: number;
      skipped: number;
      pagesFetched: number;
      warnings: string[];
    }
  | { ok: false; error: string };

/**
 * Sincroniza inventário ManageEngine → MixInvent (match por número de série / service tag).
 */
export async function syncDevicesWithManageEngine(): Promise<SyncDevicesWithManageEngineResult> {
  const fetchResult = await fetchManageEngineDevices();
  if (!fetchResult.ok) {
    return { ok: false, error: fetchResult.error };
  }

  const syncUser = await prisma.user.findFirst({
    where: { status: "ATIVO" },
    orderBy: { nome: "asc" },
    select: { id: true },
  });
  if (!syncUser) {
    return {
      ok: false,
      error: "Não há usuário ativo no sistema para registrar os logs de sincronização.",
    };
  }

  const company = await prisma.company.findFirst({ orderBy: { nome: "asc" }, select: { id: true } });
  const stockType = await prisma.stockType.findFirst({ orderBy: { nome: "asc" }, select: { id: true } });
  if (!company || !stockType) {
    return {
      ok: false,
      error: "Cadastre ao menos uma empresa e um tipo de estoque antes de importar equipamentos.",
    };
  }

  let updated = 0;
  let created = 0;
  let skipped = 0;
  const warnings: string[] = [];

  for (const device of fetchResult.devices) {
    try {
      const modelId = await resolveModelId(device);
      const modelMeta = await prisma.deviceModel.findUnique({
        where: { id: modelId },
        select: { brandId: true },
      });
      if (!modelMeta) {
        skipped += 1;
        warnings.push(`Modelo não encontrado após resolução: ${device.serviceTag}.`);
        continue;
      }

      const existing = await findAssetByServiceTag(device.serviceTag);

      if (existing) {
        const host = device.hostname?.trim() || null;
        const canSetHost = host ? await hostnameAvailable(host, existing.id) : false;
        const categoryIdSync = await resolvePatrimonioCategoryIdForSync(device);

        await prisma.$transaction(async (tx) => {
          await tx.asset.update({
            where: { id: existing.id },
            data: {
              ...(categoryIdSync ? { categoryId: categoryIdSync } : {}),
              ...(host && canSetHost ? { hostname: host } : {}),
              sistemaOperacional: device.sistemaOperacional?.trim() || null,
              brandId: modelMeta.brandId,
              modelId,
            },
          });
          await tx.assetLog.create({
            data: {
              assetId: existing.id,
              userId: syncUser.id,
              acao: AssetLogAcao.MANUTENCAO,
              observacao: SYNC_LOG_NOTE,
            },
          });
        });

        if (host && !canSetHost) {
          warnings.push(
            `Hostname "${host}" já usado por outro ativo; ${device.serviceTag} não teve hostname atualizado.`,
          );
        }

        updated += 1;
        continue;
      }

      const categoryId = await resolvePatrimonioCategoryIdForSync(device);
      if (!categoryId) {
        skipped += 1;
        warnings.push(
          `Sem categoria Patrimônio após normalização (nem fallback); ignorado: ${device.serviceTag}.`,
        );
        continue;
      }

      let tag = tagPatrimonioFor(device);
      const tagTaken = await prisma.asset.findUnique({ where: { tagPatrimonio: tag }, select: { id: true } });
      if (tagTaken) {
        tag = `ME-${device.resourceId}-${device.serviceTag.replace(/[^\w.-]/gi, "-").slice(0, 24)}`;
      }
      tag = tag.slice(0, 80);

      const hostNew = device.hostname?.trim() || null;
      const canSetHostNew = !hostNew || (await hostnameAvailable(hostNew));

      await prisma.$transaction(async (tx) => {
        const a = await tx.asset.create({
          data: {
            tagPatrimonio: tag,
            hostname: canSetHostNew ? hostNew : null,
            numeroSerie: device.serviceTag.trim(),
            sistemaOperacional: device.sistemaOperacional?.trim() || null,
            status: "DISPONIVEL",
            categoryId,
            companyId: company.id,
            brandId: modelMeta.brandId,
            modelId,
            stockTypeId: stockType.id,
          },
          select: { id: true },
        });
        await tx.assetLog.create({
          data: {
            assetId: a.id,
            userId: syncUser.id,
            acao: AssetLogAcao.MANUTENCAO,
            observacao: SYNC_CREATE_NOTE,
          },
        });
      });

      if (hostNew && !canSetHostNew) {
        warnings.push(
          `Hostname "${hostNew}" em uso; novo ativo ${device.serviceTag} criado sem hostname.`,
        );
      }

      created += 1;
    } catch (e) {
      skipped += 1;
      const msg = e instanceof Prisma.PrismaClientKnownRequestError ? `${e.code}: ${e.message}` : String(e);
      warnings.push(`Erro em ${device.serviceTag}: ${msg}`);
      console.error("[sync ManageEngine]", device.serviceTag, e);
    }
  }

  revalidatePath("/equipamentos");
  revalidatePath("/movimentacoes");
  revalidatePath("/");
  revalidatePath("/admin/sync");

  return {
    ok: true,
    updated,
    created,
    skipped,
    pagesFetched: fetchResult.pagesFetched,
    warnings: warnings.slice(0, 20),
  };
}

export type SyncEntraIdUsersResult =
  | { ok: true; processados: number; novos: number; desativados: number }
  | { ok: false; error: string };

function telefoneFromGraphUser(u: GraphDirectoryUser): string | null {
  const mobile = u.mobilePhone?.trim();
  if (mobile) return mobile;
  const arr = u.businessPhones;
  if (Array.isArray(arr)) {
    for (const x of arr) {
      const s = typeof x === "string" ? x.trim() : String(x ?? "").trim();
      if (s) return s;
    }
  }
  return null;
}

type CompanyPick = { id: string; nome: string };

function normCompany(s: string): string {
  return s.trim().toLowerCase();
}

/** Igualdade (ignorando caixa) ou um nome contém o outro. */
function findCompanyByGraphName(graphCompanyName: string, companies: CompanyPick[]): CompanyPick | null {
  const g = normCompany(graphCompanyName);
  if (!g) return null;

  for (const c of companies) {
    if (normCompany(c.nome) === g) return c;
  }
  for (const c of companies) {
    const en = normCompany(c.nome);
    if (!en) continue;
    if (en.includes(g) || g.includes(en)) return c;
  }
  return null;
}

/** Fallback controlado EBEG / AMBALAZA quando o texto do Graph não casa com cadastros. */
function findCompanyFallbackEbegAmbalaza(graphCompanyName: string, companies: CompanyPick[]): CompanyPick | null {
  const g = normCompany(graphCompanyName);
  if (!g) return null;
  if (g.includes("ebeg")) {
    const hit = companies.find((c) => normCompany(c.nome).includes("ebeg"));
    if (hit) return hit;
  }
  if (g.includes("ambalaza")) {
    const hit = companies.find((c) => normCompany(c.nome).includes("ambalaza"));
    if (hit) return hit;
  }
  return null;
}

/**
 * Sincroniza colaboradores (`User`) a partir do Microsoft Graph (Entra ID), com match por e-mail.
 */
export async function syncEntraIdUsers(): Promise<SyncEntraIdUsersResult> {
  const cfg = await getResolvedEntraIdConfig();
  if (!cfg.tenantId || !cfg.clientId || !cfg.clientSecret) {
    return {
      ok: false,
      error: "Configure Tenant ID, Client ID e Client Secret em Integrações (Microsoft Entra ID).",
    };
  }

  let users: Awaited<ReturnType<typeof fetchEntraIdUsers>>;
  try {
    const token = await getGraphAccessToken({
      tenantId: cfg.tenantId,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
    });
    users = await fetchEntraIdUsers(token);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || "Falha ao obter usuários do Graph." };
  }

  let empresasNoBanco: CompanyPick[] = await prisma.company.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  let processados = 0;
  let novos = 0;
  let desativados = 0;

  for (const u of users) {
    const mailRaw = (u.mail ?? "").trim();
    if (!mailRaw) continue;

    const email = mailRaw.toLowerCase();
    const nome = (u.displayName ?? "").trim() || email;
    const accountEnabled = u.accountEnabled !== false;
    const status = accountEnabled ? UserStatus.ATIVO : UserStatus.INATIVO;

    if (!accountEnabled) {
      desativados += 1;
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    const cargo = u.jobTitle?.trim() || null;
    const departamentoEntra = u.department?.trim() || null;
    const telefone = telefoneFromGraphUser(u);
    const cidade = u.officeLocation?.trim() || null;

    const graphCompanyName = (u.companyName ?? "").trim();
    let companyIdToLink: string | null = null;

    if (graphCompanyName) {
      let matched = findCompanyByGraphName(graphCompanyName, empresasNoBanco);
      if (!matched) {
        matched = findCompanyFallbackEbegAmbalaza(graphCompanyName, empresasNoBanco);
      }
      if (!matched) {
        try {
          const created = await prisma.company.create({
            data: { nome: graphCompanyName },
            select: { id: true, nome: true },
          });
          empresasNoBanco.push(created);
          companyIdToLink = created.id;
        } catch {
          companyIdToLink = null;
        }
      } else {
        companyIdToLink = matched.id;
      }
    }

    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        nome,
        entraId: u.id,
        userPrincipalName: u.userPrincipalName || null,
        samAccountName: u.onPremisesSamAccountName || null,
        companyId: graphCompanyName ? companyIdToLink : null,
        cargo,
        departamentoEntra,
        telefone,
        cidade,
        licencasO365: u.licencasO365?.trim() || null,
        isActive: accountEnabled,
        status,
      },
      update: {
        nome,
        entraId: u.id,
        userPrincipalName: u.userPrincipalName || null,
        samAccountName: u.onPremisesSamAccountName || null,
        ...(graphCompanyName && companyIdToLink !== null ? { companyId: companyIdToLink } : {}),
        cargo,
        departamentoEntra,
        telefone,
        cidade,
        licencasO365: u.licencasO365?.trim() || null,
        isActive: accountEnabled,
        status,
      },
    });

    processados += 1;
    if (!existing) {
      novos += 1;
    }
  }

  revalidatePath("/colaboradores");
  revalidatePath("/admin/colaboradores");
  revalidatePath("/admin/integracoes");
  revalidatePath("/admin/sync");

  return { ok: true, processados, novos, desativados };
}
