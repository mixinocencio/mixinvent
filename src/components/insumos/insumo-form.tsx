"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createConsumable, updateConsumable } from "@/app/insumos/actions";
import { consumableInputSchema } from "@/app/insumos/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  looseControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CategoriaInsumoOption = { id: string; nome: string };

export type InsumoFormEditing = {
  id: string;
  nome: string;
  categoryId: string;
  quantidadeEstoque: number;
  estoqueMinimo: number;
};

const defaultValues = {
  nome: "",
  categoryId: "",
  quantidadeEstoque: 0,
  estoqueMinimo: 0,
};

export function InsumoFormDialog({
  open,
  onOpenChange,
  categorias,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: CategoriaInsumoOption[];
  editing: InsumoFormEditing | null;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(consumableInputSchema),
    defaultValues,
  });
  const control = looseControl(form.control);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        nome: editing.nome,
        categoryId: editing.categoryId,
        quantidadeEstoque: editing.quantidadeEstoque,
        estoqueMinimo: editing.estoqueMinimo,
      });
    } else {
      form.reset({
        ...defaultValues,
        categoryId: categorias[0]?.id ?? "",
      });
    }
  }, [open, editing, categorias, form]);

  const isEdit = Boolean(editing);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar insumo" : "Novo insumo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              startTransition(async () => {
                const r = isEdit
                  ? await updateConsumable(editing!.id, values)
                  : await createConsumable(values);
                if (r.error) toast.error(r.error);
                else {
                  toast.success(isEdit ? "Insumo atualizado." : "Insumo cadastrado.");
                  onOpenChange(false);
                }
              });
            })}
          >
            <FormField
              control={control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Cabo HDMI 2m" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={categorias.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            categorias.length === 0
                              ? "Cadastre uma categoria Insumo"
                              : "Selecione"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="quantidadeEstoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade em estoque *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        {...field}
                        value={field.value === undefined || field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? 0 : Number(v));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="estoqueMinimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque mínimo *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        {...field}
                        value={field.value === undefined || field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? 0 : Number(v));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || categorias.length === 0}>
                {pending ? "Salvando…" : isEdit ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function NovoInsumoButton({ categorias }: { categorias: CategoriaInsumoOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Novo Insumo
      </Button>
      <InsumoFormDialog open={open} onOpenChange={setOpen} categorias={categorias} editing={null} />
    </>
  );
}
