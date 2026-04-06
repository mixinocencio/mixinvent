"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createColaborador(formData: FormData): Promise<{ error?: string }> {
  const nome = formData.get("nome")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const depRaw = formData.get("departamentoId")?.toString().trim();
  const departamentoId = depRaw && depRaw !== "none" ? depRaw : null;
  if (!nome) return { error: "Informe o nome." };
  if (!email) return { error: "Informe o e-mail." };
  try {
    await prisma.user.create({
      data: {
        nome,
        email,
        departamentoId,
      },
    });
    revalidatePath("/colaboradores");
    return {};
  } catch {
    return { error: "Não foi possível salvar (e-mail duplicado?)." };
  }
}
