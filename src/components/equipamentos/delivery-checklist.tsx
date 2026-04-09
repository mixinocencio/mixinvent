"use client";

import {
  ClipboardCheck,
  FileSignature,
  HardDrive,
  LockKeyhole,
  Network,
  ShieldCheck,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DELIVERY_CHECKLIST_ITEM_IDS,
  DELIVERY_CHECKLIST_LABELS,
  type DeliveryChecklistItemId,
  type DeliveryChecklistState,
} from "@/lib/delivery-checklist";

const ICONS: Record<DeliveryChecklistItemId, React.ReactNode> = {
  padraoFormatacao: <HardDrive className="size-4 text-muted-foreground" aria-hidden />,
  ingressadoDominio: <Network className="size-4 text-muted-foreground" aria-hidden />,
  antivirusEdr: <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />,
  bitlocker: <LockKeyhole className="size-4 text-muted-foreground" aria-hidden />,
  termoResponsabilidade: <FileSignature className="size-4 text-muted-foreground" aria-hidden />,
};

export type DeliveryChecklistProps = {
  value: DeliveryChecklistState;
  onChange: (next: DeliveryChecklistState) => void;
  disabled?: boolean;
  className?: string;
};

export function DeliveryChecklist({ value, onChange, disabled, className }: DeliveryChecklistProps) {
  const setItem = (id: DeliveryChecklistItemId, checked: boolean) => {
    onChange({ ...value, [id]: checked });
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/50 p-4 shadow-sm ring-1 ring-foreground/5",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold leading-tight">Auditoria de entrega (obrigatória)</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            Para concluir o checkout, confirme que todos os itens de conformidade foram atendidos. O
            resultado fica registrado no histórico do equipamento.
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {DELIVERY_CHECKLIST_ITEM_IDS.map((id) => {
          const inputId = `delivery-check-${id}`;
          return (
            <li key={id}>
              <div className="flex items-start gap-3">
                <Checkbox
                  id={inputId}
                  checked={value[id]}
                  disabled={disabled}
                  onCheckedChange={(c) => setItem(id, c)}
                  className="mt-0.5"
                />
                <div className="flex min-w-0 flex-1 gap-2">
                  <span className="mt-0.5 shrink-0">{ICONS[id]}</span>
                  <Label
                    htmlFor={inputId}
                    className="cursor-pointer text-sm leading-snug font-normal text-foreground"
                  >
                    {DELIVERY_CHECKLIST_LABELS[id]}
                  </Label>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
