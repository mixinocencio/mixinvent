"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSupplier, updateSupplier } from "@/app/fornecedores/actions";
import { supplierUpdatePayloadSchema } from "@/app/fornecedores/schema";
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
import { emptySupplierFormDefaults, SupplierFormBody } from "./supplier-form";
import { normalizeCnpjDigits } from "@/lib/cnpj-valid";

export type SupplierRow = {
  id: string;
  name: string;
  cnpj: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  _count?: { purchaseOrders: number };
};

function rowToFormValues(item: SupplierRow) {
  return {
    name: item.name,
    cnpj: normalizeCnpjDigits(item.cnpj),
    contactEmail: item.contactEmail ?? "",
    phone: item.phone ?? "",
    address: item.address ?? "",
  };
}

export function SupplierRowActions({ item }: { item: SupplierRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(supplierUpdatePayloadSchema),
    defaultValues: emptySupplierFormDefaults,
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                startTransition(async () => {
                  const r = await updateSupplier(item.id, values);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Fornecedor atualizado.");
                    setEditOpen(false);
                  }
                });
              })}
            >
              <DialogHeader>
                <DialogTitle>Editar fornecedor</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <SupplierFormBody control={form.control} />
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
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O fornecedor{" "}
              <span className="font-medium text-foreground">{item.name}</span> será removido
              permanentemente, desde que não existam notas fiscais vinculadas.
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
                  const r = await deleteSupplier(item.id);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Fornecedor excluído.");
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
