import { startOfDayLocal, warrantyEndDate } from "@/lib/warranty-dates";

/** Meses completos decorridos desde a data de compra (piso), para depreciação linear. */
export function elapsedWholeMonthsSince(dataCompra: Date, ref: Date): number {
  const dc = startOfDayLocal(new Date(dataCompra.getTime()));
  const end = startOfDayLocal(new Date(ref.getTime()));
  if (end < dc) return 0;
  let months =
    (end.getFullYear() - dc.getFullYear()) * 12 + (end.getMonth() - dc.getMonth());
  if (end.getDate() < dc.getDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * Depreciação linear acumulada: (valor / mesesVida) * min(mesesDecorridos, mesesVida).
 * Retorna 0 se faltar valor, data ou vida útil.
 */
export function linearDepreciatedAmount(
  valor: number,
  dataCompra: Date | null,
  mesesDepreciacao: number | null,
  ref: Date = new Date(),
): number {
  if (valor <= 0 || !dataCompra || mesesDepreciacao == null || mesesDepreciacao <= 0) return 0;
  const elapsed = elapsedWholeMonthsSince(dataCompra, ref);
  const applied = Math.min(mesesDepreciacao, elapsed);
  return (valor * applied) / mesesDepreciacao;
}

export type WarrantyEval = {
  fimGarantia: Date;
  fimStart: Date;
  diasRestantes: number;
  /** Fim da garantia é hoje (último dia). */
  venceHoje: boolean;
  /** Fim da garantia já passou (antes de hoje). */
  jaVencida: boolean;
};

export function evalWarranty(
  dataCompra: Date,
  mesesGarantia: number,
  todayStart: Date,
): WarrantyEval | null {
  if (mesesGarantia <= 0) return null;
  const fimGarantia = warrantyEndDate(new Date(dataCompra), mesesGarantia);
  const fimStart = startOfDayLocal(fimGarantia);
  const diasRestantes = Math.ceil(
    (fimStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  return {
    fimGarantia,
    fimStart,
    diasRestantes,
    venceHoje: fimStart.getTime() === todayStart.getTime(),
    jaVencida: fimStart.getTime() < todayStart.getTime(),
  };
}

/** Garantia expira dentro da janela [hoje, hoje+days] (inclusive), apenas futuras ou hoje. */
export function warrantyExpiresWithinWindow(
  evalResult: WarrantyEval,
  todayStart: Date,
  windowEnd: Date,
): boolean {
  return evalResult.fimStart >= todayStart && evalResult.fimStart <= windowEnd;
}
