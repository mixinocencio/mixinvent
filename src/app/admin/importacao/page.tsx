import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CsvImportClient } from "./csv-import-client";

export default function AdminImportacaoPage() {
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Importação em massa</h1>
          <p className="text-muted-foreground">
            Envie um CSV para criar ou atualizar equipamentos pelo Service Tag (número de série),
            enquanto a integração por API não estiver disponível.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 lg:col-span-2">
          <CardHeader>
            <CardTitle>Arquivo CSV</CardTitle>
            <CardDescription>
              Cabeçalhos esperados (inglês ou português, case-insensitive):{" "}
              <strong>Service Tag</strong>, <strong>Empresa</strong>,{" "}
              <strong>Computer Manufacturer</strong>, <strong>Computer Type</strong>,{" "}
              <strong>Device Model</strong>, <strong>Computer Name</strong>,{" "}
              <strong>Operating System</strong>. Opcionais em <code className="rounded bg-muted px-1">observacoes</code>{" "}
              (JSON): memória, IP, departamento, usuário, data de garantia. Com{" "}
              <strong>Responsável</strong> ou <strong>Last Logon User</strong>, o status fica{" "}
              <strong>Em uso</strong>; caso contrário, <strong>Disponível</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CsvImportClient />
          </CardContent>
        </Card>

        <Card className="h-fit border-border/80">
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Linhas sem Service Tag são ignoradas. Empresa, marca, categoria (patrimônio) e modelo
              são criados automaticamente se não existirem. O match do ativo é pelo número de série.
              Tipo de estoque: primeiro cadastrado ou &quot;Estoque Geral&quot;.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
