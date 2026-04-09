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
import { createDepartamento } from "./actions";
import { departamentoCreateSchema } from "./schema";

export function DepartamentoForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(departamentoCreateSchema),
    defaultValues: {
      nome: "",
      localizacao: "",
      centroCusto: "",
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
            fd.set("localizacao", values.localizacao ?? "");
            fd.set("centroCusto", values.centroCusto ?? "");
            const r = await createDepartamento(fd);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Departamento cadastrado.");
              form.reset();
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
                  <Input placeholder="Ex.: TI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="localizacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localização</FormLabel>
                <FormControl>
                  <Input placeholder="Cidade / andar" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="centroCusto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de custo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: CC-1200-TI" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Salvando…" : "Cadastrar"}
        </Button>
      </form>
    </Form>
  );
}
