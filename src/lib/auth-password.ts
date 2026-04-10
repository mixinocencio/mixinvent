import argon2 from "argon2";

/** Parâmetros alinhados às recomendações OWASP para Argon2id (memória moderada, custo de tempo 3). */
const hashOptions: argon2.Options & { type: typeof argon2.argon2id } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

export async function hashAuthPassword(plain: string): Promise<string> {
  return argon2.hash(plain, hashOptions);
}

export async function verifyAuthPassword(hashStr: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hashStr, plain);
  } catch {
    return false;
  }
}
