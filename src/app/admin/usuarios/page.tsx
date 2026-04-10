import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminOperadoresTable } from "@/components/admin/admin-operadores-table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const operadores = await prisma.authUser.findMany({
    where: { role: "OPERATOR" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const rows = operadores.map((o) => ({
    id: o.id,
    name: o.name,
    email: o.email,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Operadores do sistema</h1>
        <p className="text-muted-foreground">
          Gerencie contas de acesso ao painel (perfil operador). Apenas administradores visualizam
          esta página.
        </p>
      </div>
      <AdminOperadoresTable data={rows} />
    </div>
  );
}
