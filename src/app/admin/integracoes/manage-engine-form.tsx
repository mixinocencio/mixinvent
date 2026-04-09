"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PlugZap, Save } from "lucide-react";
import { toast } from "sonner";
import { saveManageEngineSettings, testManageEngineConnection } from "@/lib/settings/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ManageEngineIntegrationForm({
  initial,
}: {
  initial: {
    serverUrl: string;
    inventoryPath: string;
    authHeaderName: string;
    pageLimit: string;
    maxPages: string;
    apiKeyConfigured: boolean;
    apiKeyMaskedPreview: string;
  };
}) {
  const router = useRouter();
  const [pendingSave, startSave] = useTransition();
  const [pendingTest, startTest] = useTransition();

  const [serverUrl, setServerUrl] = useState(initial.serverUrl);
  const [inventoryPath, setInventoryPath] = useState(initial.inventoryPath);
  const [authHeaderName, setAuthHeaderName] = useState(initial.authHeaderName);
  const [pageLimit, setPageLimit] = useState(initial.pageLimit);
  const [maxPages, setMaxPages] = useState(initial.maxPages);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    setServerUrl(initial.serverUrl);
    setInventoryPath(initial.inventoryPath);
    setAuthHeaderName(initial.authHeaderName);
    setPageLimit(initial.pageLimit);
    setMaxPages(initial.maxPages);
    setApiKey("");
  }, [
    initial.serverUrl,
    initial.inventoryPath,
    initial.authHeaderName,
    initial.pageLimit,
    initial.maxPages,
    initial.apiKeyConfigured,
  ]);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        startSave(async () => {
          const r = await saveManageEngineSettings({
            serverUrl,
            apiKey,
            inventoryPath,
            authHeaderName,
            pageLimit,
            maxPages,
          });
          if (!r.ok) toast.error(r.error);
          else {
            toast.success("Configurações ManageEngine salvas.");
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="serverUrl">URL do servidor</Label>
          <Input
            id="serverUrl"
            name="serverUrl"
            type="url"
            placeholder="https://servidor:8020"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="apiKey">API Key / token</Label>
          <Input
            id="apiKey"
            name="apiKey"
            type="password"
            placeholder={
              initial.apiKeyConfigured
                ? "Deixe em branco para manter a chave atual"
                : "Cole o token de autenticação"
            }
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
          {initial.apiKeyConfigured ? (
            <p className="text-muted-foreground text-xs">
              Chave configurada: <span className="font-mono">{initial.apiKeyMaskedPreview}</span> (valor completo
              permanece apenas no banco ou no .env)
            </p>
          ) : null}
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="inventoryPath">Path da API (v1 / 1.4)</Label>
          <Input
            id="inventoryPath"
            name="inventoryPath"
            placeholder="/api/1.4/inventory/hardware"
            value={inventoryPath}
            onChange={(e) => setInventoryPath(e.target.value)}
            autoComplete="off"
          />
          <p className="text-muted-foreground text-xs">
            Documentação ManageEngine costuma usar{" "}
            <code className="rounded bg-muted px-1">/api/1.4/inventory/hardware</code> (inventário de hardware).
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="authHeaderName">Cabeçalho de autenticação</Label>
          <Input
            id="authHeaderName"
            name="authHeaderName"
            placeholder="Authorization"
            value={authHeaderName}
            onChange={(e) => setAuthHeaderName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pageLimit">Itens por página</Label>
          <Input
            id="pageLimit"
            name="pageLimit"
            inputMode="numeric"
            placeholder="100"
            value={pageLimit}
            onChange={(e) => setPageLimit(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="maxPages">Máximo de páginas (sync)</Label>
          <Input
            id="maxPages"
            name="maxPages"
            inputMode="numeric"
            placeholder="50"
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
          />
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
              const r = await testManageEngineConnection();
              if (r.ok) toast.success(r.message);
              else toast.error(r.error);
            });
          }}
        >
          {pendingTest ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
          Testar conexão
        </Button>
        <Link
          href="/admin/sync"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center justify-center")}
        >
          Ir para sincronização
        </Link>
      </div>
    </form>
  );
}
