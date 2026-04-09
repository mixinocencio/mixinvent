"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { prismaFkDeleteError } from "@/lib/prisma-delete";
import { firstZodIssue } from "@/lib/zod-errors";
import {
  marcaUpdatePayloadSchema,
  parseMarcaFormData,
  type MarcaUpdatePayload,
} from "./schema";

export async function createMarca(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseMarcaFormData(formData);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  await prisma.brand.create({
    data: {
      nome: d.nome,
      site: d.site,
      telefoneSuporte: d.telefoneSuporte,
      emailSuporte: d.emailSuporte,
    },
  });
  revalidatePath("/marcas");
  return {};
}

export async function updateMarca(id: string, data: MarcaUpdatePayload): Promise<{ error?: string }> {
  const parsed = marcaUpdatePayloadSchema.safeParse(data);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  try {
    await prisma.brand.update({
      where: { id },
      data: {
        nome: d.nome,
        site: d.site,
        telefoneSuporte: d.telefoneSuporte,
        emailSuporte: d.emailSuporte,
      },
    });
    revalidatePath("/marcas");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível atualizar a marca." };
  }
}

export async function deleteMarca(id: string): Promise<{ error?: string }> {
  try {
    await prisma.brand.delete({ where: { id } });
    revalidatePath("/marcas");
    return {};
  } catch (e) {
    const fk = prismaFkDeleteError(e);
    if (fk) return fk;
    console.error(e);
    return { error: "Não foi possível excluir." };
  }
}
