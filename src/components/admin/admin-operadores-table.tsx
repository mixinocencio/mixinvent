"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { createAuthOperator } from "@/app/admin/usuarios/actions";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export type OperadorListRow = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
};

function NovoOperadorDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const r = await createAuthOperator({
        name: name.trim() || null,
        email: email.trim(),
        password,
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Operador criado.");
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-ebeg-orange text-primary-foreground hover:bg-ebeg-orange/90"
      >
        Novo operador
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>Novo operador</DialogTitle>
              <DialogDescription>
                O operador recebe acesso ao sistema com perfil padrão. A senha deve ter no mínimo 8
                caracteres.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="op-name">Nome (opcional)</Label>
                <Input
                  id="op-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-email">E-mail</Label>
                <Input
                  id="op-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-password">Senha</Label>
                <Input
                  id="op-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Criar operador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const columns: ColumnDef<OperadorListRow>[] = [
  {
    accessorKey: "name",
    meta: { label: "Nome" },
    header: "Nome",
    cell: ({ row }) => row.original.name ?? "—",
  },
  {
    accessorKey: "email",
    meta: { label: "E-mail" },
    header: "E-mail",
    cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    meta: { label: "Cadastro" },
    header: "Cadastro",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
  },
];

export function AdminOperadoresTable({ data }: { data: OperadorListRow[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Contas com perfil <span className="font-medium text-foreground">OPERATOR</span> que
          acessam o painel com e-mail e senha.
        </p>
        <NovoOperadorDialog />
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="email"
        searchPlaceholder="Buscar por e-mail ou nome…"
        emptyMessage="Nenhum operador encontrado."
        emptyDataMessage="Nenhum operador cadastrado. Use Novo operador para adicionar."
      />
    </div>
  );
}
