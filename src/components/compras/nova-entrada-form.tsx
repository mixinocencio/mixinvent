"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { processarEntradaCompra } from "@/app/compras/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCnpjDigits } from "@/lib/format-cnpj";

export type ModeloCompraOption = { id: string; nome: string; brandNome: string; isSerialized: boolean };
export type InsumoCompraOption = { id: string; nome: string };
export type CategoriaPatOption = { id: string; nome: string };
export type EmpresaCompraOption = { id: string; nome: string };
export type TipoEstoqueOption = { id: string; nome: string };
export type FornecedorCompraOption = { id: string; name: string; cnpj: string };

const moneyFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parseMoney(s: string): number {
  const t = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function gerarPrefixoTagAutomatico(numeroNF: string): string {
  const nf = numeroNF.trim().replace(/\s+/g, "-").slice(0, 32) || "NF";
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `TAG-${nf}-${stamp}-${r}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function NovaEntradaCompraForm({
  fornecedores,
  modelos,
  insumos,
  categorias,
  empresas,
  tiposEstoque,
}: {
  fornecedores: FornecedorCompraOption[];
  modelos: ModeloCompraOption[];
  insumos: InsumoCompraOption[];
  categorias: CategoriaPatOption[];
  empresas: EmpresaCompraOption[];
  tiposEstoque: TipoEstoqueOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [numeroNF, setNumeroNF] = useState("");
  const [supplierId, setSupplierId] = useState(fornecedores[0]?.id ?? "");
  const [dataCompra, setDataCompra] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [produtoKey, setProdutoKey] = useState<string>("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitarioStr, setValorUnitarioStr] = useState("");

  const [prefixoTag, setPrefixoTag] = useState("");
  const [companyId, setCompanyId] = useState(empresas[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categorias[0]?.id ?? "");
  const [stockTypeId, setStockTypeId] = useState(tiposEstoque[0]?.id ?? "");
  const [numerosSerie, setNumerosSerie] = useState<string[]>([]);

  const tipoItem = useMemo(() => {
    if (produtoKey.startsWith("e:")) return "EQUIPAMENTO" as const;
    if (produtoKey.startsWith("c:")) return "INSUMO" as const;
    return null;
  }, [produtoKey]);

  const qtd = Math.max(1, Math.floor(quantidade) || 1);

  const modelIdEquip = useMemo(() => {
    if (!produtoKey.startsWith("e:")) return null;
    return produtoKey.slice(2);
  }, [produtoKey]);

  const selectedModelo = useMemo(
    () => (modelIdEquip ? modelos.find((m) => m.id === modelIdEquip) : undefined),
    [modelIdEquip, modelos],
  );

  const requiresSerial = tipoItem === "EQUIPAMENTO" && selectedModelo?.isSerialized === true;

  useEffect(() => {
    if (tipoItem !== "EQUIPAMENTO" || !requiresSerial) {
      setNumerosSerie([]);
      return;
    }
    setNumerosSerie((prev) => {
      const next = [...prev];
      while (next.length < qtd) next.push("");
      return next.slice(0, qtd);
    });
  }, [tipoItem, requiresSerial, qtd]);

  const valorUnitario = parseMoney(valorUnitarioStr);
  const valorTotalNum = Number.isFinite(valorUnitario) ? qtd * valorUnitario : NaN;
  const valorTotalFmt = Number.isFinite(valorTotalNum) ? moneyFmt.format(valorTotalNum) : "—";

  const supplierOk = UUID_RE.test(supplierId);

  const canSubmit =
    numeroNF.trim() &&
    supplierOk &&
    dataCompra &&
    produtoKey &&
    Number.isFinite(valorUnitario) &&
    valorUnitario >= 0;

  const missingCatalog =
    fornecedores.length === 0
      ? "Cadastre ao menos um fornecedor para vincular à nota fiscal."
      : modelos.length === 0 && insumos.length === 0
        ? "Cadastre modelos de equipamento ou insumos para registrar compras."
        : tipoItem === "EQUIPAMENTO" && modelos.length === 0
          ? "Não há modelos cadastrados para entrada de equipamentos."
          : tipoItem === "INSUMO" && insumos.length === 0
            ? "Não há insumos cadastrados."
            : tipoItem === "EQUIPAMENTO" &&
                (categorias.length === 0 || empresas.length === 0 || tiposEstoque.length === 0)
              ? "Cadastre ao menos uma categoria Patrimônio, empresa e tipo de estoque para gerar equipamentos."
              : null;

  function setSerieAt(i: number, v: string) {
    setNumerosSerie((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  return (
    <form
      className="mx-auto max-w-2xl space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!tipoItem) {
          toast.error("Selecione um produto.");
          return;
        }
        if (!supplierOk) {
          toast.error("Selecione um fornecedor.");
          return;
        }
        if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
          toast.error("Informe um valor unitário válido.");
          return;
        }

        const modelId = produtoKey.startsWith("e:") ? produtoKey.slice(2) : undefined;
        const consumableId = produtoKey.startsWith("c:") ? produtoKey.slice(2) : undefined;

        const payload = {
          numeroNF,
          supplierId,
          dataCompra,
          observacoes: observacoes.trim() || undefined,
          tipoItem,
          quantidade: qtd,
          valorUnitario,
          numerosSerie: tipoItem === "EQUIPAMENTO" ? numerosSerie : [],
          prefixoTag: tipoItem === "EQUIPAMENTO" ? prefixoTag : undefined,
          companyId: tipoItem === "EQUIPAMENTO" ? companyId : undefined,
          categoryId: tipoItem === "EQUIPAMENTO" ? categoryId : undefined,
          stockTypeId: tipoItem === "EQUIPAMENTO" ? stockTypeId : undefined,
          modelId,
          consumableId,
        };

        startTransition(async () => {
          const r = await processarEntradaCompra(payload);
          if ("error" in r) {
            toast.error(r.error);
            return;
          }
          toast.success(r.message);
          router.push(r.redirectTo);
          router.refresh();
        });
      }}
    >
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground">Dados da nota fiscal</h2>
        {fornecedores.length === 0 ? (
          <p className="text-amber-800 text-sm dark:text-amber-200">
            Não há fornecedores cadastrados.{" "}
            <Link href="/fornecedores" className="font-medium underline underline-offset-2">
              Cadastrar fornecedores
            </Link>
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="numeroNF">Número da NF *</Label>
            <Input
              id="numeroNF"
              value={numeroNF}
              onChange={(e) => setNumeroNF(e.target.value)}
              placeholder="Ex.: 12345"
              required
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>Fornecedor *</Label>
            <Select
              value={supplierId || undefined}
              onValueChange={(v) => setSupplierId(v ?? "")}
              disabled={fornecedores.length === 0}
            >
              <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} · {formatCnpjDigits(f.cnpj)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dataCompra">Data da compra *</Label>
            <Input
              id="dataCompra"
              type="date"
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Opcional"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground">Produto</h2>
        {missingCatalog && (
          <p className="text-amber-800 text-sm dark:text-amber-200">{missingCatalog}</p>
        )}
        <div className="grid gap-2">
          <Label>Item *</Label>
          <Select value={produtoKey || undefined} onValueChange={(v) => setProdutoKey(v ?? "")}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Selecione modelo ou insumo" />
            </SelectTrigger>
            <SelectContent>
              {modelos.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Equipamentos (modelos)</SelectLabel>
                  {modelos.map((m) => (
                    <SelectItem key={m.id} value={`e:${m.id}`}>
                      {m.brandNome} — {m.nome}
                      {m.isSerialized ? " (serializado)" : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {insumos.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Insumos</SelectLabel>
                  {insumos.map((c) => (
                    <SelectItem key={c.id} value={`c:${c.id}`}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>

        {tipoItem === "EQUIPAMENTO" && selectedModelo && (
          <p className="text-muted-foreground text-sm">
            {selectedModelo.isSerialized
              ? "Este modelo exige um número de série por unidade (cada unidade vira um patrimônio com série)."
              : "Este modelo não exige série: serão criados vários patrimônios (tags distintas), sem número de série."}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="qtd">Quantidade *</Label>
            <Input
              id="qtd"
              type="number"
              min={1}
              step={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="vu">Valor unitário (R$) *</Label>
            <Input
              id="vu"
              inputMode="decimal"
              placeholder="0,00"
              value={valorUnitarioStr}
              onChange={(e) => setValorUnitarioStr(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Valor total da linha: </span>
          <span className="font-semibold tabular-nums text-foreground">{valorTotalFmt}</span>
        </div>

        {tipoItem === "EQUIPAMENTO" && (
          <div className="space-y-4 border-border border-t pt-4">
            <h3 className="font-medium text-foreground text-sm">Dados do patrimônio</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor="prefixo">Prefixo das tags de patrimônio *</Label>
                    <Input
                      id="prefixo"
                      value={prefixoTag}
                      onChange={(e) => setPrefixoTag(e.target.value)}
                      placeholder="Ex.: NF12345-NOTEBOOK"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => {
                      setPrefixoTag(gerarPrefixoTagAutomatico(numeroNF));
                      toast.message("Prefixo gerado. As tags serão únicas (001, 002…).");
                    }}
                  >
                    Gerar tags automáticas
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Será gerado automaticamente: {prefixoTag.trim() || "PREFIXO"}-001, 002… (único por item). Use o
                  botão se não quiser amarrar o prefixo à série do fabricante.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Empresa *</Label>
                <Select value={companyId || undefined} onValueChange={(v) => setCompanyId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Categoria (patrimônio) *</Label>
                <Select value={categoryId || undefined} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Tipo de estoque *</Label>
                <Select value={stockTypeId || undefined} onValueChange={(v) => setStockTypeId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEstoque.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {requiresSerial && (
              <div className="space-y-2">
                <Label>Números de série * ({qtd} campo(s))</Label>
                <div className="max-h-72 overflow-y-auto rounded-md border border-border p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {numerosSerie.map((s, i) => (
                      <div key={i} className="grid gap-1">
                        <span className="text-muted-foreground text-xs">Unidade {i + 1}</span>
                        <Input
                          value={s}
                          onChange={(e) => setSerieAt(i, e.target.value)}
                          placeholder={`Série ${i + 1}`}
                          className="font-mono text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending || !canSubmit || Boolean(missingCatalog)}>
          {pending ? "Processando…" : "Finalizar entrada"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
