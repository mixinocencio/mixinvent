/** Apenas dígitos, 14 caracteres. */
export function normalizeCnpjDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Valida dígitos verificadores do CNPJ (14 dígitos, já normalizado).
 */
export function isValidCnpjChecksum(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calc = (base: string, length: number): number => {
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += Number(base.charAt(length - i)) * pos;
      pos -= 1;
      if (pos < 2) pos = 9;
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const base12 = digits.slice(0, 12);
  const d1 = calc(base12, 12);
  if (d1 !== Number(digits[12])) return false;

  const base13 = digits.slice(0, 13);
  const d2 = calc(base13, 13);
  return d2 === Number(digits[13]);
}
