"use client";

import { UserStatus } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { createUser } from "@/app/colaboradores/actions";
import { colaboradorInputSchema } from "@/app/colaboradores/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type EmpresaOption = { id: string; nome: string };
export type DepartamentoOption = { id: string; nome: string };

export type ColaboradorFormValues = z.infer<typeof colaboradorInputSchema>;

const STATUS_OPTIONS: UserStatus[] = ["ATIVO", "INATIVO"];

export function ColaboradorFormFields({
  control,
  empresas,
  departamentos,
}: {
  control: unknown;
  empresas: EmpresaOption[];
  departamentos: DepartamentoOption[];
}) {
  const c = looseControl(control);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={c}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome *</FormLabel>
            <FormControl>
              <Input placeholder="Nome completo" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="nome@empresa.com.br" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="samAccountName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SamAccountName</FormLabel>
            <FormControl>
              <Input placeholder="usuario.ad" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="userPrincipalName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>User Principal Name (UPN)</FormLabel>
            <FormControl>
              <Input placeholder="usuario@dominio.corp" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="cargo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cargo</FormLabel>
            <FormControl>
              <Input placeholder="Cargo no AD" {...field} value={field.value ?? ""} />
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
              <Input placeholder="DDD + número" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="cidade"
        render={({ field }) => (
          <FormItem>
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
          <FormItem>
            <FormLabel>Estado (UF)</FormLabel>
            <FormControl>
              <Input placeholder="SP" maxLength={2} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="licencasO365"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Licenças O365</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Ex.: O365_BUSINESS_PREMIUM, FLOW_FREE"
                rows={3}
                className="min-h-0 resize-y"
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
        name="companyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Empresa</FormLabel>
            <Select
              value={field.value && field.value !== "" ? field.value : "none"}
              onValueChange={(v) => field.onChange(v === "none" ? "" : (v ?? ""))}
              disabled={empresas.length === 0}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={empresas.length === 0 ? "Nenhuma empresa" : "Selecione"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">— Nenhuma —</SelectItem>
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
        control={c}
        name="departamentoId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Departamento</FormLabel>
            <Select
              value={field.value && field.value !== "" ? field.value : "none"}
              onValueChange={(v) => field.onChange(v === "none" ? "" : (v ?? ""))}
              disabled={departamentos.length === 0}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={departamentos.length === 0 ? "Nenhum departamento" : "Selecione"}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">— Nenhum —</SelectItem>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={c}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select value={field.value} onValueChange={(v) => field.onChange(v as UserStatus)}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "ATIVO" ? "Ativo" : "Inativo"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function ColaboradorForm({
  empresas,
  departamentos,
}: {
  empresas: EmpresaOption[];
  departamentos: DepartamentoOption[];
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(colaboradorInputSchema),
    defaultValues: {
      nome: "",
      email: "",
      samAccountName: "",
      userPrincipalName: "",
      cargo: "",
      telefone: "",
      cidade: "",
      estado: "",
      licencasO365: "",
      companyId: "",
      departamentoId: "",
      status: "ATIVO",
    },
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4 rounded-xl border border-border bg-card p-4"
        onSubmit={form.handleSubmit((values) => {
          startTransition(async () => {
            const r = await createUser(values);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Colaborador cadastrado.");
              form.reset({
                nome: "",
                email: "",
                samAccountName: "",
                userPrincipalName: "",
                cargo: "",
                telefone: "",
                cidade: "",
                estado: "",
                licencasO365: "",
                companyId: "",
                departamentoId: "",
                status: "ATIVO",
              });
            }
          });
        })}
      >
        <ColaboradorFormFields control={form.control} empresas={empresas} departamentos={departamentos} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Cadastrar colaborador"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
