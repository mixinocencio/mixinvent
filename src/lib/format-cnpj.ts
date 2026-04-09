/** Formata 14 dígitos para exibição; retorna "—" se inválido. */
export function formatCnpjDigits(digits: string | null | undefined): string {
  if (!digits || digits.length !== 14) return "—";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
