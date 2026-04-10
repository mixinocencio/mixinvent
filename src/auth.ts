import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";

import type { Role } from "@prisma/client";

import { verifyAuthPassword } from "@/lib/auth-password";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email;
        const passwordRaw = credentials?.password;
        if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") return null;
        const email = emailRaw.trim().toLowerCase();
        if (!email || !passwordRaw) return null;

        const user = await prisma.authUser.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await verifyAuthPassword(user.passwordHash, passwordRaw);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.email = user.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role | undefined) ?? "OPERATOR";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/login")) {
        if (auth?.user) {
          return NextResponse.redirect(new URL("/", request.url));
        }
        return true;
      }

      if (pathname.startsWith("/api/auth")) return true;

      if (!auth?.user) return false;

      if (pathname.startsWith("/admin/usuarios")) {
        if (auth.user.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }

      return true;
    },
  },
});
