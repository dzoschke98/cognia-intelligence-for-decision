import { cn } from "@/lib/utils";
import type { RiskLevel, ValidationStatus } from "@/lib/cognia/types";

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  const map: Record<RiskLevel, string> = {
    baixo: "bg-success/15 text-success border-success/30",
    medio: "bg-warning/15 text-warning border-warning/30",
    alto: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    critico: "bg-risk/15 text-risk border-risk/40",
  };
  const labels: Record<RiskLevel, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto", critico: "Crítico" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", map[risk], className)}>
      {labels[risk]}
    </span>
  );
}

export function StatusBadge({ status }: { status: ValidationStatus }) {
  const map: Record<ValidationStatus, string> = {
    pendente: "bg-warning/15 text-warning border-warning/30",
    aprovado: "bg-success/15 text-success border-success/30",
    corrigido: "bg-cyan/15 text-cyan border-cyan/30",
    rejeitado: "bg-risk/15 text-risk border-risk/40",
  };
  const labels: Record<ValidationStatus, string> = {
    pendente: "Pendente", aprovado: "Aprovado", corrigido: "Corrigido", rejeitado: "Rejeitado",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", map[status])}>
      {labels[status]}
    </span>
  );
}

export function ConfidenceIndicator({ value }: { value: number }) {
  const tone = value >= 85 ? "text-success" : value >= 70 ? "text-cyan" : "text-warning";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", value >= 85 ? "bg-success" : value >= 70 ? "bg-cyan" : "bg-warning")} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", tone)}>{value}%</span>
    </div>
  );
}

export function EngineVersionBadge({ version, hash }: { version: string; hash?: string }) {
  return (
    <div className="inline-flex flex-col gap-0.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-muted-foreground">
      <span className="text-cyan">{version}</span>
      {hash && <span className="opacity-60">prompt: {hash}</span>}
    </div>
  );
}
