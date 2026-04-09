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
import { createMarca } from "@/app/marcas/actions";
import { marcaFieldsSchema } from "@/app/marcas/schema";

export function MarcaForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(marcaFieldsSchema),
    defaultValues: {
      nome: "",
      site: "",
      telefoneSuporte: "",
      emailSuporte: "",
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
            fd.set("site", values.site ?? "");
            fd.set("telefoneSuporte", values.telefoneSuporte ?? "");
            fd.set("emailSuporte", values.emailSuporte ?? "");
            const r = await createMarca(fd);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Marca cadastrada.");
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
                  <Input placeholder="Ex.: Dell" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="site"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Site</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.fabricante.com" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="telefoneSuporte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone suporte</FormLabel>
                <FormControl>
                  <Input placeholder="0800 ou DDD" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="emailSuporte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail suporte</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="suporte@marca.com" {...field} value={field.value ?? ""} />
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
