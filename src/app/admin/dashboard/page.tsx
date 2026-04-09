import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getDashboardMetrics,
  type DashboardFiltersInput,
} from "./actions";
import { DashboardClient } from "./dashboard-client";

function pickSp(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  const raw = Array.isArray(v) ? v[0] : v;
  const t = raw?.trim();
  return t || undefined;
}

function parseDashboardFilters(
  sp: Record<string, string | string[] | undefined>,
): DashboardFiltersInput {
  return {
    companyId: pickSp(sp, "companyId"),
    departmentId: pickSp(sp, "departmentId"),
    startDate: pickSp(sp, "startDate"),
    endDate: pickSp(sp, "endDate"),
    brand: pickSp(sp, "brand"),
    obsUnidade: pickSp(sp, "obsUnidade"),
    obsDepartamento: pickSp(sp, "obsDepartamento"),
  };
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseDashboardFilters(sp);

  const [initial, companies, departments] = await Promise.all([
    getDashboardMetrics(filters),
    prisma.company.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.department.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex w-fit gap-1 px-0")}
      >
        <ArrowLeft className="size-4" />
        Voltar ao painel
      </Link>
      <DashboardClient
        initial={initial}
        companies={companies}
        departments={departments}
        currentFilters={filters}
      />
    </div>
  );
}
