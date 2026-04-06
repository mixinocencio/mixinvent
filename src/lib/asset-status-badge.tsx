import { AssetStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const labels: Record<AssetStatus, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em uso",
  MANUTENCAO: "Manutenção",
  SUCATA: "Sucata",
};

const variants: Record<AssetStatus, string> = {
  DISPONIVEL: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  EM_USO: "border-blue-600/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  MANUTENCAO: "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  SUCATA: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", variants[status])}>
      {labels[status]}
    </Badge>
  );
}
