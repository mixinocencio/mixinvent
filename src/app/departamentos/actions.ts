"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createDepartamento(formData: FormData): Promise<{ error?: string }> {
  const nome = formData.get("nome")?.toString().trim();
  const localizacao = formData.get("localizacao")?.toString().trim();
  if (!nome) return { error: "Informe o nome do departamento." };
  await prisma.department.create({
    data: { nome, localizacao: localizacao || null },
  });
  revalidatePath("/departamentos");
  return {};
}
