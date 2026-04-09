import { z } from "zod";
import { fdStr } from "@/lib/form-data";

const emptyToNull = (s: string) => {
  const t = s.trim();
  return t === "" ? null : t;
};

const optionalIntNonNegative = z
  .string()
  .transform((s) => {
    const t = s.trim();
    if (t === "") return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : NaN;
  })
  .refine((n) => n === null || (Number.isInteger(n) && n >= 0), {
    message: "Informe um número inteiro maior ou igual a zero.",
  });

export const modeloCreateSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do modelo."),
  brandId: z.string().trim().min(1, "Selecione a marca."),
  partNumber: z.string().transform(emptyToNull),
  mesesGarantia: optionalIntNonNegative,
  mesesDepreciacao: optionalIntNonNegative,
  isSerialized: z.enum(["true", "false"]),
});

export type ModeloCreateFields = z.infer<typeof modeloCreateSchema>;
export type ModeloFormInput = z.input<typeof modeloCreateSchema>;

export function parseModeloFormData(fd: FormData) {
  const rawSer = fdStr(fd, "isSerialized");
  return modeloCreateSchema.safeParse({
    nome: fdStr(fd, "nome"),
    brandId: fdStr(fd, "brandId"),
    partNumber: fdStr(fd, "partNumber"),
    mesesGarantia: fdStr(fd, "mesesGarantia"),
    mesesDepreciacao: fdStr(fd, "mesesDepreciacao"),
    isSerialized: rawSer === "true" ? "true" : "false",
  });
}

export const modeloUpdatePayloadSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do modelo."),
  brandId: z.string().trim().min(1, "Selecione a marca."),
  partNumber: z.string().transform(emptyToNull),
  mesesGarantia: optionalIntNonNegative,
  mesesDepreciacao: optionalIntNonNegative,
  isSerialized: z.enum(["true", "false"]),
});

export type ModeloUpdatePayload = z.infer<typeof modeloUpdatePayloadSchema>;
export type ModeloUpdateFormInput = z.input<typeof modeloUpdatePayloadSchema>;
