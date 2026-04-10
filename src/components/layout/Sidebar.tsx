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
  Briefcase,
  Building,
  Copyright,
  MonitorSmartphone,
  Tags,
  Archive,
  History,
  FileSpreadsheet,
  Receipt,
  Truck,
  Settings2,
  Zap,
  RefreshCw,
  BarChart3,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
  );

const CADASTROS_PREFIXES = [
  "/colaboradores",
  "/empresas",
  "/departamentos",
  "/marcas",
  "/modelos",
  "/fornecedores",
  "/categorias",
  "/tipos-estoque",
] as const;

const ADMIN_PREFIXES = ["/admin"] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [cadastrosOpen, setCadastrosOpen] = useState(() =>
    CADASTROS_PREFIXES.some((p) => pathname.startsWith(p)),
  );
  const [adminOpen, setAdminOpen] = useState(() =>
    ADMIN_PREFIXES.some((p) => pathname.startsWith(p)),
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
        <Link href="/compras/nova" className={navLinkClass(pathname.startsWith("/compras"))}>
          <Receipt className="size-4 shrink-0" />
          Compras
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
                Usuários
              </Link>
              <Link
                href="/empresas"
                className={cn(navLinkClass(pathname.startsWith("/empresas")), "py-1.5")}
              >
                <Briefcase className="size-4 shrink-0" />
                Empresas
              </Link>
              <Link
                href="/departamentos"
                className={cn(navLinkClass(pathname.startsWith("/departamentos")), "py-1.5")}
              >
                <Building className="size-4 shrink-0" />
                Departamentos
              </Link>
              <Link
                href="/marcas"
                className={cn(navLinkClass(pathname.startsWith("/marcas")), "py-1.5")}
              >
                <Copyright className="size-4 shrink-0" />
                Marcas
              </Link>
              <Link
                href="/modelos"
                className={cn(navLinkClass(pathname.startsWith("/modelos")), "py-1.5")}
              >
                <MonitorSmartphone className="size-4 shrink-0" />
                Modelos
              </Link>
              <Link
                href="/fornecedores"
                className={cn(navLinkClass(pathname.startsWith("/fornecedores")), "py-1.5")}
              >
                <Truck className="size-4 shrink-0" />
                Fornecedores
              </Link>
              <Link
                href="/categorias"
                className={cn(navLinkClass(pathname.startsWith("/categorias")), "py-1.5")}
              >
                <Tags className="size-4 shrink-0" />
                Tipos/Categorias
              </Link>
              <Link
                href="/tipos-estoque"
                className={cn(navLinkClass(pathname.startsWith("/tipos-estoque")), "py-1.5")}
              >
                <Archive className="size-4 shrink-0" />
                Tipos de Estoque
              </Link>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setAdminOpen((o) => !o)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              adminOpen
                ? "bg-sidebar-accent/60 text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80",
            )}
          >
            <Settings2 className="size-4 shrink-0" />
            <span className="flex-1 text-left">Administração</span>
            {adminOpen ? (
              <ChevronDown className="size-4 shrink-0 opacity-70" />
            ) : (
              <ChevronRight className="size-4 shrink-0 opacity-70" />
            )}
          </button>
          {adminOpen && (
            <div className="mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3 ml-3">
              <Link
                href="/admin/dashboard"
                className={cn(navLinkClass(pathname.startsWith("/admin/dashboard")), "py-1.5")}
              >
                <BarChart3 className="size-4 shrink-0" />
                Dashboard TI
              </Link>
              <Link
                href="/admin/colaboradores"
                className={cn(navLinkClass(pathname.startsWith("/admin/colaboradores")), "py-1.5")}
              >
                <Users className="size-4 shrink-0" />
                Colaboradores
              </Link>
              <Link
                href="/admin/auditoria"
                className={cn(navLinkClass(pathname.startsWith("/admin/auditoria")), "py-1.5")}
              >
                <UserX className="size-4 shrink-0" />
                Auditoria
              </Link>
              <Link
                href="/admin/integracoes"
                className={cn(navLinkClass(pathname.startsWith("/admin/integracoes")), "py-1.5")}
              >
                <Zap className="size-4 shrink-0" />
                Integrações
              </Link>
              <Link
                href="/admin/sync"
                className={cn(navLinkClass(pathname.startsWith("/admin/sync")), "py-1.5")}
              >
                <RefreshCw className="size-4 shrink-0" />
                Sincronização
              </Link>
              <Link
                href="/admin/importacao"
                className={cn(navLinkClass(pathname.startsWith("/admin/importacao")), "py-1.5")}
              >
                <FileSpreadsheet className="size-4 shrink-0" />
                Importação CSV
              </Link>
              <Link
                href="/admin/entradas"
                className={cn(navLinkClass(pathname.startsWith("/admin/entradas")), "py-1.5")}
              >
                <Receipt className="size-4 shrink-0" />
                Nova entrada (NF)
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
