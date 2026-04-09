"use client";

import { AssetStatus, type Asset } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAsset, updateAsset } from "@/app/equipamentos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assetFormSchema, type AssetFormValues } from "@/lib/schemas/asset";

export type CategoryOption = { id: string; nome: string };
export type CompanyOption = { id: string; nome: string };
export type BrandOption = { id: string; nome: string };
export type ModelOption = { id: string; nome: string; brandId: string; brandNome: string };
export type StockTypeOption = { id: string; nome: string };

export type AssetFormInitialData = Pick<
  Asset,
  | "id"
  | "tagPatrimonio"
  | "hostname"
  | "numeroSerie"
  | "sistemaOperacional"
  | "statusAntivirus"
  | "dataCompra"
  | "valor"
  | "status"
  | "categoryId"
  | "companyId"
  | "brandId"
  | "modelId"
  | "stockTypeId"
>;

const statusLabels: Record<AssetStatus, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em uso",
  MANUTENCAO: "Manutenção",
  SUCATA: "Sucata",
};

function firstModelIdForBrand(modelos: ModelOption[], brandId: string): string {
  const m = modelos.find((x) => x.brandId === brandId);
  return m?.id ?? "";
}

function formatDateForInput(d: Date | null): string {
  if (!d) return "";
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mapAssetToFormValues(asset: AssetFormInitialData): AssetFormValues {
  return {
    tagPatrimonio: asset.tagPatrimonio,
    hostname: asset.hostname ?? "",
    numeroSerie: asset.numeroSerie ?? "",
    sistemaOperacional: asset.sistemaOperacional ?? "",
    statusAntivirus: asset.statusAntivirus ?? "",
    dataCompra: formatDateForInput(asset.dataCompra),
    valor: asset.valor != null ? String(asset.valor) : "",
    status: asset.status,
    categoryId: asset.categoryId,
    companyId: asset.companyId,
    brandId: asset.brandId,
    modelId: asset.modelId,
    stockTypeId: asset.stockTypeId,
  };
}

function buildCreateDefaults(
  categorias: CategoryOption[],
  empresas: CompanyOption[],
  marcas: BrandOption[],
  modelos: ModelOption[],
  tiposEstoque: StockTypeOption[],
): AssetFormValues {
  const brandWithModel =
    marcas.find((b) => modelos.some((m) => m.brandId === b.id)) ?? marcas[0];
  const brandId = brandWithModel?.id ?? "";
  return {
    tagPatrimonio: "",
    hostname: "",
    numeroSerie: "",
    sistemaOperacional: "",
    statusAntivirus: "",
    dataCompra: "",
    valor: "",
    status: AssetStatus.DISPONIVEL,
    categoryId: categorias[0]?.id ?? "",
    companyId: empresas[0]?.id ?? "",
    brandId,
    modelId: brandId ? firstModelIdForBrand(modelos, brandId) : "",
    stockTypeId: tiposEstoque[0]?.id ?? "",
  };
}

export function AssetForm({
  categorias,
  empresas,
  marcas,
  modelos,
  tiposEstoque,
  initialData,
}: {
  categorias: CategoryOption[];
  empresas: CompanyOption[];
  marcas: BrandOption[];
  modelos: ModelOption[];
  tiposEstoque: StockTypeOption[];
  initialData?: AssetFormInitialData | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialData);

  const defaultValues = useMemo(
    () =>
      initialData
        ? mapAssetToFormValues(initialData)
        : buildCreateDefaults(categorias, empresas, marcas, modelos, tiposEstoque),
    [initialData, categorias, empresas, marcas, modelos, tiposEstoque],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const brandIdWatch = useWatch({ control, name: "brandId" });
  const modelIdVal = useWatch({ control, name: "modelId" });

  const modelosFiltrados = useMemo(
    () => (brandIdWatch ? modelos.filter((m) => m.brandId === brandIdWatch) : modelos),
    [brandIdWatch, modelos],
  );

  useEffect(() => {
    if (!brandIdWatch) return;
    const ok = modelIdVal && modelos.some((x) => x.id === modelIdVal && x.brandId === brandIdWatch);
    if (!ok) {
      const next = firstModelIdForBrand(modelos, brandIdWatch);
      setValue("modelId", next);
    }
  }, [brandIdWatch, modelIdVal, modelos, setValue]);

  return (
    <form
      className="max-w-2xl space-y-6 rounded-xl border border-border bg-card p-6"
      onSubmit={handleSubmit(async (values) => {
        if (initialData) {
          const r = await updateAsset(initialData.id, values);
          if (r.error) {
            toast.error(r.error);
            return;
          }
          toast.success("Equipamento atualizado.");
          router.push(`/equipamentos/${initialData.id}`);
          return;
        }
        const r = await createAsset(values);
        if (r.error) {
          toast.error(r.error);
          return;
        }
        toast.success("Equipamento cadastrado.");
        if (r.id) router.push(`/equipamentos/${r.id}`);
        else router.push("/equipamentos");
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="tagPatrimonio">Tag patrimônio *</Label>
          <Input id="tagPatrimonio" {...register("tagPatrimonio")} />
          {errors.tagPatrimonio && (
            <p className="text-xs text-destructive">{errors.tagPatrimonio.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Categoria (patrimônio) *</Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger id="categoryId" className="w-full" aria-invalid={!!errors.categoryId}>
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
            )}
          />
          {errors.categoryId && (
            <p className="text-xs text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="companyId">Empresa *</Label>
          <Controller
            name="companyId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger id="companyId" className="w-full" aria-invalid={!!errors.companyId}>
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
            )}
          />
          {errors.companyId && (
            <p className="text-xs text-destructive">{errors.companyId.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange((v as AssetStatus) ?? AssetStatus.DISPONIVEL)}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(statusLabels) as AssetStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brandId">Marca *</Label>
          <Controller
            name="brandId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(v) => {
                  const next = v ?? "";
                  field.onChange(next);
                  setValue("modelId", firstModelIdForBrand(modelos, next));
                }}
              >
                <SelectTrigger id="brandId" className="w-full" aria-invalid={!!errors.brandId}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.brandId && (
            <p className="text-xs text-destructive">{errors.brandId.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="modelId">Modelo *</Label>
          <Controller
            name="modelId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger id="modelId" className="w-full" aria-invalid={!!errors.modelId}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {modelosFiltrados.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.brandNome} — {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.modelId && (
            <p className="text-xs text-destructive">{errors.modelId.message}</p>
          )}
          {brandIdWatch && modelosFiltrados.length === 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-200">
              Nenhum modelo cadastrado para esta marca. Cadastre um modelo ou escolha outra marca.
            </p>
          )}
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="stockTypeId">Tipo de estoque *</Label>
          <Controller
            name="stockTypeId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger id="stockTypeId" className="w-full" aria-invalid={!!errors.stockTypeId}>
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
            )}
          />
          {errors.stockTypeId && (
            <p className="text-xs text-destructive">{errors.stockTypeId.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="hostname">Hostname</Label>
          <Input id="hostname" {...register("hostname")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="numeroSerie">Número de série</Label>
          <Input id="numeroSerie" {...register("numeroSerie")} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="sistemaOperacional">Sistema operacional</Label>
          <Input id="sistemaOperacional" {...register("sistemaOperacional")} />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="statusAntivirus">Status antivírus / EDR</Label>
          <Input id="statusAntivirus" {...register("statusAntivirus")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dataCompra">Data de compra</Label>
          <Input id="dataCompra" type="date" {...register("dataCompra")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="valor">Valor</Label>
          <Input id="valor" inputMode="decimal" placeholder="0,00" {...register("valor")} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : isEdit ? "Atualizar equipamento" : "Salvar equipamento"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
