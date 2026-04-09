import { prisma } from "@/lib/prisma";
import {
  ENTRA_SETTING_KEYS,
  ME_SETTING_KEYS,
  SENSITIVE_SETTING_KEYS,
  SETTING_DESCRIPTIONS,
} from "@/lib/settings/keys";

/** Valor apenas do banco (sem fallback de ambiente). */
export async function getSettingDb(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  if (row?.value == null) return null;
  if (typeof row.value !== "string") return null;
  if (row.value.trim() === "") return null;
  return row.value;
}

function envFallback(key: string): string | undefined {
  switch (key) {
    case ME_SETTING_KEYS.SERVER_URL:
      return process.env.MANAGEENGINE_SERVER_URL?.trim();
    case ME_SETTING_KEYS.API_KEY:
      return process.env.MANAGEENGINE_API_KEY?.trim();
    case ME_SETTING_KEYS.INVENTORY_PATH:
      return process.env.MANAGEENGINE_INVENTORY_COMPUTERS_PATH?.trim();
    case ME_SETTING_KEYS.AUTH_HEADER_NAME:
      return process.env.MANAGEENGINE_AUTH_HEADER_NAME?.trim();
    case ME_SETTING_KEYS.PAGE_LIMIT:
      return process.env.MANAGEENGINE_PAGE_LIMIT?.trim();
    case ME_SETTING_KEYS.MAX_PAGES:
      return process.env.MANAGEENGINE_MAX_PAGES?.trim();
    case ENTRA_SETTING_KEYS.TENANT_ID:
      return process.env.ENTRA_TENANT_ID?.trim();
    case ENTRA_SETTING_KEYS.CLIENT_ID:
      return process.env.ENTRA_CLIENT_ID?.trim();
    case ENTRA_SETTING_KEYS.CLIENT_SECRET:
      return process.env.ENTRA_CLIENT_SECRET?.trim();
    default:
      return undefined;
  }
}

/**
 * Valor efetivo: banco (se não vazio) ou variável de ambiente legada.
 */
export async function resolveSetting(key: string): Promise<string | null> {
  const db = await getSettingDb(key);
  if (db != null && db.trim() !== "") return db.trim();
  const env = envFallback(key);
  return env && env.trim() !== "" ? env.trim() : null;
}

export type ManageEngineResolvedConfig = {
  serverUrl: string | null;
  apiKey: string | null;
  inventoryPath: string;
  authHeaderName: string;
  pageLimit: number;
  maxPages: number;
};

export async function getResolvedManageEngineConfig(): Promise<ManageEngineResolvedConfig> {
  const [serverUrl, apiKey, pathRaw, authHeaderName, pageLimitStr, maxPagesStr] = await Promise.all([
    resolveSetting(ME_SETTING_KEYS.SERVER_URL),
    resolveSetting(ME_SETTING_KEYS.API_KEY),
    resolveSetting(ME_SETTING_KEYS.INVENTORY_PATH),
    resolveSetting(ME_SETTING_KEYS.AUTH_HEADER_NAME),
    resolveSetting(ME_SETTING_KEYS.PAGE_LIMIT),
    resolveSetting(ME_SETTING_KEYS.MAX_PAGES),
  ]);

  const inventoryPath = pathRaw?.trim() || "/api/1.4/som/computers";
  const auth = authHeaderName?.trim() || "Authorization";

  const pl = Number(pageLimitStr ?? "100");
  const pageLimit = Number.isFinite(pl) && pl > 0 && pl <= 500 ? Math.floor(pl) : 100;

  const mp = Number(maxPagesStr ?? "50");
  const maxPages = Number.isFinite(mp) && mp > 0 ? mp : 50;

  return {
    serverUrl,
    apiKey,
    inventoryPath,
    authHeaderName: auth,
    pageLimit,
    maxPages,
  };
}

/** Valores efetivos para preencher o formulário (API key nunca enviada em claro). */
export type EntraIdResolvedConfig = {
  tenantId: string | null;
  clientId: string | null;
  clientSecret: string | null;
};

export async function getResolvedEntraIdConfig(): Promise<EntraIdResolvedConfig> {
  const [tenantId, clientId, clientSecret] = await Promise.all([
    resolveSetting(ENTRA_SETTING_KEYS.TENANT_ID),
    resolveSetting(ENTRA_SETTING_KEYS.CLIENT_ID),
    resolveSetting(ENTRA_SETTING_KEYS.CLIENT_SECRET),
  ]);
  return {
    tenantId,
    clientId,
    clientSecret,
  };
}

export async function getEntraIdSettingsForUi(): Promise<{
  tenantId: string;
  clientId: string;
  clientSecretConfigured: boolean;
  clientSecretMaskedPreview: string;
}> {
  const cfg = await getResolvedEntraIdConfig();
  return {
    tenantId: cfg.tenantId ?? "",
    clientId: cfg.clientId ?? "",
    clientSecretConfigured: Boolean(cfg.clientSecret),
    clientSecretMaskedPreview: cfg.clientSecret ? "••••••••••••" : "",
  };
}

export async function getManageEngineSettingsForUi(): Promise<{
  serverUrl: string;
  inventoryPath: string;
  authHeaderName: string;
  pageLimit: string;
  maxPages: string;
  apiKeyConfigured: boolean;
  apiKeyMaskedPreview: string;
}> {
  const cfg = await getResolvedManageEngineConfig();
  return {
    serverUrl: cfg.serverUrl ?? "",
    inventoryPath: cfg.inventoryPath,
    authHeaderName: cfg.authHeaderName,
    pageLimit: String(cfg.pageLimit),
    maxPages: String(cfg.maxPages),
    apiKeyConfigured: Boolean(cfg.apiKey),
    apiKeyMaskedPreview: cfg.apiKey ? "••••••••••••" : "",
  };
}

export async function upsertSetting(key: string, value: string, description?: string | null) {
  const desc = description ?? SETTING_DESCRIPTIONS[key] ?? null;
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value, description: desc },
    update: { value, ...(desc ? { description: desc } : {}) },
  });
}

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_SETTING_KEYS.has(key);
}

/**
 * Para exibição: nunca retorna o valor real de chaves sensíveis.
 */
export async function getSettingForDisplay(key: string): Promise<{
  hasValue: boolean;
  displayValue: string;
}> {
  const raw = await getSettingDb(key);
  const hasDb = raw != null && raw.trim() !== "";
  if (isSensitiveKey(key)) {
    return {
      hasValue: hasDb,
      displayValue: hasDb ? "••••••••••••" : "",
    };
  }
  return { hasValue: hasDb, displayValue: raw ?? "" };
}
