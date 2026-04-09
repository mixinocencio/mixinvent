"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  looseControl,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createModelo } from "@/app/modelos/actions";
import { modeloCreateSchema } from "@/app/modelos/schema";

export type MarcaOption = { id: string; nome: string };

export function ModeloForm({ marcas }: { marcas: MarcaOption[] }) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(modeloCreateSchema),
    defaultValues: {
      nome: "",
      brandId: marcas[0]?.id ?? "",
      partNumber: "",
      mesesGarantia: "",
      mesesDepreciacao: "",
      isSerialized: "false" as const,
    },
  });
  const control = looseControl(form.control);

  return (
    <Form {...form}>
      <form
        className="space-y-4 rounded-xl border border-border bg-card p-4"
        onSubmit={form.handleSubmit((values) => {
          startTransition(async () => {
            const fd = new FormData();
            fd.set("nome", values.nome);
            fd.set("brandId", values.brandId);
            fd.set("partNumber", values.partNumber ?? "");
            fd.set("mesesGarantia", values.mesesGarantia != null ? String(values.mesesGarantia) : "");
            fd.set(
              "mesesDepreciacao",
              values.mesesDepreciacao != null ? String(values.mesesDepreciacao) : "",
            );
            fd.set("isSerialized", values.isSerialized);
            const r = await createModelo(fd);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Modelo cadastrado.");
              form.reset({
                nome: "",
                brandId: marcas[0]?.id ?? "",
                partNumber: "",
                mesesGarantia: "",
                mesesDepreciacao: "",
                isSerialized: "false",
              });
            }
          });
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="nome"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: Latitude 5420" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="brandId"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Marca *</FormLabel>
                <Select
                  value={field.value || null}
                  onValueChange={(v) => field.onChange(v ?? "")}
                  disabled={marcas.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="w-full min-w-[12rem]">
                      <SelectValue placeholder={marcas.length === 0 ? "Cadastre uma marca" : "Selecione"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {marcas.map((m) => (
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
            name="partNumber"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Part number (PN)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: LAT-5420-I5" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mesesGarantia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meses de garantia</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="Ex.: 36" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mesesDepreciacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meses de depreciação</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="Ex.: 60" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="isSerialized"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Exige número de série na compra *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as "true" | "false")}
                >
                  <FormControl>
                    <SelectTrigger className="w-full min-w-[12rem]">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="false">Não (estoque por unidade, sem série)</SelectItem>
                    <SelectItem value="true">Sim (uma série por unidade na NF)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Notebooks e equipamentos rastreados costumam ser serializados; itens genéricos podem ficar como
                  Não.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={pending || marcas.length === 0} className="mt-2">
          {pending ? "Salvando…" : "Cadastrar"}
        </Button>
      </form>
    </Form>
  );
}
