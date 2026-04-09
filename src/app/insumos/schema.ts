import { z } from "zod";

export const consumableInputSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  categoryId: z.string().min(1, "Selecione uma categoria.").uuid("Selecione uma categoria válida."),
  quantidadeEstoque: z.coerce.number().int("Use um número inteiro.").min(0, "Estoque não pode ser negativo."),
  estoqueMinimo: z.coerce.number().int("Use um número inteiro.").min(0, "Mínimo não pode ser negativo."),
});

export type ConsumableInput = z.infer<typeof consumableInputSchema>;
