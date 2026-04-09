import { z } from "zod";

export const entradaCompraSchema = z
  .object({
    numeroNF: z.string().trim().min(1, "Informe o número da NF."),
    supplierId: z.string().uuid("Selecione um fornecedor."),
    dataCompra: z.string().min(1, "Informe a data da compra."),
    observacoes: z.string().optional(),
    tipoItem: z.enum(["EQUIPAMENTO", "INSUMO"]),
    modelId: z.string().uuid().optional(),
    consumableId: z.string().uuid().optional(),
    quantidade: z.coerce.number().int("Use um número inteiro.").positive("Quantidade deve ser maior que zero."),
    valorUnitario: z.coerce.number().nonnegative("Valor unitário inválido."),
    numerosSerie: z.array(z.string()),
    prefixoTag: z.string().optional(),
    companyId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    stockTypeId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipoItem === "EQUIPAMENTO") {
      if (!data.modelId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o modelo.", path: ["modelId"] });
      }
      const p = data.prefixoTag?.trim();
      if (!p) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o prefixo das tags de patrimônio.",
          path: ["prefixoTag"],
        });
      }
      if (!data.companyId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione a empresa.", path: ["companyId"] });
      }
      if (!data.categoryId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione a categoria (patrimônio).",
          path: ["categoryId"],
        });
      }
      if (!data.stockTypeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione o tipo de estoque.",
          path: ["stockTypeId"],
        });
      }
    } else {
      if (!data.consumableId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione o insumo.",
          path: ["consumableId"],
        });
      }
    }
  });

export type EntradaCompraInput = z.infer<typeof entradaCompraSchema>;
