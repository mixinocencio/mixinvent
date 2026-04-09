"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { prismaFkDeleteError } from "@/lib/prisma-delete";

export async function createTipoEstoque(formData: FormData): Promise<{ error?: string }> {
  const nome = formData.get("nome")?.toString().trim();
  if (!nome) return { error: "Informe o nome do tipo de estoque." };
  await prisma.stockType.create({ data: { nome } });
  revalidatePath("/tipos-estoque");
  return {};
}

export async function updateTipoEstoque(
  id: string,
  data: { nome: string },
): Promise<{ error?: string }> {
  const nome = typeof data.nome === "string" ? data.nome.trim() : "";
  if (!nome) return { error: "Informe o nome do tipo de estoque." };
  try {
    await prisma.stockType.update({
      where: { id },
      data: { nome },
    });
    revalidatePath("/tipos-estoque");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível atualizar o tipo de estoque." };
  }
}

export async function deleteTipoEstoque(id: string): Promise<{ error?: string }> {
  try {
    await prisma.stockType.delete({ where: { id } });
    revalidatePath("/tipos-estoque");
    return {};
  } catch (e) {
    const fk = prismaFkDeleteError(e);
    if (fk) return fk;
    console.error(e);
    return { error: "Não foi possível excluir." };
  }
}
