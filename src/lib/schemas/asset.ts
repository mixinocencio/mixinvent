import { z } from "zod";
import { AssetStatus, Prisma } from "@prisma/client";

const statuses = [AssetStatus.DISPONIVEL, AssetStatus.EM_USO, AssetStatus.MANUTENCAO, AssetStatus.SUCATA] as const;

const uuidMsg = "Selecione uma opção válida.";

export const assetFormSchema = z.object({
  tagPatrimonio: z.string().min(1, "Informe a tag de patrimônio."),
  hostname: z.string().optional(),
  numeroSerie: z.string().optional(),
  sistemaOperacional: z.string().optional(),
  statusAntivirus: z.string().optional(),
  dataCompra: z.string().optional(),
  valor: z.string().optional(),
  status: z.enum(statuses),
  categoryId: z.string().uuid(uuidMsg),
  companyId: z.string().uuid(uuidMsg),
  brandId: z.string().uuid(uuidMsg),
  modelId: z.string().uuid(uuidMsg),
  stockTypeId: z.string().uuid(uuidMsg),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;

function trimOrNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t === "" || t === undefined ? null : t;
}

export function toAssetCreatePayload(
  v: AssetFormValues,
  extras: { dataCompra: Date | null; valor: Prisma.Decimal | null },
): Prisma.AssetCreateInput {
  return {
    tagPatrimonio: v.tagPatrimonio.trim(),
    hostname: trimOrNull(v.hostname),
    numeroSerie: trimOrNull(v.numeroSerie),
    sistemaOperacional: trimOrNull(v.sistemaOperacional),
    statusAntivirus: trimOrNull(v.statusAntivirus),
    dataCompra: extras.dataCompra,
    valor: extras.valor,
    status: v.status,
    category: { connect: { id: v.categoryId } },
    company: { connect: { id: v.companyId } },
    brand: { connect: { id: v.brandId } },
    model: { connect: { id: v.modelId } },
    stockType: { connect: { id: v.stockTypeId } },
  };
}

export function toAssetUpdatePayload(
  v: AssetFormValues,
  extras: { dataCompra: Date | null; valor: Prisma.Decimal | null },
): Prisma.AssetUpdateInput {
  return {
    tagPatrimonio: v.tagPatrimonio.trim(),
    hostname: trimOrNull(v.hostname),
    numeroSerie: trimOrNull(v.numeroSerie),
    sistemaOperacional: trimOrNull(v.sistemaOperacional),
    statusAntivirus: trimOrNull(v.statusAntivirus),
    dataCompra: extras.dataCompra,
    valor: extras.valor,
    status: v.status,
    category: { connect: { id: v.categoryId } },
    company: { connect: { id: v.companyId } },
    brand: { connect: { id: v.brandId } },
    model: { connect: { id: v.modelId } },
    stockType: { connect: { id: v.stockTypeId } },
    ...(v.status !== AssetStatus.EM_USO ? { userId: null } : {}),
  };
}
