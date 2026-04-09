/** Chaves persistidas em `SystemSetting` para ManageEngine. */
export const ME_SETTING_KEYS = {
  SERVER_URL: "ME_SERVER_URL",
  API_KEY: "ME_API_KEY",
  INVENTORY_PATH: "ME_INVENTORY_PATH",
  AUTH_HEADER_NAME: "ME_AUTH_HEADER_NAME",
  PAGE_LIMIT: "ME_PAGE_LIMIT",
  MAX_PAGES: "ME_MAX_PAGES",
} as const;

export type MeSettingKey = (typeof ME_SETTING_KEYS)[keyof typeof ME_SETTING_KEYS];

/** Microsoft Entra ID / Graph (client credentials). */
export const ENTRA_SETTING_KEYS = {
  TENANT_ID: "ENTRA_TENANT_ID",
  CLIENT_ID: "ENTRA_CLIENT_ID",
  CLIENT_SECRET: "ENTRA_CLIENT_SECRET",
} as const;

export type EntraSettingKey = (typeof ENTRA_SETTING_KEYS)[keyof typeof ENTRA_SETTING_KEYS];

export const SENSITIVE_SETTING_KEYS = new Set<string>([
  ME_SETTING_KEYS.API_KEY,
  ENTRA_SETTING_KEYS.CLIENT_SECRET,
]);

export const SETTING_DESCRIPTIONS: Record<string, string> = {
  [ME_SETTING_KEYS.SERVER_URL]:
    "URL base do ManageEngine (sem barra final). Se a porta for só HTTP (ex.: 8020), use http:// — https:// contra servidor em HTTP gera erro SSL (packet length too long).",
  [ME_SETTING_KEYS.API_KEY]: "Valor enviado no cabeçalho de autenticação (ex.: token ou Bearer).",
  [ME_SETTING_KEYS.INVENTORY_PATH]:
    "ETAPA 1 — lista de computadores com resource_id (ex.: /api/1.4/som/computers ou /api/1.4/inventory/scancomputers). A ETAPA 2 usa /api/1.4/inventory/compdetailssummary fixo na integração.",
  [ME_SETTING_KEYS.AUTH_HEADER_NAME]: "Nome do cabeçalho HTTP de autenticação (padrão: Authorization).",
  [ME_SETTING_KEYS.PAGE_LIMIT]: "Itens por página ao paginar a API (1–500).",
  [ME_SETTING_KEYS.MAX_PAGES]: "Máximo de páginas a percorrer em uma sincronização.",
  [ENTRA_SETTING_KEYS.TENANT_ID]: "ID do locatário (tenant) Microsoft Entra / Azure AD.",
  [ENTRA_SETTING_KEYS.CLIENT_ID]: "Application (client) ID do app registrado no Entra.",
  [ENTRA_SETTING_KEYS.CLIENT_SECRET]: "Client secret do app (fluxo client credentials).",
};
