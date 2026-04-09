"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AssetLogAcao } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliveryChecklist } from "@/components/equipamentos/delivery-checklist";
import {
  INITIAL_DELIVERY_CHECKLIST_STATE,
  isDeliveryChecklistComplete,
  type DeliveryChecklistState,
} from "@/lib/delivery-checklist";
import { movimentarEquipamento } from "../actions";

type UserOption = { id: string; nome: string; email: string };

const ACOES = ["CHECKOUT", "CHECKIN", "MANUTENCAO"] as const;
type AcaoMov = (typeof ACOES)[number];

const acaoLabels: Record<AcaoMov, string> = {
  CHECKOUT: "Checkout (entregar ao colaborador)",
  CHECKIN: "Check-in (devolver ao estoque)",
  MANUTENCAO: "Enviar para manutenção",
};

function isAcaoMov(v: string): v is AcaoMov {
  return (ACOES as readonly string[]).includes(v);
}

export function MovimentacaoForm({
  assetId,
  usuarios,
}: {
  assetId: string;
  usuarios: UserOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [acao, setAcao] = useState<AcaoMov | "">("");
  const [userId, setUserId] = useState<string>("");
  const [observacao, setObservacao] = useState("");
  const [checklist, setChecklist] = useState<DeliveryChecklistState>(INITIAL_DELIVERY_CHECKLIST_STATE);
  const [nexusTicketId, setNexusTicketId] = useState("");

  useEffect(() => {
    if (acao !== "CHECKOUT") {
      setChecklist(INITIAL_DELIVERY_CHECKLIST_STATE);
      setNexusTicketId("");
    }
  }, [acao]);

  const isCheckout = acao === "CHECKOUT";
  const checklistOk = !isCheckout || isDeliveryChecklistComplete(checklist);
  const nexusOk = !isCheckout || nexusTicketId.trim() !== "";
  const canSubmit =
    Boolean(acao && userId && checklistOk && nexusOk && usuarios.length > 0) && !pending;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!acao || !isAcaoMov(acao)) {
          toast.error("Selecione uma ação válida.");
          return;
        }
        if (!userId) {
          toast.error("Selecione o colaborador responsável pelo registro.");
          return;
        }
        if (acao === "CHECKOUT" && !isDeliveryChecklistComplete(checklist)) {
          toast.error("Conclua o checklist de entrega antes de confirmar a atribuição.");
          return;
        }
        if (acao === "CHECKOUT" && !nexusTicketId.trim()) {
          toast.error("Informe o ID do chamado Nexus.");
          return;
        }

        const acaoEnum = acao as AssetLogAcao;
        const checklistPayload = acaoEnum === AssetLogAcao.CHECKOUT ? checklist : undefined;
        const nexusPayload =
          acaoEnum === AssetLogAcao.CHECKOUT ? nexusTicketId.trim() : undefined;

        startTransition(async () => {
          const r = await movimentarEquipamento(
            assetId,
            acaoEnum,
            userId,
            observacao.trim() || null,
            checklistPayload,
            nexusPayload,
          );
          if (r.error) toast.error(r.error);
          else {
            toast.success("Movimentação registrada.");
            setAcao("");
            setUserId("");
            setObservacao("");
            setChecklist(INITIAL_DELIVERY_CHECKLIST_STATE);
            setNexusTicketId("");
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="acao-select">Ação</Label>
          <Select
            value={acao || undefined}
            onValueChange={(v) => setAcao(isAcaoMov(v ?? "") ? (v as AcaoMov) : "")}
            disabled={pending}
          >
            <SelectTrigger id="acao-select" className="w-full">
              <SelectValue placeholder="Selecione…" />
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
          <Label htmlFor="user-select">Colaborador (registro no histórico)</Label>
          <Select
            value={userId || undefined}
            onValueChange={(v) => setUserId(v ?? "")}
            disabled={pending}
          >
            <SelectTrigger id="user-select" className="w-full">
              <SelectValue placeholder="Selecione…" />
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

      {isCheckout ? (
        <div className="grid gap-2">
          <Label htmlFor="nexus-ticket-id">ID do Chamado Nexus</Label>
          <Input
            id="nexus-ticket-id"
            name="nexusTicketId"
            type="text"
            autoComplete="off"
            placeholder="Ex.: 12345 ou INC001"
            value={nexusTicketId}
            onChange={(e) => setNexusTicketId(e.target.value)}
            disabled={pending}
            className="max-w-md"
          />
          <p className="text-muted-foreground text-xs">
            Obrigatório no checkout para rastrear o chamado técnico vinculado à entrega.
          </p>
        </div>
      ) : null}

      {isCheckout ? (
        <DeliveryChecklist value={checklist} onChange={setChecklist} disabled={pending} />
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          rows={3}
          placeholder="Opcional"
          className="min-h-[80px] resize-y"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={!canSubmit}>
        {pending
          ? "Processando…"
          : isCheckout
            ? "Confirmar atribuição"
            : "Registrar movimentação"}
      </Button>
      {usuarios.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Cadastre colaboradores ativos para habilitar movimentações.
        </p>
      )}
    </form>
  );
}
