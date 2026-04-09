"use server";

import { AssetStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { firstZodIssue } from "@/lib/zod-errors";
import { entradaCompraSchema } from "./schema";

function parseDataCompraLocal(isoDate: string): Date {
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date(NaN);
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function buildTagPatrimonio(prefixo: string, index: number): string {
  const base = prefixo.trim().replace(/\s+/g, "-");
  return `${base}-${String(index + 1).padStart(3, "0")}`;
}

export type ProcessarEntradaCompraResult =
  | { error: string }
  | {
      ok: true;
      redirectTo: "/equipamentos" | "/insumos";
      message: string;
    };

export async function processarEntradaCompra(data: unknown): Promise<ProcessarEntradaCompraResult> {
  const parsed = entradaCompraSchema.safeParse(data);
  if (!parsed.success) {
    return { error: firstZodIssue(parsed.error) };
  }

  const d = parsed.data;
  const dataCompra = parseDataCompraLocal(d.dataCompra);
  if (Number.isNaN(dataCompra.getTime())) {
    return { error: "Data da compra inválida." };
  }

  const valorTotalNum = d.quantidade * d.valorUnitario;
  const valorTotal = new Prisma.Decimal(valorTotalNum.toFixed(2));
  const valorUnitDec = new Prisma.Decimal(Number(d.valorUnitario).toFixed(2));

  const supplier = await prisma.supplier.findUnique({ where: { id: d.supplierId } });
  if (!supplier) {
    return { error: "Fornecedor inválido ou removido." };
  }

  try {
    if (d.tipoItem === "EQUIPAMENTO") {
      const modelId = d.modelId!;
      const categoryId = d.categoryId!;
      const companyId = d.companyId!;
      const stockTypeId = d.stockTypeId!;
      const prefixo = d.prefixoTag!.trim();

      const [category, company, stockType, model] = await Promise.all([
        prisma.category.findUnique({ where: { id: categoryId } }),
        prisma.company.findUnique({ where: { id: companyId } }),
        prisma.stockType.findUnique({ where: { id: stockTypeId } }),
        prisma.deviceModel.findUnique({
          where: { id: modelId },
          select: { id: true, nome: true, brandId: true, isSerialized: true },
        }),
      ]);

      if (!category || category.tipo !== "PATRIMONIO") {
        return { error: "Categoria inválida: use uma categoria do tipo Patrimônio." };
      }
      if (!company) return { error: "Empresa inválida." };
      if (!stockType) return { error: "Tipo de estoque inválido." };
      if (!model) return { error: "Modelo inválido." };

      const q = d.quantidade;
      const seriesInput = d.numerosSerie.map((s) => s.trim());

      if (model.isSerialized) {
        if (seriesInput.length !== q) {
          return { error: `Informe exatamente ${q} número(s) de série para este modelo serializado.` };
        }
        const emptyIdx = seriesInput.findIndex((s) => !s);
        if (emptyIdx >= 0) {
          return { error: `Preencha o número de série do item ${emptyIdx + 1}.` };
        }
      }

      await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.create({
          data: {
            numeroNF: d.numeroNF.trim(),
            supplierId: d.supplierId,
            dataCompra,
            valorTotal,
            observacoes: d.observacoes?.trim() || null,
          },
        });

        for (let i = 0; i < q; i++) {
          await tx.asset.create({
            data: {
              tagPatrimonio: buildTagPatrimonio(prefixo, i),
              numeroSerie: model.isSerialized ? seriesInput[i] : null,
              dataCompra,
              valor: valorUnitDec,
              status: AssetStatus.DISPONIVEL,
              purchaseOrder: { connect: { id: po.id } },
              category: { connect: { id: categoryId } },
              company: { connect: { id: companyId } },
              brand: { connect: { id: model.brandId } },
              model: { connect: { id: model.id } },
              stockType: { connect: { id: stockTypeId } },
            },
          });
        }
      });

      revalidatePath("/equipamentos");
      revalidatePath("/");

      return {
        ok: true,
        redirectTo: "/equipamentos",
        message: `${q} equipamento(ns) cadastrado(s) vinculado(s) à NF ${d.numeroNF.trim()} (${model.nome}).`,
      };
    }

    const consumableId = d.consumableId!;
    const consumable = await prisma.consumable.findUnique({
      where: { id: consumableId },
      include: { category: true },
    });
    if (!consumable) return { error: "Insumo não encontrado." };
    if (consumable.category.tipo !== "INSUMO") {
      return { error: "Item selecionado não é um insumo válido." };
    }

    const qty = d.quantidade;

    await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          numeroNF: d.numeroNF.trim(),
          supplierId: d.supplierId,
          dataCompra,
          valorTotal,
          observacoes: d.observacoes?.trim() || null,
        },
      });

      await tx.consumable.update({
        where: { id: consumableId },
        data: {
          quantidadeEstoque: { increment: qty },
          purchaseOrder: { connect: { id: po.id } },
        },
      });
    });

    revalidatePath("/insumos");
    revalidatePath("/");

    return {
      ok: true,
      redirectTo: "/insumos",
      message: `${qty} unidade(s) de "${consumable.nome}" adicionada(s) ao estoque (NF ${d.numeroNF.trim()}).`,
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        error:
          "Conflito de unicidade: tag de patrimônio ou hostname já existe no sistema. Ajuste o prefixo das tags.",
      };
    }
    console.error(e);
    return { error: "Não foi possível registrar a entrada. Tente novamente." };
  }
}
