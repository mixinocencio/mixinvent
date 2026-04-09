"use client";

import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tooltip acessível via hover/foco (CSS), para uso em métricas do dashboard.
 */
export function MetricHelp({
  label,
  className,
}: {
  /** Texto explicativo do indicador */
  label: string;
  className?: string;
}) {
  return (
    <span
      tabIndex={0}
      className={cn(
        "group relative inline-flex shrink-0 rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
        className,
      )}
    >
      <HelpCircle className="size-3.5 cursor-help" aria-hidden />
      <span className="sr-only">{label}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 hidden w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-left text-popover-foreground text-xs leading-relaxed shadow-md group-hover:block group-focus-visible:block"
      >
        {label}
      </span>
    </span>
  );
}
