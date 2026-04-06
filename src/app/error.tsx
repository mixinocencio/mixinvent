"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-heading text-xl font-semibold">Algo deu errado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Se o problema for o banco de dados, confira se o PostgreSQL está rodando e se{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL</code> no arquivo{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> está correto (URL
        direta <code className="text-xs">postgresql://…</code> ou serviço acessível na rede).
      </p>
      <Button type="button" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
