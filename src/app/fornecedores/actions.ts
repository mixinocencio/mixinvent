"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { prismaFkDeleteError } from "@/lib/prisma-delete";
import { firstZodIssue } from "@/lib/zod-errors";
import {
  parseSupplierFormData,
  supplierUpdatePayloadSchema,
  type SupplierUpdatePayload,
} from "./schema";

export async function createSupplier(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseSupplierFormData(formData);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  try {
    await prisma.supplier.create({
      data: {
        name: d.name,
        cnpj: d.cnpj,
        contactEmail: d.contactEmail,
        phone: d.phone,
        address: d.address,
      },
    });
    revalidatePath("/fornecedores");
    revalidatePath("/compras/nova");
    return {};
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Este CNPJ já está cadastrado." };
    }
    console.error(e);
    return { error: "Não foi possível cadastrar o fornecedor." };
  }
}

export async function updateSupplier(
  id: string,
  data: SupplierUpdatePayload,
): Promise<{ error?: string }> {
  const parsed = supplierUpdatePayloadSchema.safeParse(data);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  try {
    await prisma.supplier.update({
      where: { id },
      data: {
        name: d.name,
        cnpj: d.cnpj,
        contactEmail: d.contactEmail,
        phone: d.phone,
        address: d.address,
      },
    });
    revalidatePath("/fornecedores");
    revalidatePath("/compras/nova");
    return {};
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Este CNPJ já está cadastrado em outro fornecedor." };
    }
    console.error(e);
    return { error: "Não foi possível atualizar o fornecedor." };
  }
}

export async function deleteSupplier(id: string): Promise<{ error?: string }> {
  const n = await prisma.purchaseOrder.count({ where: { supplierId: id } });
  if (n > 0) {
    return { error: "Não é possível excluir: há notas fiscais vinculadas a este fornecedor." };
  }
  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/fornecedores");
    revalidatePath("/compras/nova");
    return {};
  } catch (e) {
    const fk = prismaFkDeleteError(e);
    if (fk) return fk;
    console.error(e);
    return { error: "Não foi possível excluir." };
  }
}
