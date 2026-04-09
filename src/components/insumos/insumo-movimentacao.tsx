"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { movimentarEstoque } from "@/app/insumos/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InsumoMovimentacaoDialog({
  open,
  onOpenChange,
  insumoId,
  nome,
  quantidadeAtual,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumoId: string;
  nome: string;
  quantidadeAtual: number;
}) {
  const [valor, setValor] = useState("");
  const [pending, startTransition] = useTransition();

  const q = Number(valor.replace(",", "."));
  const qValid = Number.isFinite(q) && q > 0 && Number.isInteger(q);

  function run(tipo: "ENTRADA" | "SAIDA") {
    if (!qValid) {
      toast.error("Informe um número inteiro maior que zero.");
      return;
    }
    startTransition(async () => {
      const r = await movimentarEstoque(insumoId, Math.trunc(q), tipo);
      if (r.error) toast.error(r.error);
      else {
        toast.success(tipo === "ENTRADA" ? "Entrada registrada." : "Saída registrada.");
        setValor("");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setValor("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentar estoque</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{nome}</span>
            <span className="block pt-1">Estoque atual: {quantidadeAtual} un.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="mov-qty">Quantidade</Label>
          <Input
            id="mov-qty"
            type="number"
            min={1}
            step={1}
            placeholder="Ex.: 10"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            disabled={pending}
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => run("ENTRADA")} disabled={pending || !qValid}>
              Dar entrada
            </Button>
            <Button type="button" variant="secondary" onClick={() => run("SAIDA")} disabled={pending || !qValid}>
              Dar saída
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
