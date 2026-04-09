"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createSupplier } from "@/app/fornecedores/actions";
import { supplierFieldsSchema } from "@/app/fornecedores/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  looseControl,
} from "@/components/ui/form";

export const emptySupplierFormDefaults = {
  name: "",
  cnpj: "",
  contactEmail: "",
  phone: "",
  address: "",
};

export function SupplierFormBody({ control }: { control: unknown }) {
  const c = looseControl(control);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={c}
        name="name"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Razão social / nome *</FormLabel>
            <FormControl>
              <Input placeholder="Ex.: Fornecedor SA" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="cnpj"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ *</FormLabel>
            <FormControl>
              <Input
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="contactEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail de contato</FormLabel>
            <FormControl>
              <Input type="email" placeholder="contato@exemplo.com" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <Input placeholder="(00) 00000-0000" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="address"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Endereço</FormLabel>
            <FormControl>
              <Textarea rows={2} placeholder="Logradouro, cidade…" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function SupplierForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(supplierFieldsSchema),
    defaultValues: emptySupplierFormDefaults,
  });
  const control = looseControl(form.control);

  return (
    <Form {...form}>
      <form
        className="space-y-4 rounded-xl border border-border bg-card p-4"
        onSubmit={form.handleSubmit((values) => {
          startTransition(async () => {
            const fd = new FormData();
            fd.set("name", values.name);
            fd.set("cnpj", values.cnpj ?? "");
            fd.set("contactEmail", values.contactEmail ?? "");
            fd.set("phone", values.phone ?? "");
            fd.set("address", values.address ?? "");
            const r = await createSupplier(fd);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Fornecedor cadastrado.");
              form.reset(emptySupplierFormDefaults);
            }
          });
        })}
      >
        <h2 className="font-semibold text-foreground">Novo fornecedor</h2>
        <SupplierFormBody control={control} />
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Cadastrar"}
        </Button>
      </form>
    </Form>
  );
}
