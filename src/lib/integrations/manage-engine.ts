/**
 * Integração ManageEngine Endpoint Central — inventário em duas etapas:
 * 1) Lista paginada de computadores (`resource_id`)
 * 2) Detalhe por `compdetailssummary?resid=` (hostname, fabricante, modelo, serial, SO)
 *
 * Config: `SystemSetting` / `.env` via `getResolvedManageEngineConfig()`.
 * Transporte: `manageEngineFetch` (HTTP ou HTTPS com TLS relaxado).
 */
import { manageEngineFetch } from "@/lib/integrations/manage-engine-fetch";
import { getResolvedManageEngineConfig } from "@/lib/settings/service";

export type ManageEngineComputerNormalized = {
  resourceId: string;
  serviceTag: string;
  hostname: string | null;
  modelName: string | null;
  manufacturerName: string | null;
  sistemaOperacional: string | null;
  deviceType: string | null;
};

type RawComputer = Record<string, unknown>;

/** Path fixo da documentação ME para ETAPA 2 (`?resid=`). */
export const MANAGEENGINE_COMP_DETAIL_SUMMARY_PATH = "/api/1.4/inventory/compdetailssummary";
const DETAIL_QUERY_KEY = "resid";

/** Requisições de detalhe em paralelo por lote (evita sobrecarregar o servidor ME). */
const DETAIL_FETCH_CONCURRENCY = 5;

function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function resourceIdFromRow(row: RawComputer): string | null {
  return (
    str(row.resource_id) ??
    str(row.resourceId) ??
    str(row.live_status_resource_id) ??
    str(row.live_status_resourceid)
  );
}

/**
 * Extrai linhas de listagem (computers / SOM / scan) — reutiliza heurísticas amplas.
 */
export function extractComputersPayload(json: unknown): RawComputer[] {
  if (!json || typeof json !== "object") return [];
  const root = json as Record<string, unknown>;

  const tryList = (o: unknown): RawComputer[] => {
    if (!o || typeof o !== "object") return [];
    const m = o as Record<string, unknown>;
    const candidates = [
      m.computers,
      m.Computers,
      m.data,
      m.computer_list,
      m.managed_computers,
      m.scan_computers,
    ];
    for (const arr of candidates) {
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.filter((x): x is RawComputer => x != null && typeof x === "object") as RawComputer[];
      }
    }
    for (const v of Object.values(m)) {
      if (Array.isArray(v) && v.length > 0 && v[0] != null && typeof v[0] === "object") {
        const first = v[0] as RawComputer;
        if (resourceIdFromRow(first) != null) {
          return v.filter((x): x is RawComputer => x != null && typeof x === "object") as RawComputer[];
        }
      }
    }
    return [];
  };

  const mr = root.message_response ?? root.messageResponse;
  const fromMr = tryList(mr);
  if (fromMr.length > 0) return fromMr;

  const direct = tryList(root);
  if (direct.length > 0) return direct;

  if (Array.isArray(root.computers)) {
    return root.computers.filter((x): x is RawComputer => x != null && typeof x === "object") as RawComputer[];
  }

  return [];
}

/** `resource_id` únicos da ETAPA 1 (lista de máquinas). */
export function extractResourceIdsFromListJson(json: unknown): string[] {
  const rows = extractComputersPayload(json);
  const ids = new Set<string>();
  for (const row of rows) {
    const id = resourceIdFromRow(row);
    if (id) ids.add(id);
  }
  return [...ids];
}

type SummaryBlock = Record<string, unknown> | null | undefined;

function pickSummaryBlocks(mr: Record<string, unknown>): {
  computerSummary: SummaryBlock;
  hardwareSummary: SummaryBlock;
  osSummary: SummaryBlock;
} {
  const cds = (mr.compdetailssummary ?? mr.compDetailsSummary) as Record<string, unknown> | undefined;
  if (cds && typeof cds === "object") {
    return {
      computerSummary: (cds.computer_summary ?? cds.computerSummary) as SummaryBlock,
      hardwareSummary: (cds.computer_hardware_summary ?? cds.computerHardwareSummary) as SummaryBlock,
      osSummary: (cds.computer_os_summary ?? cds.computerOsSummary) as SummaryBlock,
    };
  }
  return {
    computerSummary: (mr.computer_summary ?? mr.computerSummary) as SummaryBlock,
    hardwareSummary: (mr.computer_hardware_summary ?? mr.computerHardwareSummary) as SummaryBlock,
    osSummary: (mr.computer_os_summary ?? mr.computerOsSummary) as SummaryBlock,
  };
}

/**
 * Mapeia a resposta de `compdetailssummary` para o modelo unificado (doc oficial ME).
 */
export function normalizeFromCompDetailSummaryJson(
  json: unknown,
  resourceIdFallback: string,
): ManageEngineComputerNormalized | null {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  if (!root) return null;

  const mrRaw = root.message_response ?? root.messageResponse;
  if (!mrRaw || typeof mrRaw !== "object") return null;
  const mr = mrRaw as Record<string, unknown>;

  const { computerSummary, hardwareSummary, osSummary } = pickSummaryBlocks(mr);

  const hostname =
    computerSummary && typeof computerSummary === "object"
      ? str((computerSummary as Record<string, unknown>).computer_name)
      : null;

  let manufacturerName: string | null = null;
  let modelName: string | null = null;
  let serviceTag: string | null = null;
  let deviceType: string | null = null;

  if (hardwareSummary && typeof hardwareSummary === "object") {
    const h = hardwareSummary as Record<string, unknown>;
    manufacturerName = str(h.device_manufacturer);
    modelName = str(h.device_model);
    serviceTag = str(h.serial_number);
    deviceType = str(h.device_type);
  }

  const sistemaOperacional =
    osSummary && typeof osSummary === "object"
      ? str((osSummary as Record<string, unknown>).os_name)
      : null;

  if (!serviceTag) {
    console.warn("[ManageEngine] compdetailssummary sem serial_number; resid=", resourceIdFallback);
    return null;
  }

  return {
    resourceId: resourceIdFallback,
    serviceTag: serviceTag.trim(),
    hostname,
    modelName,
    manufacturerName,
    sistemaOperacional,
    deviceType,
  };
}

export type FetchManageEngineDevicesResult =
  | { ok: true; devices: ManageEngineComputerNormalized[]; pagesFetched: number }
  | { ok: false; error: string; statusCode?: number; detail?: string };

function buildAuthHeaders(cfg: Awaited<ReturnType<typeof getResolvedManageEngineConfig>>): HeadersInit | null {
  if (!cfg.apiKey?.trim()) return null;
  return {
    [cfg.authHeaderName]: cfg.apiKey,
    Accept: "application/json",
  };
}

async function parseJsonResponse(
  res: Awaited<ReturnType<typeof manageEngineFetch>>,
  url: string,
): Promise<{ ok: true; json: unknown } | { ok: false; error: string; statusCode: number; detail: string }> {
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return {
      ok: false,
      error: "Resposta não é JSON válido.",
      statusCode: res.status,
      detail: text.slice(0, 300),
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: `HTTP ${res.status}`,
      statusCode: res.status,
      detail: text.slice(0, 300),
    };
  }
  return { ok: true, json };
}

/**
 * ETAPA 2: uma requisição `compdetailssummary` por `resource_id`.
 */
async function fetchComputerDetailSummary(
  baseForUrl: string,
  headers: HeadersInit,
  resourceId: string,
): Promise<ManageEngineComputerNormalized | null> {
  const detailPath = MANAGEENGINE_COMP_DETAIL_SUMMARY_PATH.startsWith("/")
    ? MANAGEENGINE_COMP_DETAIL_SUMMARY_PATH
    : `/${MANAGEENGINE_COMP_DETAIL_SUMMARY_PATH}`;
  const url = new URL(detailPath, baseForUrl);
  url.searchParams.set(DETAIL_QUERY_KEY, resourceId);

  try {
    const res = await manageEngineFetch(url.toString(), { method: "GET", headers });
    const parsed = await parseJsonResponse(res, url.toString());
    if (!parsed.ok) {
      console.warn("[ManageEngine] detalhe falhou", resourceId, parsed.error, parsed.statusCode);
      return null;
    }
    return normalizeFromCompDetailSummaryJson(parsed.json, resourceId);
  } catch (e) {
    console.warn("[ManageEngine] detalhe exceção", resourceId, e);
    return null;
  }
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const chunk = await Promise.all(slice.map(fn));
    out.push(...chunk);
  }
  return out;
}

/**
 * Duas etapas: lista paginada (path configurável: SOM / scancomputers) + detalhes em lotes.
 */
export async function fetchManageEngineDevices(): Promise<FetchManageEngineDevicesResult> {
  const resolved = await getResolvedManageEngineConfig();
  const base = resolved.serverUrl?.trim().replace(/\/+$/, "");
  if (!base) {
    const msg =
      "URL do servidor ManageEngine não configurada (UI Integrações ou MANAGEENGINE_SERVER_URL).";
    console.error("[ManageEngine]", msg);
    return { ok: false, error: msg };
  }

  const listPathRaw = resolved.inventoryPath;
  const listPath = listPathRaw.startsWith("/") ? listPathRaw : `/${listPathRaw}`;
  const limit = resolved.pageLimit;
  const pageCap = resolved.maxPages;
  const baseForUrl = base.endsWith("/") ? base : `${base}/`;

  try {
    const headers = buildAuthHeaders(resolved);
    if (!headers) {
      const msg =
        "API Key ManageEngine não configurada (UI Integrações ou MANAGEENGINE_API_KEY).";
      console.error("[ManageEngine]", msg);
      return { ok: false, error: msg };
    }

    const resourceIds = new Set<string>();
    let page = 1;
    let pagesFetched = 0;

    while (page <= pageCap) {
      const url = new URL(listPath, baseForUrl);
      url.searchParams.set("page", String(page));
      url.searchParams.set("pagelimit", String(limit));

      const started = Date.now();
      const res = await manageEngineFetch(url.toString(), { method: "GET", headers });
      const ms = Date.now() - started;

      const parsed = await parseJsonResponse(res, url.toString());
      if (!parsed.ok) {
        console.error("[ManageEngine] lista — erro", {
          page,
          ms,
          ...parsed,
        });
        return {
          ok: false,
          error: parsed.error.includes("JSON") ? parsed.error : `Lista: ${parsed.error}`,
          statusCode: parsed.statusCode,
          detail: parsed.detail,
        };
      }

      const json = parsed.json;
      const status = (json as Record<string, unknown>).status;
      if (typeof status === "string" && status.toLowerCase() !== "success") {
        console.warn("[ManageEngine] lista — status não-success", { status, page, ms });
      } else {
        console.info("[ManageEngine] lista — página OK", { page, ms, status: status ?? "—" });
      }

      const idsThisPage = extractResourceIdsFromListJson(json);
      for (const id of idsThisPage) resourceIds.add(id);

      const rows = extractComputersPayload(json);
      pagesFetched += 1;

      if (rows.length < limit) {
        break;
      }
      page += 1;
    }

    const ids = [...resourceIds];
    console.info("[ManageEngine] ETAPA 1 concluída", { pagesFetched, resourceCount: ids.length });

    const devicesNested = await mapInBatches(ids, DETAIL_FETCH_CONCURRENCY, (rid) =>
      fetchComputerDetailSummary(baseForUrl, headers, rid),
    );
    const devices = devicesNested.filter((d): d is ManageEngineComputerNormalized => d != null);

    console.info("[ManageEngine] ETAPA 2 concluída", {
      solicitados: ids.length,
      mapeados: devices.length,
      concorrência: DETAIL_FETCH_CONCURRENCY,
    });

    return { ok: true, devices, pagesFetched };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[ManageEngine] falha na sincronização", e);
    return { ok: false, error: message || "Falha ao contatar ManageEngine." };
  }
}
