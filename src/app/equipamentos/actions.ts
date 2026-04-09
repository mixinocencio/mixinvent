"use server";

import { revalidatePath } from "next/cache";
import { AssetLogAcao, AssetStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseCheckoutChecklistResult } from "@/lib/delivery-checklist";
import { firstZodIssue } from "@/lib/zod-errors";
import {
  assetFormSchema,
  toAssetCreatePayload,
  toAssetUpdatePayload,
  type AssetFormValues,
} from "@/lib/schemas/asset";

export async function createAsset(
  input: AssetFormValues,
): Promise<{ error?: string; id?: string }> {
  const parsed = assetFormSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first =
      flat.fieldErrors.tagPatrimonio?.[0] ??
      flat.fieldErrors.categoryId?.[0] ??
      flat.fieldErrors.companyId?.[0] ??
      flat.fieldErrors.brandId?.[0] ??
      flat.fieldErrors.modelId?.[0] ??
      flat.fieldErrors.stockTypeId?.[0] ??
      "Dados inválidos.";
    return { error: first };
  }
  const v = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: v.categoryId } });
  if (!category || category.tipo !== "PATRIMONIO") {
    return { error: "Selecione uma categoria do tipo Patrimônio." };
  }

  const [company, brand, stockType, model] = await Promise.all([
    prisma.company.findUnique({ where: { id: v.companyId } }),
    prisma.brand.findUnique({ where: { id: v.brandId } }),
    prisma.stockType.findUnique({ where: { id: v.stockTypeId } }),
    prisma.deviceModel.findUnique({ where: { id: v.modelId }, select: { id: true, brandId: true } }),
  ]);

  if (!company) return { error: "Empresa inválida." };
  if (!brand) return { error: "Marca inválida." };
  if (!stockType) return { error: "Tipo de estoque inválido." };
  if (!model) return { error: "Modelo inválido." };
  if (model.brandId !== v.brandId) {
    return { error: "O modelo não pertence à marca selecionada." };
  }

  let dataCompra: Date | null = null;
  if (v.dataCompra?.trim()) {
    const d = new Date(v.dataCompra);
    if (Number.isNaN(d.getTime())) return { error: "Data de compra inválida." };
    dataCompra = d;
  }

  let valor: Prisma.Decimal | null = null;
  if (v.valor?.trim()) {
    const n = Number(v.valor.replace(",", "."));
    if (Number.isNaN(n)) return { error: "Valor inválido." };
    valor = new Prisma.Decimal(n);
  }

  try {
    const asset = await prisma.asset.create({
      data: toAssetCreatePayload(v, { dataCompra, valor }),
    });
    revalidatePath("/equipamentos");
    revalidatePath("/");
    return { id: asset.id };
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível salvar (tag ou hostname duplicado?)." };
  }
}

export async function updateAsset(id: string, data: unknown): Promise<{ error?: string }> {
  const parsed = assetFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: firstZodIssue(parsed.error) };
  }
  const v = parsed.data;

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) return { error: "Equipamento não encontrado." };

  const category = await prisma.category.findUnique({ where: { id: v.categoryId } });
  if (!category || category.tipo !== "PATRIMONIO") {
    return { error: "Selecione uma categoria do tipo Patrimônio." };
  }

  const [company, brand, stockType, model] = await Promise.all([
    prisma.company.findUnique({ where: { id: v.companyId } }),
    prisma.brand.findUnique({ where: { id: v.brandId } }),
    prisma.stockType.findUnique({ where: { id: v.stockTypeId } }),
    prisma.deviceModel.findUnique({ where: { id: v.modelId }, select: { id: true, brandId: true } }),
  ]);

  if (!company) return { error: "Empresa inválida." };
  if (!brand) return { error: "Marca inválida." };
  if (!stockType) return { error: "Tipo de estoque inválido." };
  if (!model) return { error: "Modelo inválido." };
  if (model.brandId !== v.brandId) {
    return { error: "O modelo não pertence à marca selecionada." };
  }

  let dataCompra: Date | null = null;
  if (v.dataCompra?.trim()) {
    const d = new Date(v.dataCompra);
    if (Number.isNaN(d.getTime())) return { error: "Data de compra inválida." };
    dataCompra = d;
  }

  let valor: Prisma.Decimal | null = null;
  if (v.valor?.trim()) {
    const n = Number(v.valor.replace(",", "."));
    if (Number.isNaN(n)) return { error: "Valor inválido." };
    valor = new Prisma.Decimal(n);
  }

  try {
    await prisma.asset.update({
      where: { id },
      data: toAssetUpdatePayload(v, { dataCompra, valor }),
    });
    revalidatePath("/equipamentos");
    revalidatePath(`/equipamentos/${id}`);
    revalidatePath("/");
    return {};
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { error: "Equipamento não encontrado." };
    }
    console.error(e);
    return { error: "Não foi possível atualizar (tag ou hostname duplicado?)." };
  }
}

export async function deleteAsset(id: string): Promise<{ error?: string }> {
  const asset = await prisma.asset.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!asset) return { error: "Equipamento não encontrado." };
  if (asset.status === AssetStatus.EM_USO) {
    return {
      error: "Não é possível excluir um equipamento em uso. Faça o Check-in primeiro.",
    };
  }

  try {
    await prisma.asset.delete({ where: { id } });
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível excluir o equipamento." };
  }

  revalidatePath("/equipamentos");
  revalidatePath("/");
  return {};
}

export async function movimentarEquipamento(
  assetId: string,
  acao: AssetLogAcao,
  userId: string,
  observacao?: string | null,
  checklistResult?: unknown,
  nexusTicketId?: string | null,
): Promise<{ error?: string }> {
  if (!assetId || !userId) return { error: "Dados incompletos." };

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return { error: "Equipamento não encontrado." };

  const user = await prisma.user.findFirst({ where: { id: userId, status: "ATIVO" } });
  if (!user) return { error: "Colaborador inválido ou inativo." };

  let checklistJson: Prisma.InputJsonValue | null = null;
  let nexusIdTrim: string | null = null;
  if (acao === AssetLogAcao.CHECKOUT) {
    checklistJson = parseCheckoutChecklistResult(checklistResult);
    if (!checklistJson) {
      return {
        error: "Checklist de entrega incompleto. Marque todos os itens obrigatórios antes de atribuir o equipamento.",
      };
    }
    const ticket = nexusTicketId?.trim() ?? "";
    if (!ticket) {
      return { error: "Informe o ID do chamado Nexus para registrar o checkout." };
    }
    nexusIdTrim = ticket;
  }

  let nextStatus: AssetStatus;
  let nextUserId: string | null;

  switch (acao) {
    case AssetLogAcao.CHECKOUT:
      nextStatus = AssetStatus.EM_USO;
      nextUserId = userId;
      break;
    case AssetLogAcao.CHECKIN:
      nextStatus = AssetStatus.DISPONIVEL;
      nextUserId = null;
      break;
    case AssetLogAcao.MANUTENCAO:
      nextStatus = AssetStatus.MANUTENCAO;
      nextUserId = null;
      break;
    default:
      return { error: "Ação inválida." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: assetId },
        data: { status: nextStatus, userId: nextUserId },
      });
      await tx.assetLog.create({
        data: {
          assetId,
          userId,
          acao,
          observacao: observacao?.trim() || null,
          ...(checklistJson != null ? { checklistResult: checklistJson } : {}),
          ...(nexusIdTrim != null ? { nexusTicketId: nexusIdTrim } : {}),
        },
      });
    });
    revalidatePath(`/equipamentos/${assetId}`);
    revalidatePath("/equipamentos");
    revalidatePath("/movimentacoes");
    revalidatePath("/");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Falha ao registrar movimentação." };
  }
}
