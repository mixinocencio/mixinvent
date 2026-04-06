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
import { createCategoria } from "./actions";

export function CategoriaForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await createCategoria(fd);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Categoria cadastrada.");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <div className="grid w-full gap-2 sm:max-w-xs">
        <Label htmlFor="cat-nome">Nome</Label>
        <Input id="cat-nome" name="nome" placeholder="Ex.: Notebook" required />
      </div>
      <div className="grid w-full gap-2 sm:max-w-[200px]">
        <Label htmlFor="cat-tipo">Tipo</Label>
        <Select name="tipo" required defaultValue="PATRIMONIO">
          <SelectTrigger id="cat-tipo" className="w-full min-w-[12rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PATRIMONIO">Patrimônio</SelectItem>
            <SelectItem value="INSUMO">Insumo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="sm:mb-0.5">
        {pending ? "Salvando…" : "Cadastrar"}
      </Button>
    </form>
  );
}
