"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useFieldArray, useForm, type Control, type FieldValues, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { registrarEntradaComNF } from "@/app/compras/actions";
import {
  registrarEntradaComNFSchema,
  type RegistrarEntradaComNFInput,
} from "@/app/compras/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  looseControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCnpjDigits } from "@/lib/format-cnpj";

export type ModeloCompraOption = {
  id: string;
  nome: string;
  brandId: string;
  brandNome: string;
  isSerialized: boolean;
};
export type MarcaCompraOption = { id: string; nome: string };
export type InsumoCompraOption = { id: string; nome: string };
export type CategoriaPatOption = { id: string; nome: string };
export type EmpresaCompraOption = { id: string; nome: string };
export type TipoEstoqueOption = { id: string; nome: string };
export type FornecedorCompraOption = { id: string; name: string; cnpj: string };

function emptyLinhaAtivo(cat: string): RegistrarEntradaComNFInput["ativos"][number] {
  return {
    tagPatrimonio: "",
    nome: "",
    categoryId: cat,
    brandId: "",
    modelId: "",
    numeroSerie: "",
  };
}

function emptyLinhaInsumo(consumableId: string): RegistrarEntradaComNFInput["insumos"][number] {
  return { consumableId, quantidade: 1 };
}

function buildDefaults(
  fornecedores: FornecedorCompraOption[],
  categorias: CategoriaPatOption[],
  empresas: EmpresaCompraOption[],
  tiposEstoque: TipoEstoqueOption[],
  insumos: InsumoCompraOption[],
): RegistrarEntradaComNFInput {
  const today = new Date().toISOString().slice(0, 10);
  const cat = categorias[0]?.id ?? "";
  return {
    numero: "",
    supplierId: fornecedores[0]?.id ?? "",
    dataEmissao: today,
    valorTotal: undefined,
    companyId: empresas[0]?.id ?? "",
    stockTypeId: tiposEstoque[0]?.id ?? "",
    ativos: [emptyLinhaAtivo(cat)],
    insumos: [],
  };
}

function LinhaEquipamento({
  index,
  categorias,
  marcas,
  modelos,
  control,
  setValue,
  brandId,
  modelId,
  canRemove,
  onRemove,
}: {
  index: number;
  categorias: CategoriaPatOption[];
  marcas: MarcaCompraOption[];
  modelos: ModeloCompraOption[];
  control: Control<FieldValues>;
  setValue: UseFormSetValue<RegistrarEntradaComNFInput>;
  brandId: string;
  modelId: string;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const modelo = useMemo(() => modelos.find((m) => m.id === modelId), [modelos, modelId]);
  const modelosFiltrados = useMemo(
    () => modelos.filter((m) => m.brandId === brandId),
    [modelos, brandId],
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4 md:flex-row md:flex-wrap md:items-end">
      {modelo?.isSerialized ? (
        <p className="text-muted-foreground w-full text-xs">
          Este modelo exige <strong>número de série</strong> nesta linha.
        </p>
      ) : null}
      <FormField
        control={control}
        name={`ativos.${index}.tagPatrimonio`}
        render={({ field }) => (
          <FormItem className="min-w-[120px] flex-1">
            <FormLabel className="text-xs">Tag patrimônio *</FormLabel>
            <FormControl>
              <Input className="h-9 font-mono text-sm" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`ativos.${index}.nome`}
        render={({ field }) => (
          <FormItem className="min-w-[140px] flex-1">
            <FormLabel className="text-xs">Nome (hostname)</FormLabel>
            <FormControl>
              <Input className="h-9 text-sm" placeholder="Opcional" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`ativos.${index}.categoryId`}
        render={({ field }) => (
          <FormItem className="min-w-[160px] flex-1">
            <FormLabel className="text-xs">Categoria *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`ativos.${index}.brandId`}
        render={({ field }) => (
          <FormItem className="min-w-[140px] flex-1">
            <FormLabel className="text-xs">Marca *</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v);
                setValue(`ativos.${index}.modelId`, "");
              }}
            >
              <FormControl>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {marcas.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`ativos.${index}.modelId`}
        render={({ field }) => (
          <FormItem className="min-w-[180px] flex-1">
            <FormLabel className="text-xs">Modelo *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange} disabled={!brandId}>
              <FormControl>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={brandId ? "Modelo" : "Marca primeiro"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {modelosFiltrados.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`ativos.${index}.numeroSerie`}
        render={({ field }) => (
          <FormItem className="min-w-[130px] flex-1">
            <FormLabel className="text-xs">Nº série</FormLabel>
            <FormControl>
              <Input className="h-9 text-sm" placeholder="Se serializado" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex shrink-0 pb-0.5 md:pb-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label="Remover equipamento"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function NovaEntradaCompraForm({
  fornecedores,
  modelos,
  marcas,
  insumos,
  categorias,
  empresas,
  tiposEstoque,
}: {
  fornecedores: FornecedorCompraOption[];
  modelos: ModeloCompraOption[];
  marcas: MarcaCompraOption[];
  insumos: InsumoCompraOption[];
  categorias: CategoriaPatOption[];
  empresas: EmpresaCompraOption[];
  tiposEstoque: TipoEstoqueOption[];
}) {
  const router = useRouter();
  const defaultValues = useMemo(
    () => buildDefaults(fornecedores, categorias, empresas, tiposEstoque, insumos),
    [fornecedores, categorias, empresas, tiposEstoque, insumos],
  );

  const form = useForm<RegistrarEntradaComNFInput>({
    resolver: zodResolver(registrarEntradaComNFSchema) as never,
    defaultValues,
  });

  const { fields: ativoFields, append: appendAtivo, remove: removeAtivo } = useFieldArray({
    control: form.control,
    name: "ativos",
  });

  const { fields: insumoFields, append: appendInsumo, remove: removeInsumo } = useFieldArray({
    control: form.control,
    name: "insumos",
  });

  const catPadrao = categorias[0]?.id ?? "";
  const insumoPadrao = insumos[0]?.id ?? "";

  const missingCatalog =
    fornecedores.length === 0
      ? "Cadastre ao menos um fornecedor para vincular à nota fiscal."
      : categorias.length === 0 || empresas.length === 0 || tiposEstoque.length === 0
        ? "Cadastre categoria Patrimônio, empresa e tipo de estoque para registrar equipamentos."
        : marcas.length === 0 || modelos.length === 0
          ? "Cadastre marcas e modelos para incluir equipamentos."
          : null;

  async function onSubmit(values: RegistrarEntradaComNFInput) {
    const r = await registrarEntradaComNF(values);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    const parts: string[] = [];
    if (r.ativosCriados > 0) parts.push(`${r.ativosCriados} equipamento(s)`);
    if (r.insumosMovimentados > 0) parts.push(`${r.insumosMovimentados} linha(s) de insumo`);
    toast.success(`Entrada registrada: ${parts.join(" e ")} vinculado(s) à NF.`);
    form.reset(buildDefaults(fornecedores, categorias, empresas, tiposEstoque, insumos));
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit as never)}
        className="mx-auto max-w-2xl space-y-8"
      >
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground">Dados da nota fiscal</h2>
          {fornecedores.length === 0 ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Não há fornecedores cadastrados.{" "}
              <Link href="/fornecedores" className="font-medium underline underline-offset-2">
                Cadastrar fornecedores
              </Link>
            </p>
          ) : null}
          {missingCatalog ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">{missingCatalog}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={looseControl(form.control)}
              name="numero"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Número da NF *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: 12345" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={looseControl(form.control)}
              name="supplierId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Fornecedor *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={fornecedores.length === 0}>
                    <FormControl>
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} · {formatCnpjDigits(f.cnpj)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={looseControl(form.control)}
              name="dataEmissao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da compra *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={looseControl(form.control)}
              name="valorTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor total da NF (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      className="tabular-nums"
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v === "" ? undefined : Number(v));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={looseControl(form.control)}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa (lote) *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={looseControl(form.control)}
              name="stockTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de estoque (lote) *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposEstoque.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-foreground">Produto</h2>
              <p className="text-muted-foreground text-sm">
                Equipamentos (patrimônio) e insumos na mesma nota — adicione quantas linhas precisar.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-base">Equipamentos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => appendAtivo(emptyLinhaAtivo(catPadrao))}
                disabled={Boolean(missingCatalog)}
              >
                <Plus className="size-4" />
                Adicionar equipamento
              </Button>
            </div>
            {ativoFields.map((f, index) => (
              <LinhaEquipamento
                key={f.id}
                index={index}
                categorias={categorias}
                marcas={marcas}
                modelos={modelos}
                control={looseControl(form.control)}
                setValue={form.setValue}
                brandId={form.watch(`ativos.${index}.brandId`)}
                canRemove={ativoFields.length > 1 || insumoFields.length > 0}
                modelId={form.watch(`ativos.${index}.modelId`)}
                onRemove={() => removeAtivo(index)}
              />
            ))}
            {ativoFields.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma linha de equipamento. Inclua insumos abaixo ou clique em &quot;Adicionar
                equipamento&quot;.
              </p>
            ) : null}
          </div>

          <div className="border-border border-t pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-base">Insumos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  if (!insumoPadrao) {
                    toast.error("Cadastre insumos antes de adicionar linhas.");
                    return;
                  }
                  appendInsumo(emptyLinhaInsumo(insumoPadrao));
                }}
                disabled={insumos.length === 0}
              >
                <Plus className="size-4" />
                Adicionar insumo
              </Button>
            </div>
            {insumos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Não há insumos cadastrados.</p>
            ) : null}
            {insumoFields.map((f, index) => (
              <div
                key={f.id}
                className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4 sm:flex-row sm:items-end"
              >
                <FormField
                  control={looseControl(form.control)}
                  name={`insumos.${index}.consumableId`}
                  render={({ field }) => (
                    <FormItem className="min-w-[200px] flex-1">
                      <FormLabel className="text-xs">Insumo *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {insumos.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={looseControl(form.control)}
                  name={`insumos.${index}.quantidade`}
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-28">
                      <FormLabel className="text-xs">Qtd *</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9 tabular-nums"
                          type="number"
                          min={1}
                          step={1}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive shrink-0"
                  disabled={insumoFields.length <= 1 && ativoFields.length === 0}
                  onClick={() => removeInsumo(index)}
                  aria-label="Remover insumo"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || Boolean(missingCatalog) || fornecedores.length === 0}
          >
            {form.formState.isSubmitting ? "Processando…" : "Finalizar entrada"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
