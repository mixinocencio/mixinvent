import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar — MixInvent",
  description: "Acesso ao painel MixInvent",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-primary px-4 py-10">
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-ebeg-orange/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-ebeg-orange/15 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-primary-foreground">
            MixInvent
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Gestão de ativos de TI — Grupo EBEG
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
