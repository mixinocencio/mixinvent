import { z } from "zod";
import { AssetStatus } from "@prisma/client";

const statuses = [AssetStatus.DISPONIVEL, AssetStatus.EM_USO, AssetStatus.MANUTENCAO, AssetStatus.SUCATA] as const;

export const assetFormSchema = z.object({
  tagPatrimonio: z.string().min(1, "Informe a tag de patrimônio."),
  hostname: z.string().optional(),
  numeroSerie: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  sistemaOperacional: z.string().optional(),
  statusAntivirus: z.string().optional(),
  dataCompra: z.string().optional(),
  valor: z.string().optional(),
  status: z.enum(statuses),
  categoryId: z.string().min(1, "Selecione a categoria."),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;
