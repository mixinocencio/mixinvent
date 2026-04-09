/**
 * Normaliza rótulos de tipo de equipamento (categoria / CSV / inventário) para buckets padrão.
 */

function capitalizeFirstLetter(original: string): string {
  const t = original.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * - Contém "laptop" ou "notebook" (case insensitive) → `"Notebook"`.
 * - Contém "desktop", "mini", "tower", "workstation" ou "pc" → `"Desktop"`.
 * - Caso contrário → nome original com a primeira letra maiúscula.
 */
export function normalizeAssetType(type: string): string {
  const raw = type.trim();
  if (!raw) return "";

  const lower = raw.toLowerCase();
  if (lower.includes("laptop") || lower.includes("notebook")) {
    return "Notebook";
  }
  if (
    lower.includes("desktop") ||
    lower.includes("mini") ||
    lower.includes("tower") ||
    lower.includes("workstation") ||
    lower.includes("pc")
  ) {
    return "Desktop";
  }

  return capitalizeFirstLetter(raw);
}
