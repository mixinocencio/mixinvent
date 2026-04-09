"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { importarEquipamentosCSV } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";

function previewColumns(rows: Record<string, unknown>[], maxCols = 6): string[] {
  const keys = new Set<string>();
  for (const r of rows.slice(0, 3)) {
    for (const k of Object.keys(r)) {
      keys.add(k);
      if (keys.size >= maxCols) return [...keys];
    }
  }
  return [...keys];
}

function cellPreview(v: unknown): string {
  if (v == null) return "—";
  const s = String(v).trim();
  if (!s) return "—";
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}

export function CsvImportClient() {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const previewKeys = useMemo(() => previewColumns(rows), [rows]);

  const onFile = useCallback((file: File | null) => {
    setParseError(null);
    setRows([]);
    setFileName(null);
    if (!file) return;

    setFileName(file.name);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors?.length) {
          const msg = result.errors.map((e) => e.message).join("; ");
          setParseError(msg || "Erro ao ler o CSV.");
          return;
        }
        const data = (result.data ?? []).filter(
          (row): row is Record<string, unknown> =>
            row != null && typeof row === "object" && !Array.isArray(row),
        );
        setRows(data);
      },
      error: (err) => {
        setParseError(err.message || "Falha ao abrir o arquivo.");
      },
    });
  }, []);

  const runImport = async () => {
    if (rows.length === 0) {
      toast.error("Selecione um CSV válido com ao menos uma linha de dados.");
      return;
    }
    setBusy(true);
    try {
      const r = await importarEquipamentosCSV(rows);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const parts = [`Foram processados ${r.processed} equipamentos`];
      if (r.skippedEmpty > 0) parts.push(`${r.skippedEmpty} linhas sem Service Tag ignoradas`);
      if (r.failed > 0) parts.push(`${r.failed} linhas com erro`);
      toast.success(parts.join(". ") + ".");
      router.push("/equipamentos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na importação.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative space-y-6">
      {busy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-6 shadow-lg">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Importando equipamentos…</p>
            <p className="max-w-xs text-center text-xs text-muted-foreground">
              Aguarde; arquivos grandes podem levar alguns segundos.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="csv-file">Arquivo CSV</Label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
            <Upload className="size-4" />
            Escolher arquivo
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={busy}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {fileName && (
            <span className="text-muted-foreground text-sm">
              {fileName} — {rows.length} linha(s)
            </span>
          )}
        </div>
        {parseError && <p className="text-destructive text-sm">{parseError}</p>}
      </div>

      {rows.length > 0 && previewKeys.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Prévia (primeiras 3 linhas, até {previewKeys.length} colunas)
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                {previewKeys.map((k) => (
                  <TableHead key={k}>{k}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 3).map((row, i) => (
                <TableRow key={i}>
                  {previewKeys.map((k) => (
                    <TableCell key={k} className="max-w-[12rem] truncate">
                      {cellPreview(row[k])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Button type="button" disabled={busy || rows.length === 0} onClick={() => void runImport()}>
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processando…
          </>
        ) : (
          "Processar importação"
        )}
      </Button>
    </div>
  );
}
