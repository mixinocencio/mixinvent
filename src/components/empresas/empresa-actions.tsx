"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEmpresa, updateEmpresa } from "@/app/empresas/actions";
import { empresaUpdatePayloadSchema } from "@/app/empresas/schema";
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { emptyEmpresaFormDefaults, EmpresaFormBody } from "./empresa-form";

export type EmpresaRow = {
  id: string;
  nome: string;
  cnpj: string | null;
  emailContato: string | null;
  telefone: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
};

function rowToFormValues(item: EmpresaRow) {
  return {
    nome: item.nome,
    cnpj: item.cnpj?.replace(/\D/g, "") ?? "",
    emailContato: item.emailContato ?? "",
    telefone: item.telefone ?? "",
    cep: item.cep?.replace(/\D/g, "") ?? "",
    rua: item.rua ?? "",
    numero: item.numero ?? "",
    complemento: item.complemento ?? "",
    bairro: item.bairro ?? "",
    cidade: item.cidade ?? "",
    estado: item.estado ?? "",
  };
}

export function EmpresaRowActions({ item }: { item: EmpresaRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(empresaUpdatePayloadSchema),
    defaultValues: emptyEmpresaFormDefaults,
  });

  useEffect(() => {
    if (editOpen) {
      form.reset(rowToFormValues(item));
    }
  }, [editOpen, item, form]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <MoreVertical className="size-4" />
          <span className="sr-only">Ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                startTransition(async () => {
                  const r = await updateEmpresa(item.id, values);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Empresa atualizada.");
                    setEditOpen(false);
                  }
                });
              })}
            >
              <DialogHeader>
                <DialogTitle>Editar empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <EmpresaFormBody control={form.control} />
              </div>
              <DialogFooter>
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
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A empresa{" "}
              <span className="font-medium text-foreground">{item.nome}</span> será removida
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const r = await deleteEmpresa(item.id);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Empresa excluída.");
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
