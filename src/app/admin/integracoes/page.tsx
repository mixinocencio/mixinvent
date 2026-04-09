import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getEntraIdSettingsForUi, getManageEngineSettingsForUi } from "@/lib/settings/service";
import { EntraIntegrationForm } from "./entra-integration-form";
import { ManageEngineIntegrationForm } from "./manage-engine-form";

export default async function AdminIntegracoesPage() {
  const me = await getManageEngineSettingsForUi();
  const entra = await getEntraIdSettingsForUi();

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
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Configure conectores externos. Valores sensíveis são armazenados integralmente no banco, mas não são
            exibidos na interface.
          </p>
        </div>
      </div>

      <Tabs defaultValue="manageengine" className="w-full max-w-3xl">
        <TabsList>
          <TabsTrigger value="manageengine">ManageEngine</TabsTrigger>
          <TabsTrigger value="entra">Microsoft Entra ID</TabsTrigger>
        </TabsList>

        <TabsContent value="manageengine">
          <Card className="rounded-xl border-border/80">
            <CardHeader>
              <CardTitle>ManageEngine Endpoint Central</CardTitle>
              <CardDescription>
                As chaves são salvas na tabela <code className="rounded bg-muted px-1">system_settings</code>. Se um
                campo estiver vazio no banco, o sistema usa as variáveis{" "}
                <code className="rounded bg-muted px-1">MANAGEENGINE_*</code> do ambiente como fallback. Servidor
                on-premise em HTTP (porta 8020 etc.): use <code className="rounded bg-muted px-1">http://</code> na
                URL — <code className="rounded bg-muted px-1">https://</code> contra HTTP puro causa erro OpenSSL
                &quot;packet length too long&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManageEngineIntegrationForm initial={me} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entra">
          <Card className="rounded-xl border-border/80">
            <CardHeader>
              <CardTitle>Microsoft Entra ID (Graph API)</CardTitle>
              <CardDescription>
                Fluxo <strong>client credentials</strong>: registre um app em Entra com permissões de aplicativo em{" "}
                <code className="rounded bg-muted px-1">User.Read.All</code> (ou{" "}
                <code className="rounded bg-muted px-1">Directory.Read.All</code>) e consentimento de administrador.
                Credenciais podem ser salvas no banco (como ManageEngine) ou via{" "}
                <code className="rounded bg-muted px-1">ENTRA_*</code> no <code className="rounded bg-muted px-1">.env</code>.
                A sincronização faz upsert por <strong>e-mail</strong> (campo <code className="rounded bg-muted px-1">mail</code> no Graph); usuários sem e-mail são ignorados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntraIntegrationForm initial={entra} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
