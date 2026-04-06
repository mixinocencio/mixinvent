"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AssetStatus } from "@prisma/client";
import { toast } from "sonner";
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
import { createAsset } from "../actions";

type CategoryOption = { id: string; nome: string };

const statusLabels: Record<AssetStatus, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em uso",
  MANUTENCAO: "Manutenção",
  SUCATA: "Sucata",
};

export function NovoEquipamentoForm({ categorias }: { categorias: CategoryOption[] }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      tagPatrimonio: "",
      hostname: "",
      numeroSerie: "",
      marca: "",
      modelo: "",
      sistemaOperacional: "",
      statusAntivirus: "",
      dataCompra: "",
      valor: "",
      status: AssetStatus.DISPONIVEL,
      categoryId: categorias[0]?.id ?? "",
    },
  });

  return (
    <form
      className="max-w-2xl space-y-6 rounded-xl border border-border bg-card p-6"
      onSubmit={handleSubmit(async (values) => {
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
                  <SelectValue />
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
          <Label htmlFor="hostname">Hostname</Label>
          <Input id="hostname" {...register("hostname")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="numeroSerie">Número de série</Label>
          <Input id="numeroSerie" {...register("numeroSerie")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="marca">Marca</Label>
          <Input id="marca" {...register("marca")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" {...register("modelo")} />
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
          {isSubmitting ? "Salvando…" : "Salvar equipamento"}
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
