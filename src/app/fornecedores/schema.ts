import { z } from "zod";
import { fdStr } from "@/lib/form-data";
import { isValidCnpjChecksum, normalizeCnpjDigits } from "@/lib/cnpj-valid";

const emptyToNull = (s: string) => {
  const t = s.trim();
  return t === "" ? null : t;
};

export const supplierFieldsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do fornecedor."),
  cnpj: z
    .string()
    .transform((s) => normalizeCnpjDigits(s))
    .refine((d) => d.length === 14, { message: "CNPJ deve ter 14 dígitos." })
    .refine((d) => isValidCnpjChecksum(d), { message: "CNPJ inválido." }),
  contactEmail: z
    .string()
    .transform(emptyToNull)
    .refine((s) => s === null || z.string().email().safeParse(s).success, {
      message: "E-mail inválido.",
    }),
  phone: z.string().transform(emptyToNull),
  address: z.string().transform(emptyToNull),
});

export type SupplierFields = z.infer<typeof supplierFieldsSchema>;
export type SupplierFormInput = z.input<typeof supplierFieldsSchema>;

export function parseSupplierFormData(fd: FormData) {
  return supplierFieldsSchema.safeParse({
    name: fdStr(fd, "name"),
    cnpj: fdStr(fd, "cnpj"),
    contactEmail: fdStr(fd, "contactEmail"),
    phone: fdStr(fd, "phone"),
    address: fdStr(fd, "address"),
  });
}

export const supplierUpdatePayloadSchema = supplierFieldsSchema;
export type SupplierUpdatePayload = z.infer<typeof supplierUpdatePayloadSchema>;
export type SupplierUpdateFormInput = z.input<typeof supplierUpdatePayloadSchema>;
