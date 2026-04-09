"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { colaboradorInputSchema, colaboradorToPrismaData } from "./schema";

const COLLAB_DELETE_FK =
  "Não é possível excluir colaboradores que já possuem equipamentos ou logs atrelados.";

async function assertFkExists(data: {
  companyId: string | null;
  departamentoId: string | null;
}): Promise<{ error: string } | null> {
  if (data.companyId) {
    const c = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!c) return { error: "Empresa não encontrada." };
  }
  if (data.departamentoId) {
    const d = await prisma.department.findUnique({ where: { id: data.departamentoId } });
    if (!d) return { error: "Departamento não encontrado." };
  }
  return null;
}

export async function createUser(data: unknown): Promise<{ error?: string }> {
  const parsed = colaboradorInputSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const payload = colaboradorToPrismaData(parsed.data);
  const fkErr = await assertFkExists(payload);
  if (fkErr) return fkErr;

  try {
    await prisma.user.create({
      data: payload,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "E-mail, SamAccountName ou User Principal Name já cadastrado." };
    }
    throw e;
  }

  revalidatePath("/colaboradores");
  revalidatePath("/admin/colaboradores");
  revalidatePath("/relatorios/auditoria");
  return {};
}

export async function updateUser(id: string, data: unknown): Promise<{ error?: string }> {
  const parsed = colaboradorInputSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const payload = colaboradorToPrismaData(parsed.data);
  const fkErr = await assertFkExists(payload);
  if (fkErr) return fkErr;

  try {
    await prisma.user.update({
      where: { id },
      data: payload,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { error: "Colaborador não encontrado." };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "E-mail, SamAccountName ou User Principal Name já cadastrado." };
    }
    throw e;
  }

  revalidatePath("/colaboradores");
  revalidatePath("/admin/colaboradores");
  revalidatePath("/relatorios/auditoria");
  return {};
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { error: COLLAB_DELETE_FK };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { error: "Colaborador não encontrado." };
    }
    throw e;
  }

  revalidatePath("/colaboradores");
  revalidatePath("/admin/colaboradores");
  revalidatePath("/relatorios/auditoria");
  return {};
}
