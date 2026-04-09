import { z } from "zod";
import { BRAZIL_UF_SIGLAS } from "@/lib/brazil-ufs";
import { fdStr } from "@/lib/form-data";

const emptyToNull = (s: string) => {
  const t = s.trim();
  return t === "" ? null : t;
};

const ufSet = new Set<string>(BRAZIL_UF_SIGLAS);

export const empresaFieldsSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da empresa."),
  cnpj: z
    .string()
    .transform((s) => {
      const d = s.replace(/\D/g, "");
      return d === "" ? null : d;
    })
    .refine((d) => d === null || d.length === 14, { message: "CNPJ deve ter 14 dígitos." }),
  emailContato: z
    .string()
    .transform(emptyToNull)
    .refine((s) => s === null || z.string().email().safeParse(s).success, {
      message: "E-mail inválido.",
    }),
  telefone: z.string().transform(emptyToNull),
  cep: z
    .string()
    .transform((s) => {
      const d = s.replace(/\D/g, "");
      return d === "" ? null : d;
    })
    .refine((d) => d === null || d.length === 8, { message: "CEP deve ter 8 dígitos." }),
  rua: z.string().transform(emptyToNull),
  numero: z.string().transform(emptyToNull),
  complemento: z.string().transform(emptyToNull),
  bairro: z.string().transform(emptyToNull),
  cidade: z.string().transform(emptyToNull),
  estado: z
    .string()
    .optional()
    .default("")
    .transform((s) => {
      const t = (s ?? "").trim().toUpperCase();
      if (t === "" || t === "NONE") return null;
      return t;
    })
    .refine((s) => s === null || ufSet.has(s), { message: "Selecione uma UF válida." }),
});

export type EmpresaFields = z.infer<typeof empresaFieldsSchema>;
/** Valores no formulário (antes dos refinamentos finais do submit). */
export type EmpresaFormInput = z.input<typeof empresaFieldsSchema>;

export function parseEmpresaFormData(fd: FormData) {
  return empresaFieldsSchema.safeParse({
    nome: fdStr(fd, "nome"),
    cnpj: fdStr(fd, "cnpj"),
    emailContato: fdStr(fd, "emailContato"),
    telefone: fdStr(fd, "telefone"),
    cep: fdStr(fd, "cep"),
    rua: fdStr(fd, "rua"),
    numero: fdStr(fd, "numero"),
    complemento: fdStr(fd, "complemento"),
    bairro: fdStr(fd, "bairro"),
    cidade: fdStr(fd, "cidade"),
    estado: fdStr(fd, "estado"),
  });
}

export const empresaUpdatePayloadSchema = empresaFieldsSchema;
export type EmpresaUpdatePayload = z.infer<typeof empresaUpdatePayloadSchema>;
export type EmpresaUpdateFormInput = z.input<typeof empresaUpdatePayloadSchema>;
