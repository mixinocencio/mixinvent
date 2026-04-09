"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncDevicesWithManageEngine, type SyncDevicesWithManageEngineResult } from "./actions";
import { Button } from "@/components/ui/button";

export function ManageEngineSyncButton() {
  const [pending, startTransition] = useTransition();
  const [last, setLast] = useState<SyncDevicesWithManageEngineResult | null>(null);

  return (
    <div className="space-y-4">
      <Button
        type="button"
        size="lg"
        disabled={pending}
        className="gap-2"
        onClick={() => {
          setLast(null);
          startTransition(async () => {
            const r = await syncDevicesWithManageEngine();
            setLast(r);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            toast.success("Sincronização concluída.");
          });
        }}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Sincronizando…
          </>
        ) : (
          <>
            <RefreshCw className="size-4" aria-hidden />
            Sincronizar com ManageEngine
          </>
        )}
      </Button>

      {last?.ok === true && (
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Resumo</p>
          <p className="mt-1 text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{last.updated}</span> máquina(s)
            atualizada(s),{" "}
            <span className="font-semibold tabular-nums text-foreground">{last.created}</span> nova(s)
            máquina(s) detectada(s).
            {last.skipped > 0 ? (
              <>
                {" "}
                <span className="tabular-nums text-amber-800 dark:text-amber-200">
                  {last.skipped} ignorada(s) ou com erro.
                </span>
              </>
            ) : null}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            Páginas lidas na API: {last.pagesFetched}
          </p>
          {last.warnings.length > 0 && (
            <ul className="mt-2 max-h-40 list-inside list-disc space-y-1 overflow-y-auto text-amber-900 text-xs dark:text-amber-100">
              {last.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {last?.ok === false && (
        <p className="text-destructive text-sm" role="alert">
          {last.error}
        </p>
      )}
    </div>
  );
}
