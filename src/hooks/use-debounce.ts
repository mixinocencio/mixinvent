"use client";

import { useEffect, useState } from "react";

/**
 * Retorna `value` após `delay` ms sem novas alterações — útil para sincronizar URL ou API.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
