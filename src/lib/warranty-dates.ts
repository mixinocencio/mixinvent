/** Adiciona meses de calendário à data (ex.: garantia a partir da data de compra). */
export function addCalendarMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return d;
}

export function startOfDayLocal(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

export function warrantyEndDate(dataCompra: Date, mesesGarantia: number): Date {
  return addCalendarMonths(dataCompra, mesesGarantia);
}
