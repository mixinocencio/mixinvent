"use server";

import {
  AssetStatus,
  OrigemEntrada,
  Prisma,
  TipoMovimentacaoInsumo,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { formatCnpjDigits } from "@/lib/format-cnpj";
import { firstZodIssue } from "@/lib/zod-errors";

import { registrarEntradaComNFSchema } from "./schema";

function parseDataEmissaoLocal(isoDate: string): Date {
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date(NaN);
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function trimOrNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t === "" || t === undefined ? null : t;
}

export type RegistrarEntradaComNFResult =
  | { ok: true; notaFiscalId: string; ativosCriados: number; insumosMovimentados: number }
  | { ok: false; error: string };

export async function registrarEntradaComNF(
  data: unknown,
): Promise<RegistrarEntradaComNFResult> {
  const parsed = registrarEntradaComNFSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: firstZodIssue(parsed.error) };
  }

  const d = parsed.data;
  const dataEmissao = parseDataEmissaoLocal(d.dataEmissao);
  if (Number.isNaN(dataEmissao.getTime())) {
    return { ok: false, error: "Data inválida." };
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: d.supplierId } });
  if (!supplier) {
    return { ok: false, error: "Fornecedor inválido ou removido." };
  }

  const fornecedorLabel = `${supplier.name} · ${formatCnpjDigits(supplier.cnpj)}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const nf = await tx.notaFiscal.create({
        data: {
          numero: d.numero.trim(),
          fornecedor: fornecedorLabel,
          dataEmissao,
          valorTotal: d.valorTotal!,
        },
      });

      for (const row of d.ativos) {
        const [category, model] = await Promise.all([
          tx.category.findUnique({ where: { id: row.categoryId } }),
          tx.deviceModel.findUnique({
            where: { id: row.modelId },
            select: { id: true, brandId: true, isSerialized: true },
          }),
        ]);

        if (!category || category.tipo !== "PATRIMONIO") {
          throw new Error("CATEGORIA_INVALIDA");
        }
        if (!model || model.brandId !== row.brandId) {
          throw new Error("MODELO_INVALIDO");
        }
        if (model.isSerialized && !trimOrNull(row.numeroSerie)) {
          throw new Error("SERIE_OBRIGATORIA");
        }

        await tx.asset.create({
          data: {
            tagPatrimonio: row.tagPatrimonio.trim(),
            hostname: trimOrNull(row.nome),
            numeroSerie: trimOrNull(row.numeroSerie),
            status: AssetStatus.DISPONIVEL,
            dataCompra: dataEmissao,
            origem: OrigemEntrada.NOTA_FISCAL,
            notaFiscal: { connect: { id: nf.id } },
            category: { connect: { id: row.categoryId } },
            company: { connect: { id: d.companyId } },
            brand: { connect: { id: row.brandId } },
            model: { connect: { id: row.modelId } },
            stockType: { connect: { id: d.stockTypeId } },
          },
        });
      }

      let insumosMovimentados = 0;
      for (const line of d.insumos) {
        const consumable = await tx.consumable.findUnique({
          where: { id: line.consumableId },
          include: { category: { select: { tipo: true } } },
        });
        if (!consumable || consumable.category.tipo !== "INSUMO") {
          throw new Error("INSUMO_INVALIDO");
        }

        await tx.movimentacaoInsumo.create({
          data: {
            consumableId: line.consumableId,
            quantidade: line.quantidade,
            tipo: TipoMovimentacaoInsumo.ENTRADA,
            origem: OrigemEntrada.NOTA_FISCAL,
            notaFiscalId: nf.id,
          },
        });

        await tx.consumable.update({
          where: { id: line.consumableId },
          data: { quantidadeEstoque: { increment: line.quantidade } },
        });
        insumosMovimentados += 1;
      }

      return {
        notaFiscalId: nf.id,
        ativosCriados: d.ativos.length,
        insumosMovimentados,
      };
    });

    revalidatePath("/equipamentos");
    revalidatePath("/");
    revalidatePath("/insumos");
    revalidatePath("/compras/nova");

    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "CATEGORIA_INVALIDA") {
        return { ok: false, error: "Uma das categorias não é do tipo Patrimônio." };
      }
      if (e.message === "MODELO_INVALIDO") {
        return { ok: false, error: "Modelo incompatível com a marca informada em uma das linhas." };
      }
      if (e.message === "SERIE_OBRIGATORIA") {
        return {
          ok: false,
          error: "Modelo serializado exige número de série preenchido na linha correspondente.",
        };
      }
      if (e.message === "INSUMO_INVALIDO") {
        return { ok: false, error: "Insumo inválido ou categoria não é do tipo Insumo." };
      }
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        error: "Tag de patrimônio ou hostname duplicado. Ajuste as linhas e tente novamente.",
      };
    }
    console.error(e);
    return { ok: false, error: "Não foi possível registrar a entrada." };
  }
}
