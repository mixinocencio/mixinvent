"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("E-mail ou senha inválidos.");
        return;
      }
      toast.success("Bem-vindo de volta.");
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-6 shadow-xl backdrop-blur-md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-primary-foreground">
            E-mail
          </Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 border-primary-foreground/25 bg-primary-foreground/95 text-foreground placeholder:text-muted-foreground focus-visible:border-ebeg-orange focus-visible:ring-ebeg-orange/40"
            placeholder="seu-email@ebeg.com.br"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password" className="text-primary-foreground">
            Senha
          </Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 border-primary-foreground/25 bg-primary-foreground/95 text-foreground placeholder:text-muted-foreground focus-visible:border-ebeg-orange focus-visible:ring-ebeg-orange/40"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="mt-6 h-10 w-full bg-ebeg-orange text-primary-foreground hover:bg-ebeg-orange/90 focus-visible:ring-ebeg-orange"
      >
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
