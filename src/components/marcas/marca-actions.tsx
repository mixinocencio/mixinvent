"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  looseControl,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { deleteMarca, updateMarca } from "@/app/marcas/actions";
import { marcaUpdatePayloadSchema } from "@/app/marcas/schema";

export type MarcaRow = {
  id: string;
  nome: string;
  site: string | null;
  telefoneSuporte: string | null;
  emailSuporte: string | null;
};

export function MarcaRowActions({ item }: { item: MarcaRow }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(marcaUpdatePayloadSchema),
    defaultValues: {
      nome: "",
      site: "",
      telefoneSuporte: "",
      emailSuporte: "",
    },
  });
  const control = looseControl(form.control);

  useEffect(() => {
    if (editOpen) {
      form.reset({
        nome: item.nome,
        site: item.site ?? "",
        telefoneSuporte: item.telefoneSuporte ?? "",
        emailSuporte: item.emailSuporte ?? "",
      });
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
                  const r = await updateMarca(item.id, values);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Marca atualizada.");
                    setEditOpen(false);
                  }
                });
              })}
            >
              <DialogHeader>
                <DialogTitle>Editar marca</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="site"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Site</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="telefoneSuporte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone suporte</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="emailSuporte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail suporte</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            <AlertDialogTitle>Excluir marca?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A marca{" "}
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
                  const r = await deleteMarca(item.id);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Marca excluída.");
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
