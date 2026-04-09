import { UserStatus } from "@prisma/client";
import { z } from "zod";

const optionalFkId = z
  .string()
  .optional()
  .default("")
  .transform((s) => {
    const t = (s ?? "").trim();
    if (!t || t === "none") return "";
    return t;
  })
  .refine((v) => v === "" || z.string().uuid().safeParse(v).success, {
    message: "Seleção inválida.",
  });

export const colaboradorInputSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("E-mail inválido."),
  samAccountName: z.string().optional().default(""),
  userPrincipalName: z.string().optional().default(""),
  cargo: z.string().optional().default(""),
  telefone: z.string().optional().default(""),
  cidade: z.string().optional().default(""),
  estado: z.string().optional().default(""),
  licencasO365: z.string().optional().default(""),
  companyId: optionalFkId,
  departamentoId: optionalFkId,
  status: z.nativeEnum(UserStatus),
});

export type ColaboradorInput = z.infer<typeof colaboradorInputSchema>;

export function colaboradorToPrismaData(data: ColaboradorInput) {
  const emptyToNull = (s: string) => {
    const t = s.trim();
    return t === "" ? null : t;
  };
  return {
    nome: data.nome,
    email: data.email,
    samAccountName: emptyToNull(data.samAccountName),
    userPrincipalName: emptyToNull(data.userPrincipalName),
    cargo: emptyToNull(data.cargo),
    telefone: emptyToNull(data.telefone),
    cidade: emptyToNull(data.cidade),
    estado: emptyToNull(data.estado),
    licencasO365: emptyToNull(data.licencasO365),
    companyId: data.companyId === "" ? null : data.companyId,
    departamentoId: data.departamentoId === "" ? null : data.departamentoId,
    status: data.status,
    isActive: data.status === UserStatus.ATIVO,
  };
}
