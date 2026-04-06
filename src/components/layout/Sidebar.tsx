"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Monitor,
  Package,
  Settings,
  Users,
  Building2,
  Tags,
  History,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
  );

export function Sidebar() {
  const pathname = usePathname();
  const [cadastrosOpen, setCadastrosOpen] = useState(
    ["/colaboradores", "/departamentos", "/categorias"].some((p) => pathname.startsWith(p)),
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          MixInvent
        </Link>
        <p className="text-xs text-muted-foreground">Gestão de ativos de TI</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <Link href="/" className={navLinkClass(pathname === "/")}>
          <LayoutDashboard className="size-4 shrink-0" />
          Painel
        </Link>
        <Link href="/equipamentos" className={navLinkClass(pathname.startsWith("/equipamentos"))}>
          <Monitor className="size-4 shrink-0" />
          Equipamentos
        </Link>
        <Link href="/insumos" className={navLinkClass(pathname.startsWith("/insumos"))}>
          <Package className="size-4 shrink-0" />
          Insumos
        </Link>
        <Link href="/movimentacoes" className={navLinkClass(pathname.startsWith("/movimentacoes"))}>
          <History className="size-4 shrink-0" />
          Movimentações
        </Link>
        <Link
          href="/relatorios/auditoria"
          className={navLinkClass(pathname.startsWith("/relatorios/auditoria"))}
        >
          <FileSpreadsheet className="size-4 shrink-0" />
          Auditoria
        </Link>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setCadastrosOpen((o) => !o)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              cadastrosOpen
                ? "bg-sidebar-accent/60 text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80",
            )}
          >
            <Settings className="size-4 shrink-0" />
            <span className="flex-1 text-left">Cadastros</span>
            {cadastrosOpen ? (
              <ChevronDown className="size-4 shrink-0 opacity-70" />
            ) : (
              <ChevronRight className="size-4 shrink-0 opacity-70" />
            )}
          </button>
          {cadastrosOpen && (
            <div className="mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3 ml-3">
              <Link
                href="/colaboradores"
                className={cn(navLinkClass(pathname.startsWith("/colaboradores")), "py-1.5")}
              >
                <Users className="size-4 shrink-0" />
                Colaboradores
              </Link>
              <Link
                href="/departamentos"
                className={cn(navLinkClass(pathname.startsWith("/departamentos")), "py-1.5")}
              >
                <Building2 className="size-4 shrink-0" />
                Departamentos
              </Link>
              <Link
                href="/categorias"
                className={cn(navLinkClass(pathname.startsWith("/categorias")), "py-1.5")}
              >
                <Tags className="size-4 shrink-0" />
                Categorias
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
