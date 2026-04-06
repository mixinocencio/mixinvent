"use client";

import { useTransition } from "react";
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
import { createColaborador } from "./actions";

type Dept = { id: string; nome: string };

export function ColaboradorForm({ departamentos }: { departamentos: Dept[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await createColaborador(fd);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Colaborador cadastrado.");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <div className="grid w-full gap-2 sm:max-w-xs">
        <Label htmlFor="colab-nome">Nome</Label>
        <Input id="colab-nome" name="nome" required />
      </div>
      <div className="grid w-full gap-2 sm:max-w-xs">
        <Label htmlFor="colab-email">E-mail</Label>
        <Input id="colab-email" name="email" type="email" required />
      </div>
      <div className="grid w-full gap-2 sm:max-w-[220px]">
        <Label htmlFor="colab-dep">Departamento</Label>
        <Select name="departamentoId" defaultValue="none">
          <SelectTrigger id="colab-dep" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {departamentos.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="sm:mb-0.5">
        {pending ? "Salvando…" : "Cadastrar"}
      </Button>
    </form>
  );
}
