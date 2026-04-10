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
    fornecedor: z.string().min(1, "Informe o fornecedor."),
    dataEmissao: z.string().min(1, "Informe a data de emissão."),
    /** No formulário pode vir vazio até o envio; validação no `.refine` abaixo. */
    valorTotal: z.number().optional(),
    companyId: z.string().uuid("Selecione a empresa."),
    stockTypeId: z.string().uuid("Selecione o tipo de estoque."),
    ativos: z
      .array(linhaAtivoEntradaSchema)
      .min(1, "Inclua ao menos um equipamento vinculado à nota fiscal."),
    insumos: z.array(linhaInsumoEntradaSchema).default([]),
  })
  .refine(
    (d) => d.valorTotal != null && Number.isFinite(d.valorTotal) && d.valorTotal > 0,
    { path: ["valorTotal"], message: "Informe o valor total da nota (maior que zero)." },
  );

export type RegistrarEntradaComNFInput = z.infer<typeof registrarEntradaComNFSchema>;
