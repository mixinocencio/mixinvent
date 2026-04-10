/**
 * Proteção global: usuários não autenticados só acessam `/login` e ativos estáticos.
 * Rotas `/api/auth/*` são liberadas em `authorized` (Auth.js).
 */
export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
