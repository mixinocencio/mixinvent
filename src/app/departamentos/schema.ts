import { z } from "zod";
import { fdStr } from "@/lib/form-data";

const emptyToNull = (s: string) => {
  const t = s.trim();
  return t === "" ? null : t;
};

export const departamentoCreateSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do departamento."),
  localizacao: z.string().transform(emptyToNull),
  centroCusto: z.string().transform(emptyToNull),
});

export type DepartamentoCreateFields = z.infer<typeof departamentoCreateSchema>;
export type DepartamentoFormInput = z.input<typeof departamentoCreateSchema>;

export function parseDepartamentoFormData(fd: FormData) {
  return departamentoCreateSchema.safeParse({
    nome: fdStr(fd, "nome"),
    localizacao: fdStr(fd, "localizacao"),
    centroCusto: fdStr(fd, "centroCusto"),
  });
}

export const departamentoUpdatePayloadSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do departamento."),
  localizacao: z.string().transform(emptyToNull),
  centroCusto: z.string().transform(emptyToNull),
});

export type DepartamentoUpdatePayload = z.infer<typeof departamentoUpdatePayloadSchema>;
export type DepartamentoUpdateFormInput = z.input<typeof departamentoUpdatePayloadSchema>;
