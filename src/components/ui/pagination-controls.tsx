"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  className?: string;
};

/**
 * Anterior / Próximo mantendo `q`, `status` e demais query params.
 */
export function PaginationControls({ currentPage, totalPages, className }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (next: number) => {
    const p = new URLSearchParams(searchParams.toString());
    if (next <= 1) {
      p.delete("page");
    } else {
      p.set("page", String(next));
    }
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="text-muted-foreground text-sm">
        Página <span className="font-medium text-foreground">{currentPage}</span> de{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!canPrev} onClick={() => goToPage(currentPage - 1)}>
          Anterior
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!canNext} onClick={() => goToPage(currentPage + 1)}>
          Próximo
        </Button>
      </div>
    </div>
  );
}
