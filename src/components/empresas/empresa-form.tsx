"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BRAZIL_UF_SIGLAS } from "@/lib/brazil-ufs";
import { createEmpresa } from "@/app/empresas/actions";
import { empresaFieldsSchema } from "@/app/empresas/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, looseControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const emptyEmpresaFormDefaults = {
  nome: "",
  cnpj: "",
  emailContato: "",
  telefone: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export function EmpresaFormBody({ control }: { control: unknown }) {
  const c = looseControl(control);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={c}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: ACME Ltda" {...field} value={field.value ?? ""} />
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
              <FormLabel>CNPJ</FormLabel>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={c}
          name="emailContato"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail de contato</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contato@empresa.com" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={c}
          name="telefone"
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
      </div>

      <h3 className="border-border mt-6 border-b pb-2 font-semibold text-sm text-foreground">Endereço</h3>

      <div className="grid gap-4 sm:grid-cols-12">
        <FormField
          control={c}
          name="cep"
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>CEP</FormLabel>
              <FormControl>
                <Input placeholder="00000-000" inputMode="numeric" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={c}
          name="rua"
          render={({ field }) => (
            <FormItem className="sm:col-span-6">
              <FormLabel>Rua</FormLabel>
              <FormControl>
                <Input placeholder="Rua, avenida, etc." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={c}
          name="numero"
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input placeholder="Nº ou S/N" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-12">
        <FormField
          control={c}
          name="complemento"
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input placeholder="Sala, andar, bloco" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={c}
          name="bairro"
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>Bairro</FormLabel>
              <FormControl>
                <Input placeholder="Bairro" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={c}
          name="cidade"
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input placeholder="Cidade" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={c}
          name="estado"
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>UF</FormLabel>
              <Select
                value={field.value && field.value !== "" ? field.value : "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : (v ?? ""))}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {BRAZIL_UF_SIGLAS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

export function EmpresaForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(empresaFieldsSchema),
    defaultValues: emptyEmpresaFormDefaults,
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4 rounded-xl border border-border bg-card p-4"
        onSubmit={form.handleSubmit((values) => {
          startTransition(async () => {
            const fd = new FormData();
            fd.set("nome", values.nome);
            fd.set("cnpj", values.cnpj ?? "");
            fd.set("emailContato", values.emailContato ?? "");
            fd.set("telefone", values.telefone ?? "");
            fd.set("cep", values.cep ?? "");
            fd.set("rua", values.rua ?? "");
            fd.set("numero", values.numero ?? "");
            fd.set("complemento", values.complemento ?? "");
            fd.set("bairro", values.bairro ?? "");
            fd.set("cidade", values.cidade ?? "");
            fd.set("estado", values.estado ?? "");
            const r = await createEmpresa(fd);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Empresa cadastrada.");
              form.reset(emptyEmpresaFormDefaults);
            }
          });
        })}
      >
        <EmpresaFormBody control={form.control} />
        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Salvando…" : "Cadastrar"}
        </Button>
      </form>
    </Form>
  );
}
