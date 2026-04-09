"use server";

import { revalidatePath } from "next/cache";

import {
  getSettingDb,
  getResolvedEntraIdConfig,
  getResolvedManageEngineConfig,
  upsertSetting,
  isSensitiveKey,
  getSettingForDisplay,
} from "@/lib/settings/service";
import {
  ENTRA_SETTING_KEYS,
  ME_SETTING_KEYS,
  SETTING_DESCRIPTIONS,
} from "@/lib/settings/keys";
import { manageEngineFetch } from "@/lib/integrations/manage-engine-fetch";
import {
  extractResourceIdsFromListJson,
  MANAGEENGINE_COMP_DETAIL_SUMMARY_PATH,
  normalizeFromCompDetailSummaryJson,
} from "@/lib/integrations/manage-engine";
import {
  getGraphAccessToken,
  graphUsersTestUrl,
} from "@/lib/integrations/microsoft-graph";

/**
 * Lê o valor **integral** armazenado no banco (sem fallback de ambiente).
 * Uso em código de servidor; para a UI prefira `getSettingForDisplay` ou dados pré-mascarados.
 */
export async function getSetting(key: string): Promise<string | null> {
  return getSettingDb(key);
}

/**
 * Atualiza ou cria configuração. Chaves sensíveis: string vazia **não** apaga o valor existente.
 */
export async function updateSetting(
  key: string,
  value: string,
  description?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = value.trim();
  if (isSensitiveKey(key) && trimmed === "") {
    return { ok: true };
  }
  try {
    await upsertSetting(key, value, description ?? SETTING_DESCRIPTIONS[key] ?? null);
    revalidatePath("/admin/integracoes");
    revalidatePath("/admin/sync");
    return { ok: true };
  } catch (e) {
    console.error("[updateSetting]", key, e);
    return { ok: false, error: "Não foi possível salvar a configuração." };
  }
}

export async function saveManageEngineSettings(form: {
  serverUrl: string;
  apiKey: string;
  inventoryPath: string;
  authHeaderName: string;
  pageLimit: string;
  maxPages: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const pairs: [string, string][] = [
    [ME_SETTING_KEYS.SERVER_URL, form.serverUrl.trim()],
    [ME_SETTING_KEYS.INVENTORY_PATH, form.inventoryPath.trim() || "/api/1.4/som/computers"],
    [ME_SETTING_KEYS.AUTH_HEADER_NAME, form.authHeaderName.trim() || "Authorization"],
    [ME_SETTING_KEYS.PAGE_LIMIT, form.pageLimit.trim() || "100"],
    [ME_SETTING_KEYS.MAX_PAGES, form.maxPages.trim() || "50"],
  ];

  try {
    for (const [k, v] of pairs) {
      await upsertSetting(k, v, SETTING_DESCRIPTIONS[k] ?? null);
    }
    if (form.apiKey.trim() !== "") {
      await upsertSetting(
        ME_SETTING_KEYS.API_KEY,
        form.apiKey.trim(),
        SETTING_DESCRIPTIONS[ME_SETTING_KEYS.API_KEY],
      );
    }
    revalidatePath("/admin/integracoes");
    revalidatePath("/admin/sync");
    return { ok: true };
  } catch (e) {
    console.error("[saveManageEngineSettings]", e);
    return { ok: false, error: "Falha ao salvar integração ManageEngine." };
  }
}

export async function saveEntraIdSettings(form: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await upsertSetting(
      ENTRA_SETTING_KEYS.TENANT_ID,
      form.tenantId.trim(),
      SETTING_DESCRIPTIONS[ENTRA_SETTING_KEYS.TENANT_ID],
    );
    await upsertSetting(
      ENTRA_SETTING_KEYS.CLIENT_ID,
      form.clientId.trim(),
      SETTING_DESCRIPTIONS[ENTRA_SETTING_KEYS.CLIENT_ID],
    );
    if (form.clientSecret.trim() !== "") {
      await upsertSetting(
        ENTRA_SETTING_KEYS.CLIENT_SECRET,
        form.clientSecret.trim(),
        SETTING_DESCRIPTIONS[ENTRA_SETTING_KEYS.CLIENT_SECRET],
      );
    }
    revalidatePath("/admin/integracoes");
    return { ok: true };
  } catch (e) {
    console.error("[saveEntraIdSettings]", e);
    return { ok: false, error: "Falha ao salvar integração Microsoft Entra ID." };
  }
}

export type TestEntraIdConnectionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function testEntraIdConnection(): Promise<TestEntraIdConnectionResult> {
  const cfg = await getResolvedEntraIdConfig();
  if (!cfg.tenantId) {
    return { ok: false, error: "Tenant ID não configurado." };
  }
  if (!cfg.clientId) {
    return { ok: false, error: "Client ID não configurado." };
  }
  if (!cfg.clientSecret) {
    return { ok: false, error: "Client Secret não configurado." };
  }

  try {
    const token = await getGraphAccessToken({
      tenantId: cfg.tenantId,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
    });

    const res = await fetch(graphUsersTestUrl(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let data: { value?: { displayName?: string; mail?: string }[] };
    try {
      data = text ? (JSON.parse(text) as typeof data) : {};
    } catch {
      return { ok: false, error: "Graph: resposta não é JSON válido." };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: `Graph HTTP ${res.status}: ${text.slice(0, 160)}`,
      };
    }

    const first = data.value?.[0];
    const msg = first?.mail
      ? `Conexão OK. Amostra: ${first.displayName ?? "—"} <${first.mail}>`
      : "Conexão OK (token válido). Nenhum usuário na amostra ($top=1) ou sem campo mail.";

    return { ok: true, message: msg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || "Falha ao testar Microsoft Graph." };
  }
}

export type TestManageEngineConnectionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; statusCode?: number };

/** Resumo da forma do JSON para o toast de depuração (chaves na raiz ou tipo de array). */
function describeRootJsonShape(data: unknown): string {
  if (data === null) return "null";
  if (Array.isArray(data)) {
    const n = data.length;
    const first = data[0];
    if (first != null && typeof first === "object" && !Array.isArray(first)) {
      return `Array(${n}) — chaves do 1º item: ${Object.keys(first as object).join(", ")}`;
    }
    return `Array(${n})`;
  }
  if (typeof data === "object") {
    return `objeto — chaves: ${Object.keys(data as object).join(", ")}`;
  }
  return `primitivo (${typeof data})`;
}

/**
 * Valida o fluxo em duas etapas: lista (página 1, pagelimit 1) + um `compdetailssummary` para o primeiro `resource_id`.
 */
export async function testManageEngineConnection(): Promise<TestManageEngineConnectionResult> {
  const cfg = await getResolvedManageEngineConfig();
  if (!cfg.serverUrl) {
    return { ok: false, error: "URL do servidor não configurada." };
  }
  if (!cfg.apiKey) {
    return { ok: false, error: "API Key / token não configurado." };
  }

  const base = cfg.serverUrl.replace(/\/+$/, "");
  const path = cfg.inventoryPath.startsWith("/") ? cfg.inventoryPath : `/${cfg.inventoryPath}`;
  const baseForUrl = base.endsWith("/") ? base : `${base}/`;
  const url = new URL(path, baseForUrl);
  url.searchParams.set("page", "1");
  url.searchParams.set("pagelimit", "1");

  try {
    const res = await manageEngineFetch(url.toString(), {
      method: "GET",
      headers: {
        [cfg.authHeaderName]: cfg.apiKey,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return {
        ok: false,
        error: "Resposta não é JSON válido.",
        statusCode: res.status,
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}: ${text.slice(0, 120)}`,
        statusCode: res.status,
      };
    }

    console.log("=== RAW LIST (ETAPA 1) ===", JSON.stringify(data).substring(0, 1000));

    const listShape = describeRootJsonShape(data);
    const resourceIds = extractResourceIdsFromListJson(data);

    if (resourceIds.length === 0) {
      return {
        ok: true,
        message: `Lista OK (HTTP ${res.status}). Nenhum resource_id extraído — confira o path (ex.: /api/1.4/som/computers ou /api/1.4/inventory/scancomputers). Raiz: ${listShape}`,
      };
    }

    const firstId = resourceIds[0];
    const detailUrl = new URL(
      MANAGEENGINE_COMP_DETAIL_SUMMARY_PATH.startsWith("/")
        ? MANAGEENGINE_COMP_DETAIL_SUMMARY_PATH
        : `/${MANAGEENGINE_COMP_DETAIL_SUMMARY_PATH}`,
      baseForUrl,
    );
    detailUrl.searchParams.set("resid", firstId);

    const resDetail = await manageEngineFetch(detailUrl.toString(), {
      method: "GET",
      headers: {
        [cfg.authHeaderName]: cfg.apiKey,
        Accept: "application/json",
      },
    });

    const textDetail = await resDetail.text();
    let dataDetail: unknown;
    try {
      dataDetail = textDetail ? JSON.parse(textDetail) : {};
    } catch {
      return {
        ok: false,
        error: "Detalhe (ETAPA 2): resposta não é JSON válido.",
        statusCode: resDetail.status,
      };
    }

    if (!resDetail.ok) {
      return {
        ok: false,
        error: `Detalhe HTTP ${resDetail.status}: ${textDetail.slice(0, 120)}`,
        statusCode: resDetail.status,
      };
    }

    console.log("=== RAW DETAIL (ETAPA 2) ===", JSON.stringify(dataDetail).substring(0, 1000));

    const detailShape = describeRootJsonShape(dataDetail);
    const sample = normalizeFromCompDetailSummaryJson(dataDetail, firstId);
    const sampleHint = sample
      ? `Amostra: ${sample.hostname ?? "—"} | SN ${sample.serviceTag} | ${sample.modelName ?? "—"}`
      : "Amostra: não mapeada (veja logs para JSON)";

    return {
      ok: true,
      message: `Duas etapas OK. Lista: ${listShape}. resource_id nesta página: ${resourceIds.length}. Detalhe: ${detailShape}. ${sampleHint}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || "Falha de rede ao contatar o servidor." };
  }
}

/** Exposto para a UI quando necessário inspecionar chave não sensível mascarada. */
export async function getSettingDisplayAction(key: string) {
  return getSettingForDisplay(key);
}
