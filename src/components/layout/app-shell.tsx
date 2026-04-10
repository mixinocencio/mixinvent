"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-h-screen flex-1 overflow-x-auto pl-56">
        <div className="mx-auto max-w-6xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
