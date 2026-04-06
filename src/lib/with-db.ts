import { isPrismaAppBlockedError } from "@/lib/is-prisma-app-blocked";

export type WithDbResult<T> = { ok: true; data: T } | { ok: false };

export async function withDb<T>(fn: () => Promise<T>): Promise<WithDbResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (isPrismaAppBlockedError(e)) return { ok: false };
    throw e;
  }
}
