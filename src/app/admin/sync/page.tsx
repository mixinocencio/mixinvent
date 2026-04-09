import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ManageEngineSyncButton } from "./sync-manage-engine-button";

export default function AdminSyncPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1 px-0")}
        >
          <ArrowLeft className="size-4" />
          Voltar ao painel
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Sincronização</h1>
          <p className="text-muted-foreground">
            Importação e atualização de equipamentos a partir do ManageEngine Endpoint Central.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl rounded-xl border-border/80">
        <CardHeader>
          <CardTitle>ManageEngine Endpoint Central</CardTitle>
          <CardDescription>
            O match é feito pelo <strong>Service Tag</strong> (serial) com o campo{" "}
            <strong>Número de série</strong> do patrimônio. Em atualizações, são preenchidos hostname, modelo
            (marca/modelo do inventário) e sistema operacional; é registrado um log com a observação de sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ManageEngineSyncButton />
          <div className="border-border border-t pt-4 text-muted-foreground text-xs leading-relaxed">
            <p className="font-medium text-foreground">Variáveis de ambiente</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <code className="rounded bg-muted px-1">MANAGEENGINE_API_KEY</code> — token de API
              </li>
              <li>
                <code className="rounded bg-muted px-1">MANAGEENGINE_SERVER_URL</code> — URL base (ex.:{" "}
                https://servidor:8020)
              </li>
              <li>
                Opcional:{" "}
                <code className="rounded bg-muted px-1">MANAGEENGINE_INVENTORY_COMPUTERS_PATH</code> — exemplo{" "}
                <code className="rounded bg-muted px-1">/api/1.4/inventory/hardware</code>. Ajuste conforme a doc do
                seu Endpoint Central; também pode definir em <code className="rounded bg-muted px-1">/admin/integracoes</code>.
              </li>
              <li>
                Opcional: <code className="rounded bg-muted px-1">MANAGEENGINE_AUTH_HEADER_NAME</code> — cabeçalho
                de autenticação (padrão <code className="rounded bg-muted px-1">Authorization</code>).
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
