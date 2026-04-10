"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { hashAuthPassword } from "@/lib/auth-password";
import { prisma } from "@/lib/prisma";

const createOperatorSchema = z.object({
  name: z.string().trim().max(120).nullish(),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export type CreateAuthOperatorInput = z.infer<typeof createOperatorSchema>;

export async function createAuthOperator(
  input: CreateAuthOperatorInput,
): Promise<{ ok: true } | { error: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Sem permissão para criar operadores." };
  }

  const parsed = createOperatorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Verifique os dados informados." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.authUser.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário com este e-mail." };
  }

  const passwordHash = await hashAuthPassword(parsed.data.password);
  const rawName = parsed.data.name?.trim();
  const name = rawName && rawName.length > 0 ? rawName : null;

  await prisma.authUser.create({
    data: {
      email,
      name,
      passwordHash,
      role: "OPERATOR",
    },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
