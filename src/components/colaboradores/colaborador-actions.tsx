"use client";

import { UserStatus } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { deleteUser, updateUser } from "@/app/colaboradores/actions";
import { colaboradorInputSchema } from "@/app/colaboradores/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  ColaboradorFormFields,
  type ColaboradorFormValues,
  type DepartamentoOption,
  type EmpresaOption,
} from "./colaborador-form";

export type ColaboradorRow = {
  id: string;
  nome: string;
  email: string;
  samAccountName: string | null;
  userPrincipalName: string | null;
  cargo: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  licencasO365: string | null;
  companyId: string | null;
  departamentoId: string | null;
  status: UserStatus;
  /** Opcional: exibido no diálogo de visualização e na listagem admin. */
  entraId?: string | null;
};

function formatStatus(s: UserStatus) {
  return s === "ATIVO" ? "Ativo" : "Inativo";
}

function ViewDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[7.5rem_1fr] sm:gap-x-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium break-words">{value || "—"}</dd>
    </div>
  );
}

function toFormValues(u: ColaboradorRow): ColaboradorFormValues {
  return {
    nome: u.nome,
    email: u.email,
    samAccountName: u.samAccountName ?? "",
    userPrincipalName: u.userPrincipalName ?? "",
    cargo: u.cargo ?? "",
    telefone: u.telefone ?? "",
    cidade: u.cidade ?? "",
    estado: u.estado ?? "",
    licencasO365: u.licencasO365 ?? "",
    companyId: u.companyId ?? "",
    departamentoId: u.departamentoId ?? "",
    status: u.status,
  };
}

export function ColaboradorRowActions({
  item,
  empresas,
  departamentos,
}: {
  item: ColaboradorRow;
  empresas: EmpresaOption[];
  departamentos: DepartamentoOption[];
}) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const empresaNome = item.companyId
    ? (empresas.find((e) => e.id === item.companyId)?.nome ?? "—")
    : "—";
  const departamentoNome = item.departamentoId
    ? (departamentos.find((d) => d.id === item.departamentoId)?.nome ?? "—")
    : "—";

  const copyEmail = () => {
    void navigator.clipboard.writeText(item.email).then(
      () => toast.success("E-mail copiado."),
      () => toast.error("Não foi possível copiar o e-mail."),
    );
  };

  const form = useForm({
    resolver: zodResolver(colaboradorInputSchema),
    defaultValues: toFormValues(item),
  });

  useEffect(() => {
    if (editOpen) {
      form.reset(toFormValues(item));
    }
  }, [editOpen, item, form]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Abrir menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setViewOpen(true)}>
              <Eye className="size-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyEmail}>
              <Copy className="size-4" />
              Copiar e-mail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Visualizar colaborador</DialogTitle>
          </DialogHeader>
          <dl className="space-y-3">
            <ViewDetailRow label="Nome" value={item.nome} />
            <ViewDetailRow label="E-mail" value={item.email} />
            {item.entraId != null && item.entraId !== "" ? (
              <ViewDetailRow label="Entra ID" value={item.entraId} />
            ) : null}
            <ViewDetailRow label="SamAccountName" value={item.samAccountName ?? ""} />
            <ViewDetailRow label="UPN" value={item.userPrincipalName ?? ""} />
            <ViewDetailRow label="Cargo" value={item.cargo ?? ""} />
            <ViewDetailRow label="Telefone" value={item.telefone ?? ""} />
            <ViewDetailRow label="Cidade" value={item.cidade ?? ""} />
            <ViewDetailRow label="Estado" value={item.estado ?? ""} />
            <ViewDetailRow label="Licenças O365" value={item.licencasO365 ?? ""} />
            <ViewDetailRow label="Empresa" value={empresaNome} />
            <ViewDetailRow label="Departamento" value={departamentoNome} />
            <ViewDetailRow label="Status" value={formatStatus(item.status)} />
          </dl>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => {
                startTransition(async () => {
                  const r = await updateUser(item.id, values);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Colaborador atualizado.");
                    setEditOpen(false);
                  }
                });
              })}
            >
              <ColaboradorFormFields control={form.control} empresas={empresas} departamentos={departamentos} />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Salvando…" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro de <strong>{item.nome}</strong> será removido
              permanentemente, desde que não existam vínculos com equipamentos ou logs de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const r = await deleteUser(item.id);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Colaborador excluído.");
                    setDeleteOpen(false);
                  }
                });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
