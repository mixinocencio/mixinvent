/** Colunas alinhadas ao layout Excel corporativo + exportação CSV. */
export const AUDITORIA_GERAL_COLUMNS = [
  "SamAccountName",
  "Nome (User)",
  "Cargo",
  "Empresa",
  "Departamento",
  "Equipamento (Hostname)",
  "Service Tag",
  "Tipo (Categoria)",
  "Marca",
  "Modelo",
  "Antivirus",
  "Licenças O365",
  "Status",
] as const;

export type AuditoriaGeralRow = {
  [K in (typeof AUDITORIA_GERAL_COLUMNS)[number]]: string;
};

export function emptyAuditoriaRow(): AuditoriaGeralRow {
  return Object.fromEntries(AUDITORIA_GERAL_COLUMNS.map((k) => [k, ""])) as AuditoriaGeralRow;
}
