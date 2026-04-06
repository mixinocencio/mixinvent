"use server";

import { revalidatePath } from "next/cache";
import { CategoryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createCategoria(formData: FormData): Promise<{ error?: string }> {
  const nome = formData.get("nome")?.toString().trim();
  const tipoRaw = formData.get("tipo")?.toString();
  if (!nome) return { error: "Informe o nome da categoria." };
  if (tipoRaw !== "PATRIMONIO" && tipoRaw !== "INSUMO") {
    return { error: "Tipo inválido." };
  }
  const tipo = tipoRaw as CategoryType;
  await prisma.category.create({ data: { nome, tipo } });
  revalidatePath("/categorias");
  return {};
}
