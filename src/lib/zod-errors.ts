import type { z } from "zod";

export function firstZodIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}
