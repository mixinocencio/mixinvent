"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Package, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteConsumable } from "@/app/insumos/actions";
import { buttonVariants } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CategoriaInsumoOption, InsumoFormDialog, type InsumoFormEditing } from "./insumo-form";
import { InsumoMovimentacaoDialog } from "./insumo-movimentacao";

export type InsumoRow = {
  id: string;
  nome: string;
  categoryId: string;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  category: { nome: string };
};

function toEditing(item: InsumoRow): InsumoFormEditing {
  return {
    id: item.id,
    nome: item.nome,
    categoryId: item.categoryId,
    quantidadeEstoque: item.quantidadeEstoque,
    estoqueMinimo: item.estoqueMinimo,
  };
}

export function InsumoRowActions({
  item,
  categorias,
}: {
  item: InsumoRow;
  categorias: CategoriaInsumoOption[];
}) {
  const [movOpen, setMovOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

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
          <DropdownMenuItem onClick={() => setMovOpen(true)}>
            <Package className="size-4" />
            Movimentar estoque
          </DropdownMenuItem>
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

      <InsumoMovimentacaoDialog
        open={movOpen}
        onOpenChange={setMovOpen}
        insumoId={item.id}
        nome={item.nome}
        quantidadeAtual={item.quantidadeEstoque}
      />

      <InsumoFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categorias={categorias}
        editing={toEditing(item)}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir insumo?</AlertDialogTitle>
            <AlertDialogDescription>
              O item <span className="font-medium text-foreground">{item.nome}</span> será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const r = await deleteConsumable(item.id);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Insumo excluído.");
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
