/**
 * Microsoft Graph (Entra ID) — fluxo client credentials.
 * Credenciais vêm de quem chama (ex.: `getResolvedEntraIdConfig()`).
 */

export type EntraIdCredentials = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
};

export type GraphAssignedLicense = {
  skuId: string;
  disabledPlans?: string[];
};

export type GraphDirectoryUser = {
  id: string;
  displayName?: string | null;
  mail?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  accountEnabled?: boolean | null;
  mobilePhone?: string | null;
  businessPhones?: string[] | null;
  officeLocation?: string | null;
  companyName?: string | null;
  userPrincipalName?: string;
  onPremisesSamAccountName?: string;
  /** Retorno bruto do Graph; após `fetchEntraIdUsers` também há `licencasO365` resolvido. */
  assignedLicenses?: GraphAssignedLicense[] | null;
  /** Part numbers das SKUs (ex.: `O365_BUSINESS_PREMIUM, ENTERPRISEPACK`), preenchido em `fetchEntraIdUsers`. */
  licencasO365?: string | null;
};

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GraphUsersPage = {
  value?: GraphDirectoryUser[];
  "@odata.nextLink"?: string;
};

type GraphSubscribedSkusPage = {
  value?: Array<{ skuId?: string; skuPartNumber?: string | null }>;
  "@odata.nextLink"?: string;
};

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

function tokenUrl(tenantId: string): string {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
}

/**
 * Obtém access token (client credentials) para Microsoft Graph.
 */
export async function getGraphAccessToken(creds: EntraIdCredentials): Promise<string> {
  const body = new URLSearchParams({
    client_id: creds.clientId,
    scope: GRAPH_SCOPE,
    client_secret: creds.clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl(creds.tenantId), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await res.text();
  let json: TokenResponse;
  try {
    json = text ? (JSON.parse(text) as TokenResponse) : {};
  } catch {
    throw new Error(`Token Entra: resposta não é JSON (${res.status}).`);
  }

  if (!res.ok || !json.access_token) {
    const hint = json.error_description ?? json.error ?? text.slice(0, 200);
    throw new Error(`Token Entra (${res.status}): ${hint}`);
  }

  return json.access_token;
}

/** Sem `$filter` no Graph: `mail ne null` gera 400 (NotEqualsMatch não suportado em alguns tenants). Quem consome filtra `mail` vazio. */
const USERS_LIST_PATH =
  "https://graph.microsoft.com/v1.0/users" +
  "?$select=" +
  encodeURIComponent(
    "id,displayName,mail,jobTitle,department,accountEnabled,mobilePhone,businessPhones,officeLocation,companyName,userPrincipalName,onPremisesSamAccountName,assignedLicenses",
  );

const SUBSCRIBED_SKUS_URL = "https://graph.microsoft.com/v1.0/subscribedSkus";

/**
 * Mapa `skuId` → `skuPartNumber` (nome legível da licença), alinhado ao relatório PowerShell.
 */
export async function fetchSubscribedSkus(accessToken: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let url: string | undefined = SUBSCRIBED_SKUS_URL;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let page: GraphSubscribedSkusPage;
    try {
      page = text ? (JSON.parse(text) as GraphSubscribedSkusPage) : {};
    } catch {
      throw new Error(`Graph subscribedSkus: JSON inválido (${res.status}).`);
    }

    if (!res.ok) {
      const err = (page as { error?: { message?: string } }).error?.message ?? text.slice(0, 200);
      throw new Error(`Graph subscribedSkus (${res.status}): ${err}`);
    }

    for (const s of page.value ?? []) {
      const skuId = typeof s.skuId === "string" ? s.skuId.trim() : "";
      if (!skuId) continue;
      const part =
        typeof s.skuPartNumber === "string" && s.skuPartNumber.trim().length > 0
          ? s.skuPartNumber.trim()
          : skuId;
      map.set(skuId, part);
    }

    const next = page["@odata.nextLink"];
    url = typeof next === "string" && next.length > 0 ? next : undefined;
  }

  return map;
}

function licencasO365FromAssigned(
  assigned: GraphAssignedLicense[] | null | undefined,
  skuMap: Map<string, string>,
): string | null {
  if (!assigned || assigned.length === 0) return null;
  const parts: string[] = [];
  for (const lic of assigned) {
    const skuId = lic.skuId?.trim();
    if (!skuId) continue;
    parts.push(skuMap.get(skuId) ?? skuId);
  }
  if (parts.length === 0) return null;
  const unique = [...new Set(parts)];
  unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return unique.join(", ");
}

/**
 * Lista todos os usuários do diretório (paginação automática via `@odata.nextLink`).
 * Cruza `assignedLicenses` com `subscribedSkus` e preenche `licencasO365`.
 * Itens sem `mail` devem ser ignorados pelo chamador (ex.: `syncEntraIdUsers`).
 */
export async function fetchEntraIdUsers(
  accessToken: string,
  options?: { firstPageUrl?: string },
): Promise<GraphDirectoryUser[]> {
  const skuMap = await fetchSubscribedSkus(accessToken);
  const out: GraphDirectoryUser[] = [];
  let url: string | undefined = options?.firstPageUrl ?? USERS_LIST_PATH;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let page: GraphUsersPage;
    try {
      page = text ? (JSON.parse(text) as GraphUsersPage) : {};
    } catch {
      throw new Error(`Graph users: JSON inválido (${res.status}).`);
    }

    if (!res.ok) {
      const err = (page as { error?: { message?: string } }).error?.message ?? text.slice(0, 200);
      throw new Error(`Graph users (${res.status}): ${err}`);
    }

    const batch = page.value ?? [];
    for (const u of batch) {
      if (u && typeof u === "object" && typeof u.id === "string") {
        const assigned = Array.isArray(u.assignedLicenses)
          ? (u.assignedLicenses as GraphAssignedLicense[])
          : null;
        out.push({
          ...u,
          assignedLicenses: assigned,
          licencasO365: licencasO365FromAssigned(assigned, skuMap),
        });
      }
    }

    const next = page["@odata.nextLink"];
    url = typeof next === "string" && next.length > 0 ? next : undefined;
  }

  return out;
}

/** URL para teste (primeira página, no máximo 1 usuário). */
export function graphUsersTestUrl(): string {
  return `${USERS_LIST_PATH}&$top=1`;
}
