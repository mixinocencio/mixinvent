/** Lê campo de FormData como string (uploads retornam File — aqui ignoramos). */
export function fdStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  if (v == null) return "";
  return typeof v === "string" ? v : "";
}
