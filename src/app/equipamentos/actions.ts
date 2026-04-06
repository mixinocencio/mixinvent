"use server";

import { revalidatePath } from "next/cache";
import { AssetLogAcao, AssetStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assetFormSchema, type AssetFormValues } from "@/lib/schemas/asset";

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t === "" || t === undefined ? null : t;
}

export async function createAsset(
  input: AssetFormValues,
): Promise<{ error?: string; id?: string }> {
  const parsed = assetFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.tagPatrimonio?.[0] ?? "Dados inválidos." };
  }
  const v = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: v.categoryId } });
  if (!category || category.tipo !== "PATRIMONIO") {
    return { error: "Selecione uma categoria do tipo Patrimônio." };
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
      data: {
        tagPatrimonio: v.tagPatrimonio.trim(),
        hostname: emptyToNull(v.hostname),
        numeroSerie: emptyToNull(v.numeroSerie),
        marca: emptyToNull(v.marca),
        modelo: emptyToNull(v.modelo),
        sistemaOperacional: emptyToNull(v.sistemaOperacional),
        statusAntivirus: emptyToNull(v.statusAntivirus),
        dataCompra,
        valor,
        status: v.status,
        categoryId: v.categoryId,
      },
    });
    revalidatePath("/equipamentos");
    revalidatePath("/");
    return { id: asset.id };
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível salvar (tag ou hostname duplicado?)." };
  }
}

export async function movimentarEquipamento(
  assetId: string,
  acao: AssetLogAcao,
  userId: string,
  observacao?: string | null,
): Promise<{ error?: string }> {
  if (!assetId || !userId) return { error: "Dados incompletos." };

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return { error: "Equipamento não encontrado." };

  const user = await prisma.user.findFirst({ where: { id: userId, status: "ATIVO" } });
  if (!user) return { error: "Colaborador inválido ou inativo." };

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
