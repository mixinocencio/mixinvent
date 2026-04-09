"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTipoEstoque } from "@/app/tipos-estoque/actions";

export function TipoEstoqueForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await createTipoEstoque(fd);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Tipo de estoque cadastrado.");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <div className="grid w-full gap-2 sm:max-w-xs">
        <Label htmlFor="te-nome">Nome</Label>
        <Input id="te-nome" name="nome" placeholder="Ex.: Estoque central" required />
      </div>
      <Button type="submit" disabled={pending} className="sm:mb-0.5">
        {pending ? "Salvando…" : "Cadastrar"}
      </Button>
    </form>
  );
}
