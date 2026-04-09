import { z } from "zod";
import { fdStr } from "@/lib/form-data";

const emptyToNull = (s: string) => {
  const t = s.trim();
  return t === "" ? null : t;
};

function isValidOptionalUrl(s: string | null): boolean {
  if (s === null) return true;
  const u = s.startsWith("http://") || s.startsWith("https://") ? s : `https://${s}`;
  try {
    const parsed = new URL(u);
    return Boolean(parsed.hostname?.includes("."));
  } catch {
    return false;
  }
}

export const marcaFieldsSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da marca."),
  site: z
    .string()
    .transform(emptyToNull)
    .refine((s) => isValidOptionalUrl(s), { message: "URL inválida." }),
  telefoneSuporte: z.string().transform(emptyToNull),
  emailSuporte: z
    .string()
    .transform(emptyToNull)
    .refine((s) => s === null || z.string().email().safeParse(s).success, {
      message: "E-mail inválido.",
    }),
});

export type MarcaFields = z.infer<typeof marcaFieldsSchema>;
export type MarcaFormInput = z.input<typeof marcaFieldsSchema>;

export function parseMarcaFormData(fd: FormData) {
  return marcaFieldsSchema.safeParse({
    nome: fdStr(fd, "nome"),
    site: fdStr(fd, "site"),
    telefoneSuporte: fdStr(fd, "telefoneSuporte"),
    emailSuporte: fdStr(fd, "emailSuporte"),
  });
}

export const marcaUpdatePayloadSchema = marcaFieldsSchema;
export type MarcaUpdatePayload = z.infer<typeof marcaUpdatePayloadSchema>;
export type MarcaUpdateFormInput = z.input<typeof marcaUpdatePayloadSchema>;
