"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import {
  saveEntraIdSettings,
  testEntraIdConnection,
} from "@/lib/settings/actions";
import { syncEntraIdUsers } from "@/app/admin/sync/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EntraIntegrationForm({
  initial,
}: {
  initial: {
    tenantId: string;
    clientId: string;
    clientSecretConfigured: boolean;
    clientSecretMaskedPreview: string;
  };
}) {
  const router = useRouter();
  const [pendingSave, startSave] = useTransition();
  const [pendingTest, startTest] = useTransition();
  const [pendingSync, startSync] = useTransition();

  const [tenantId, setTenantId] = useState(initial.tenantId);
  const [clientId, setClientId] = useState(initial.clientId);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    setTenantId(initial.tenantId);
    setClientId(initial.clientId);
    setClientSecret("");
  }, [initial.tenantId, initial.clientId, initial.clientSecretConfigured]);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        startSave(async () => {
          const r = await saveEntraIdSettings({ tenantId, clientId, clientSecret });
          if (!r.ok) toast.error(r.error);
          else {
            toast.success("Configurações Microsoft Entra ID salvas.");
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="entraTenantId">Tenant ID (Directory ID)</Label>
          <Input
            id="entraTenantId"
            name="entraTenantId"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="entraClientId">Client ID (Application ID)</Label>
          <Input
            id="entraClientId"
            name="entraClientId"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="entraClientSecret">Client Secret</Label>
          <Input
            id="entraClientSecret"
            name="entraClientSecret"
            type="password"
            placeholder={
              initial.clientSecretConfigured
                ? "Deixe em branco para manter o secret atual"
                : "Secret do app (client credentials)"
            }
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            autoComplete="off"
          />
          {initial.clientSecretConfigured ? (
            <p className="text-muted-foreground text-xs">
              Secret configurado:{" "}
              <span className="font-mono">{initial.clientSecretMaskedPreview}</span> (valor completo só no banco ou
              .env)
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pendingSave} className="gap-2">
          {pendingSave ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Salvar
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          disabled={pendingTest}
          onClick={() => {
            startTest(async () => {
              const r = await testEntraIdConnection();
              if (r.ok) toast.success(r.message);
              else toast.error(r.error);
            });
          }}
        >
          {pendingTest ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
          Testar conexão
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pendingSync}
          onClick={() => {
            startSync(async () => {
              const r = await syncEntraIdUsers();
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              toast.success(
                `Sincronizado: ${r.processados} processados, ${r.novos} novos, ${r.desativados} contas desabilitadas no Entra.`,
              );
              router.refresh();
            });
          }}
        >
          {pendingSync ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Sincronizar usuários
        </Button>
      </div>
    </form>
  );
}
