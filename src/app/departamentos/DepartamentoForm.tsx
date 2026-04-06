"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepartamento } from "./actions";

export function DepartamentoForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await createDepartamento(fd);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Departamento cadastrado.");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <div className="grid w-full gap-2 sm:max-w-xs">
        <Label htmlFor="dep-nome">Nome</Label>
        <Input id="dep-nome" name="nome" placeholder="Ex.: TI" required />
      </div>
      <div className="grid w-full gap-2 sm:max-w-xs">
        <Label htmlFor="dep-loc">Localização</Label>
        <Input id="dep-loc" name="localizacao" placeholder="Opcional" />
      </div>
      <Button type="submit" disabled={pending} className="sm:mb-0.5">
        {pending ? "Salvando…" : "Cadastrar"}
      </Button>
    </form>
  );
}
