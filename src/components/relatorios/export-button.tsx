"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AUDITORIA_GERAL_COLUMNS,
  type AuditoriaGeralRow,
} from "@/lib/relatorios/auditoria-geral";

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowsToCsv(rows: AuditoriaGeralRow[]): string {
  const header = AUDITORIA_GERAL_COLUMNS.map(escapeCsvCell).join(",");
  const lines = rows.map((row) =>
    AUDITORIA_GERAL_COLUMNS.map((col) => escapeCsvCell(row[col] ?? "")).join(","),
  );
  return [header, ...lines].join("\r\n");
}

type ExportButtonProps = {
  data: AuditoriaGeralRow[];
  variant?: "default" | "outline";
};

export function ExportButton({ data, variant = "outline" }: ExportButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      className="gap-2"
      disabled={data.length === 0}
      onClick={() => {
        const csv = rowsToCsv(data);
        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "auditoria_geral_mixinvent.csv";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}
    >
      <Download className="size-4" />
      Exportar CSV
    </Button>
  );
}
