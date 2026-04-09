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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { deleteModelo, updateModelo } from "@/app/modelos/actions";
import { modeloUpdatePayloadSchema } from "@/app/modelos/schema";
import type { MarcaOption } from "./modelo-form";

export type ModeloRow = {
  id: string;
  nome: string;
  brandId: string;
  partNumber: string | null;
  mesesGarantia: number | null;
  mesesDepreciacao: number | null;
  isSerialized: boolean;
  brand: { nome: string };
};

export function ModeloRowActions({
  item,
  marcas,
}: {
  item: ModeloRow;
  marcas: MarcaOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(modeloUpdatePayloadSchema),
    defaultValues: {
      nome: "",
      brandId: "",
      partNumber: "",
      mesesGarantia: "",
      mesesDepreciacao: "",
      isSerialized: "false" as const,
    },
  });
  const control = looseControl(form.control);

  useEffect(() => {
    if (editOpen) {
      form.reset({
        nome: item.nome,
        brandId: item.brandId,
        partNumber: item.partNumber ?? "",
        mesesGarantia: item.mesesGarantia != null ? String(item.mesesGarantia) : "",
        mesesDepreciacao: item.mesesDepreciacao != null ? String(item.mesesDepreciacao) : "",
        isSerialized: item.isSerialized ? "true" : "false",
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
                  const r = await updateModelo(item.id, values);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Modelo atualizado.");
                    setEditOpen(false);
                  }
                });
              })}
            >
              <DialogHeader>
                <DialogTitle>Editar modelo</DialogTitle>
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
                  name="brandId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Marca *</FormLabel>
                      <Select
                        value={field.value || null}
                        onValueChange={(v) => field.onChange(v ?? "")}
                        disabled={marcas.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full min-w-[12rem]">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {marcas.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="partNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Part number (PN)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="mesesGarantia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meses de garantia</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="mesesDepreciacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meses de depreciação</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="isSerialized"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Exige número de série na compra *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v as "true" | "false")}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full min-w-[12rem]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="false">Não</SelectItem>
                          <SelectItem value="true">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending || marcas.length === 0}>
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
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo{" "}
              <span className="font-medium text-foreground">{item.nome}</span> será removido
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
                  const r = await deleteModelo(item.id);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Modelo excluído.");
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
