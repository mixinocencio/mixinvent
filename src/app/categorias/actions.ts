"use server";

import { revalidatePath } from "next/cache";
import { CategoryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { prismaFkDeleteError } from "@/lib/prisma-delete";

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

export async function updateCategoria(
  id: string,
  data: { nome: string; tipo: CategoryType },
): Promise<{ error?: string }> {
  const nome = typeof data.nome === "string" ? data.nome.trim() : "";
  const tipoRaw = data.tipo;
  if (!nome) return { error: "Informe o nome da categoria." };
  if (tipoRaw !== "PATRIMONIO" && tipoRaw !== "INSUMO") {
    return { error: "Tipo inválido." };
  }
  const tipo = tipoRaw as CategoryType;
  try {
    await prisma.category.update({
      where: { id },
      data: { nome, tipo },
    });
    revalidatePath("/categorias");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível atualizar a categoria." };
  }
}

export async function deleteCategoria(id: string): Promise<{ error?: string }> {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/categorias");
    return {};
  } catch (e) {
    const fk = prismaFkDeleteError(e);
    if (fk) return fk;
    console.error(e);
    return { error: "Não foi possível excluir." };
  }
}
