import { Database } from "lucide-react";

export function DbOfflineNotice({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
      </div>
      <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
        <Database className="size-5 shrink-0 text-amber-700 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="font-medium">Banco de dados indisponível</p>
          <p className="text-amber-900/90 dark:text-amber-100/90">
            Suba o Postgres com <code className="rounded bg-background/60 px-1">npm run db:up</code> e
            use <code className="rounded bg-background/60 px-1">DATABASE_URL</code> apontando para{" "}
            <code className="rounded bg-background/60 px-1">localhost:5432</code> no{" "}
            <code className="rounded bg-background/60 px-1">.env</code>. Recarregue a página.
          </p>
          <p className="pt-2 text-amber-900/90 dark:text-amber-100/90">
            Se o container já está no ar e ainda falha, crie as tabelas:{" "}
            <code className="rounded bg-background/60 px-1">npx prisma migrate dev</code>. Opcional:{" "}
            <code className="rounded bg-background/60 px-1">npm run db:seed</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
