"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export type SearchInputProps = {
  placeholder?: string;
  className?: string;
  /** Nome do parâmetro na query string (padrão: `q`). */
  paramName?: string;
  delayMs?: number;
};

export function SearchInput({
  placeholder = "Buscar…",
  className,
  paramName = "q",
  delayMs = 300,
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qFromUrl = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(qFromUrl);
  const debounced = useDebounce(value, delayMs);

  const pending = value.trim() !== debounced.trim();

  useEffect(() => {
    setValue(qFromUrl);
  }, [qFromUrl]);

  const pushQuery = useCallback(
    (nextQ: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = nextQ.trim();
      if (trimmed) {
        params.set(paramName, trimmed);
      } else {
        params.delete(paramName);
      }
      if (params.has("page")) {
        params.set("page", "1");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [paramName, pathname, router, searchParams],
  );

  // Só reage a `debounced` — se `searchParams` estivesse nas deps, após "Limpar" o URL mudaria
  // mas o debounce antigo reaplicaria `q` antes do timeout zerar.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const current = (params.get(paramName) ?? "").trim();
    if (debounced.trim() === current) return;
    if (debounced.trim()) {
      params.set(paramName, debounced.trim());
    } else {
      params.delete(paramName);
    }
    if (params.has("page")) {
      params.set("page", "1");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sincronizar apenas quando o debounce muda
  }, [debounced, paramName, pathname, router]);

  const clear = () => {
    setValue("");
    pushQuery("");
  };

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "h-9 w-full rounded-lg border border-input bg-transparent py-1 pr-20 pl-9 text-sm transition-colors outline-none",
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "dark:bg-input/30",
        )}
        aria-label={placeholder}
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {pending && (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        )}
        {!pending && value.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
