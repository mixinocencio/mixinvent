"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { prismaFkDeleteError } from "@/lib/prisma-delete";
import { firstZodIssue } from "@/lib/zod-errors";
import {
  modeloUpdatePayloadSchema,
  parseModeloFormData,
  type ModeloUpdatePayload,
} from "./schema";

export async function createModelo(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseModeloFormData(formData);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  const brand = await prisma.brand.findUnique({ where: { id: d.brandId } });
  if (!brand) return { error: "Marca inválida." };
  await prisma.deviceModel.create({
    data: {
      nome: d.nome,
      brandId: d.brandId,
      partNumber: d.partNumber,
      mesesGarantia: d.mesesGarantia,
      mesesDepreciacao: d.mesesDepreciacao,
      isSerialized: d.isSerialized === "true",
    },
  });
  revalidatePath("/modelos");
  return {};
}

export async function updateModelo(
  id: string,
  data: ModeloUpdatePayload,
): Promise<{ error?: string }> {
  const parsed = modeloUpdatePayloadSchema.safeParse(data);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  const brand = await prisma.brand.findUnique({ where: { id: d.brandId } });
  if (!brand) return { error: "Marca inválida." };
  try {
    await prisma.deviceModel.update({
      where: { id },
      data: {
        nome: d.nome,
        brandId: d.brandId,
        partNumber: d.partNumber,
        mesesGarantia: d.mesesGarantia,
        mesesDepreciacao: d.mesesDepreciacao,
        isSerialized: d.isSerialized === "true",
      },
    });
    revalidatePath("/modelos");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível atualizar o modelo." };
  }
}

export async function deleteModelo(id: string): Promise<{ error?: string }> {
  try {
    await prisma.deviceModel.delete({ where: { id } });
    revalidatePath("/modelos");
    return {};
  } catch (e) {
    const fk = prismaFkDeleteError(e);
    if (fk) return fk;
    console.error(e);
    return { error: "Não foi possível excluir." };
  }
}
