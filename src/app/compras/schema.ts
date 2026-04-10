import { z } from "zod";

const uuidMsg = "Selecione uma opção válida.";

export const linhaAtivoEntradaSchema = z.object({
  tagPatrimonio: z.string().min(1, "Informe a tag de patrimônio."),
  nome: z.string().optional(),
  categoryId: z.string().uuid(uuidMsg),
  brandId: z.string().uuid(uuidMsg),
  modelId: z.string().uuid(uuidMsg),
  numeroSerie: z.string().optional(),
});

export const linhaInsumoEntradaSchema = z.object({
  consumableId: z.string().uuid(uuidMsg),
  quantidade: z.coerce.number().int().positive("Quantidade deve ser um inteiro maior que zero."),
});

export const registrarEntradaComNFSchema = z
  .object({
    numero: z.string().min(1, "Informe o número da NF."),
    supplierId: z.string().uuid("Selecione um fornecedor."),
    dataEmissao: z.string().min(1, "Informe a data."),
    valorTotal: z.number().optional(),
    companyId: z.string().uuid("Selecione a empresa."),
    stockTypeId: z.string().uuid("Selecione o tipo de estoque."),
    ativos: z.array(linhaAtivoEntradaSchema).default([]),
    insumos: z.array(linhaInsumoEntradaSchema).default([]),
  })
  .refine(
    (d) => d.valorTotal != null && Number.isFinite(d.valorTotal) && d.valorTotal > 0,
    { path: ["valorTotal"], message: "Informe o valor total da nota (maior que zero)." },
  )
  .refine((d) => d.ativos.length > 0 || d.insumos.length > 0, {
    path: ["ativos"],
    message: "Inclua ao menos um equipamento ou uma linha de insumo na nota.",
  });

export type RegistrarEntradaComNFInput = z.infer<typeof registrarEntradaComNFSchema>;
