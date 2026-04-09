"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { prismaFkDeleteError } from "@/lib/prisma-delete";
import { firstZodIssue } from "@/lib/zod-errors";
import {
  departamentoUpdatePayloadSchema,
  parseDepartamentoFormData,
  type DepartamentoUpdatePayload,
} from "./schema";

export async function createDepartamento(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseDepartamentoFormData(formData);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  await prisma.department.create({
    data: {
      nome: d.nome,
      localizacao: d.localizacao,
      centroCusto: d.centroCusto,
    },
  });
  revalidatePath("/departamentos");
  return {};
}

export async function updateDepartamento(
  id: string,
  data: DepartamentoUpdatePayload,
): Promise<{ error?: string }> {
  const parsed = departamentoUpdatePayloadSchema.safeParse(data);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  try {
    await prisma.department.update({
      where: { id },
      data: {
        nome: d.nome,
        localizacao: d.localizacao,
        centroCusto: d.centroCusto,
      },
    });
    revalidatePath("/departamentos");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível atualizar o departamento." };
  }
}

export async function deleteDepartamento(id: string): Promise<{ error?: string }> {
  try {
    await prisma.department.delete({ where: { id } });
    revalidatePath("/departamentos");
    return {};
  } catch (e) {
    const fk = prismaFkDeleteError(e);
    if (fk) return fk;
    console.error(e);
    return { error: "Não foi possível excluir." };
  }
}
