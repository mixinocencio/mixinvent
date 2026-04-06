"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { movimentarEquipamento } from "../actions";

type UserOption = { id: string; nome: string; email: string };

const ACOES = ["CHECKOUT", "CHECKIN", "MANUTENCAO"] as const;
type AcaoMov = (typeof ACOES)[number];

const acaoLabels: Record<AcaoMov, string> = {
  CHECKOUT: "Checkout (entregar ao colaborador)",
  CHECKIN: "Check-in (devolver ao estoque)",
  MANUTENCAO: "Enviar para manutenção",
};

export function MovimentacaoForm({
  assetId,
  usuarios,
}: {
  assetId: string;
  usuarios: UserOption[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const acao = fd.get("acao")?.toString() as AcaoMov | undefined;
        const userId = fd.get("userId")?.toString();
        const observacao = fd.get("observacao")?.toString();
        if (!acao || !ACOES.includes(acao)) {
          toast.error("Selecione uma ação válida.");
          return;
        }
        if (!userId) {
          toast.error("Selecione o colaborador responsável pelo registro.");
          return;
        }
        startTransition(async () => {
          const r = await movimentarEquipamento(assetId, acao, userId, observacao);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Movimentação registrada.");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="acao">Ação</Label>
          <Select name="acao" required>
            <SelectTrigger id="acao" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACOES.map((a) => (
                <SelectItem key={a} value={a}>
                  {acaoLabels[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="userId">Colaborador (registro no histórico)</Label>
          <Select name="userId" required>
            <SelectTrigger id="userId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {usuarios.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome} — {u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          name="observacao"
          rows={3}
          placeholder="Opcional"
          className="min-h-[80px] resize-y"
        />
      </div>
      <Button type="submit" disabled={pending || usuarios.length === 0}>
        {pending ? "Processando…" : "Registrar movimentação"}
      </Button>
      {usuarios.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Cadastre colaboradores ativos para habilitar movimentações.
        </p>
      )}
    </form>
  );
}
