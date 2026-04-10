"use client";

import { useMemo } from "react";
import {
  useFieldArray,
  useForm,
  type Control,
  type FieldValues,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { registrarEntradaComNF } from "./actions";
import {
  registrarEntradaComNFSchema,
  type RegistrarEntradaComNFInput,
} from "./schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CategoriaOption = { id: string; nome: string };
export type EmpresaOption = { id: string; nome: string };
export type MarcaOption = { id: string; nome: string };
export type ModeloOption = { id: string; nome: string; brandId: string };
export type TipoEstoqueOption = { id: string; nome: string };

type Props = {
  categorias: CategoriaOption[];
  empresas: EmpresaOption[];
  marcas: MarcaOption[];
  modelos: ModeloOption[];
  tiposEstoque: TipoEstoqueOption[];
};

function emptyLinhaAtivo(categoriaPadrao: string): RegistrarEntradaComNFInput["ativos"][number] {
  return {
    tagPatrimonio: "",
    nome: "",
    categoryId: categoriaPadrao,
    brandId: "",
    modelId: "",
    numeroSerie: "",
  };
}

function buildDefaultValues(
  categorias: CategoriaOption[],
  empresas: EmpresaOption[],
  tiposEstoque: TipoEstoqueOption[],
): RegistrarEntradaComNFInput {
  const cat = categorias[0]?.id ?? "";
  const today = new Date().toISOString().slice(0, 10);
  return {
    numero: "",
    fornecedor: "",
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
  canRemove,
  onRemove,
}: {
  index: number;
  categorias: CategoriaOption[];
  marcas: MarcaOption[];
  modelos: ModeloOption[];
  control: Control<FieldValues>;
  setValue: UseFormSetValue<RegistrarEntradaComNFInput>;
  brandId: string;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const modelosFiltrados = useMemo(
    () => modelos.filter((m) => m.brandId === brandId),
    [modelos, brandId],
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 p-3 md:flex-row md:flex-wrap md:items-end">
      <FormField
        control={control}
        name={`ativos.${index}.tagPatrimonio`}
        render={({ field }) => (
          <FormItem className="min-w-[120px] flex-1">
            <FormLabel className="text-xs">Tag patrimônio</FormLabel>
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
            <FormLabel className="text-xs">Categoria</FormLabel>
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
            <FormLabel className="text-xs">Marca</FormLabel>
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
          <FormItem className="min-w-[160px] flex-1">
            <FormLabel className="text-xs">Modelo</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!brandId}
            >
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
              <Input className="h-9 text-sm" placeholder="Opcional" autoComplete="off" {...field} />
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
          aria-label="Remover linha"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function EntradaRapidaForm({
  categorias,
  empresas,
  marcas,
  modelos,
  tiposEstoque,
}: Props) {
  const defaultValues = useMemo(
    () => buildDefaultValues(categorias, empresas, tiposEstoque),
    [categorias, empresas, tiposEstoque],
  );

  const form = useForm<RegistrarEntradaComNFInput>({
    resolver: zodResolver(registrarEntradaComNFSchema) as never,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ativos",
  });

  async function onSubmit(values: RegistrarEntradaComNFInput) {
    const r = await registrarEntradaComNF(values);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    toast.success(
      `Entrada registrada: NF vinculada a ${r.ativosCriados} equipamento(s).`,
    );
    form.reset(buildDefaultValues(categorias, empresas, tiposEstoque));
  }

  const catPadrao = categorias[0]?.id ?? "";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit as never)}
        className="space-y-6"
      >
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Dados da nota fiscal</CardTitle>
            <CardDescription>
              Preencha a NF uma vez; todos os equipamentos abaixo serão vinculados a ela.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={looseControl(form.control)}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da NF</FormLabel>
                    <FormControl>
                      <Input className="h-9" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={looseControl(form.control)}
                name="fornecedor"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 lg:col-span-1">
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input className="h-9" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={looseControl(form.control)}
                name="dataEmissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de emissão</FormLabel>
                    <FormControl>
                      <Input className="h-9" type="date" {...field} />
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
                    <FormLabel>Valor total (R$)</FormLabel>
                    <FormControl>
                      <Input
                        className="h-9 tabular-nums"
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
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={looseControl(form.control)}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa (lote)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9">
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
                    <FormLabel>Tipo de estoque (lote)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9">
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
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Equipamentos da nota</CardTitle>
              <CardDescription>Uma linha por patrimônio. Use Tab para digitar rápido.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => append(emptyLinhaAtivo(catPadrao))}
            >
              <Plus className="size-4" />
              Adicionar linha
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((f, index) => (
              <LinhaEquipamento
                key={f.id}
                index={index}
                categorias={categorias}
                marcas={marcas}
                modelos={modelos}
                control={looseControl(form.control)}
                setValue={form.setValue}
                brandId={form.watch(`ativos.${index}.brandId`)}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando…" : "Salvar entrada"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
