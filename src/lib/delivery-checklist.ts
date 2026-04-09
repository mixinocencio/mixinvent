import type { Prisma } from "@prisma/client";

export const DELIVERY_CHECKLIST_ITEM_IDS = [
  "padraoFormatacao",
  "ingressadoDominio",
  "antivirusEdr",
  "bitlocker",
  "termoResponsabilidade",
] as const;

export type DeliveryChecklistItemId = (typeof DELIVERY_CHECKLIST_ITEM_IDS)[number];

export type DeliveryChecklistState = Record<DeliveryChecklistItemId, boolean>;

export const INITIAL_DELIVERY_CHECKLIST_STATE: DeliveryChecklistState = {
  padraoFormatacao: false,
  ingressadoDominio: false,
  antivirusEdr: false,
  bitlocker: false,
  termoResponsabilidade: false,
};

export const DELIVERY_CHECKLIST_LABELS: Record<DeliveryChecklistItemId, string> = {
  padraoFormatacao: "Padrão de formatação aplicado.",
  ingressadoDominio: "Ingressado no domínio (AD/Entra).",
  antivirusEdr: "Antivírus/EDR ativo e atualizado.",
  bitlocker: "BitLocker habilitado e chave salva.",
  termoResponsabilidade: "Termo de responsabilidade assinado.",
};

export function isDeliveryChecklistComplete(s: DeliveryChecklistState): boolean {
  return DELIVERY_CHECKLIST_ITEM_IDS.every((k) => s[k] === true);
}

/** Valida payload vindo do cliente no checkout. */
export function parseCheckoutChecklistResult(raw: unknown): Prisma.InputJsonValue | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  for (const k of DELIVERY_CHECKLIST_ITEM_IDS) {
    if (o[k] !== true) return null;
  }
  return {
    items: Object.fromEntries(DELIVERY_CHECKLIST_ITEM_IDS.map((id) => [id, true])) as Record<
      DeliveryChecklistItemId,
      true
    >,
    version: 1,
    recordedAt: new Date().toISOString(),
  };
}
