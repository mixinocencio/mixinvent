"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { prismaFkDeleteError } from "@/lib/prisma-delete";
import { firstZodIssue } from "@/lib/zod-errors";
import { consumableInputSchema } from "./schema";

async function assertInsumoCategory(categoryId: string): Promise<{ error: string } | null> {
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, tipo: "INSUMO" },
  });
  if (!cat) return { error: "Categoria inválida ou não é do tipo Insumo." };
  return null;
}

export async function createConsumable(data: unknown): Promise<{ error?: string }> {
  const parsed = consumableInputSchema.safeParse(data);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };

  const catErr = await assertInsumoCategory(parsed.data.categoryId);
  if (catErr) return catErr;

  try {
    await prisma.consumable.create({
      data: {
        nome: parsed.data.nome,
        categoryId: parsed.data.categoryId,
        quantidadeEstoque: parsed.data.quantidadeEstoque,
        estoqueMinimo: parsed.data.estoqueMinimo,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { error: "Não foi possível vincular à categoria informada." };
    }
    throw e;
  }

  revalidatePath("/insumos");
  return {};
}

export async function updateConsumable(id: string, data: unknown): Promise<{ error?: string }> {
  const parsed = consumableInputSchema.safeParse(data);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };

  const catErr = await assertInsumoCategory(parsed.data.categoryId);
  if (catErr) return catErr;

  try {
    await prisma.consumable.update({
      where: { id },
      data: {
        nome: parsed.data.nome,
        categoryId: parsed.data.categoryId,
        quantidadeEstoque: parsed.data.quantidadeEstoque,
        estoqueMinimo: parsed.data.estoqueMinimo,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { error: "Insumo não encontrado." };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { error: "Não foi possível vincular à categoria informada." };
    }
    throw e;
  }

  revalidatePath("/insumos");
  return {};
}

export async function deleteConsumable(id: string): Promise<{ error?: string }> {
  try {
    await prisma.consumable.delete({ where: { id } });
  } catch (e) {
    const fk = prismaFkDeleteError(e);
    if (fk) return fk;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { error: "Insumo não encontrado." };
    }
    throw e;
  }

  revalidatePath("/insumos");
  return {};
}

export async function movimentarEstoque(
  id: string,
  quantidade: number,
  tipo: "ENTRADA" | "SAIDA",
): Promise<{ error?: string }> {
  const q = Math.trunc(quantidade);
  if (!Number.isFinite(q) || q <= 0) {
    return { error: "Informe uma quantidade inteira maior que zero." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.consumable.findUnique({
        where: { id },
        select: { quantidadeEstoque: true },
      });
      if (!row) return "not_found" as const;
      if (tipo === "ENTRADA") {
        await tx.consumable.update({
          where: { id },
          data: { quantidadeEstoque: { increment: q } },
        });
        return "ok" as const;
      }
      if (row.quantidadeEstoque < q) return "insufficient" as const;
      await tx.consumable.update({
        where: { id },
        data: { quantidadeEstoque: row.quantidadeEstoque - q },
      });
      return "ok" as const;
    });

    if (result === "not_found") return { error: "Insumo não encontrado." };
    if (result === "insufficient") {
      return { error: "Não é possível retirar mais do que há em estoque." };
    }
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível atualizar o estoque." };
  }

  revalidatePath("/insumos");
  return {};
}
