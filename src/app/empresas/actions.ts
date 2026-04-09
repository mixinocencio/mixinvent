"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { prismaFkDeleteError } from "@/lib/prisma-delete";
import { firstZodIssue } from "@/lib/zod-errors";
import {
  empresaUpdatePayloadSchema,
  parseEmpresaFormData,
  type EmpresaUpdatePayload,
} from "./schema";

export async function createEmpresa(formData: FormData): Promise<{ error?: string }> {
  const parsed = parseEmpresaFormData(formData);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  await prisma.company.create({
    data: {
      nome: d.nome,
      cnpj: d.cnpj,
      emailContato: d.emailContato,
      telefone: d.telefone,
      cep: d.cep,
      rua: d.rua,
      numero: d.numero,
      complemento: d.complemento,
      bairro: d.bairro,
      cidade: d.cidade,
      estado: d.estado,
    },
  });
  revalidatePath("/empresas");
  return {};
}

export async function updateEmpresa(
  id: string,
  data: EmpresaUpdatePayload,
): Promise<{ error?: string }> {
  const parsed = empresaUpdatePayloadSchema.safeParse(data);
  if (!parsed.success) return { error: firstZodIssue(parsed.error) };
  const d = parsed.data;
  try {
    await prisma.company.update({
      where: { id },
      data: {
        nome: d.nome,
        cnpj: d.cnpj,
        emailContato: d.emailContato,
        telefone: d.telefone,
        cep: d.cep,
        rua: d.rua,
        numero: d.numero,
        complemento: d.complemento,
        bairro: d.bairro,
        cidade: d.cidade,
        estado: d.estado,
      },
    });
    revalidatePath("/empresas");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível atualizar a empresa." };
  }
}

export async function deleteEmpresa(id: string): Promise<{ error?: string }> {
  try {
    await prisma.company.delete({ where: { id } });
    revalidatePath("/empresas");
    return {};
  } catch (e) {
    const fk = prismaFkDeleteError(e);
    if (fk) return fk;
    console.error(e);
    return { error: "Não foi possível excluir." };
  }
}
