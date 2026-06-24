import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore } from "@/lib/cognia/store";
import { RiskBadge } from "@/components/cognia/Badges";
import { Button } from "@/components/ui/button";
import { fmtBRL } from "@/lib/cognia/format";
import { Brain, AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/decision")({
  head: () => ({ meta: [{ title: "Decision Engine — CognIA" }] }),
  component: () => <AppShell><Decision /></AppShell>,
});

function Decision() {
  const decisions = useStore((s) => s.decisions);
  const navigate = useNavigate();
  const sorted = [...decisions].sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
          <Brain className="h-3.5 w-3.5" /> Decision Intelligence Engine V0
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Priorização executiva</h1>
        <p className="text-sm text-muted-foreground">Priorização inicial de riscos, oportunidades e ações recomendadas.</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-warning/20 bg-warning/5 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
        <span><b className="text-warning">A CognIA recomenda e prioriza.</b> A decisão final permanece com o especialista humano.</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {sorted.map((d) => (
            <div key={d.id} className="glass-card group p-4 transition hover:border-white/15">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-cyan">{d.origin === "Cross" ? "Cross Engine" : `${d.origin} Engine`}</span>
                    <span className="text-xs text-muted-foreground">· Prioridade {d.priorityScore}/100</span>
                  </div>
                  <h3 className="text-base font-semibold">{d.title}</h3>
                  <p className="text-sm text-muted-foreground">{d.recommendedAction}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <RiskBadge risk={d.urgency} />
                    <span className="text-muted-foreground">Responsável sugerido: <b className="text-foreground">{d.suggestedOwner}</b></span>
                    <span className="text-muted-foreground">· Status: {d.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Impacto</div>
                  <div className="text-xl font-semibold tabular-nums">{fmtBRL(d.financialImpact)}</div>
                  {d.originId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 text-cyan"
                      onClick={() => navigate({
                        to: d.origin === "Legal" ? "/legal/$id" : d.origin === "Tax" ? "/tax/$id" : "/dashboard",
                        params: { id: d.originId! },
                      })}
                    >
                      Ver origem <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card h-fit p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan">Matriz impacto × urgência</h3>
          <Matrix decisions={sorted} />
        </div>
      </div>
    </div>
  );
}

function Matrix({ decisions }: { decisions: any[] }) {
  const urgencyMap: Record<string, number> = { baixo: 0, medio: 1, alto: 2, critico: 3 };
  return (
    <div className="relative h-64 w-full rounded-md border border-white/10 bg-gradient-to-br from-background to-card p-3">
      <div className="absolute inset-3 grid grid-cols-4 grid-rows-4 gap-0.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="rounded bg-white/[0.03]" />
        ))}
      </div>
      {decisions.map((d) => {
        const urgencyIdx = urgencyMap[d.urgency] ?? 1;
        const impactBucket = Math.min(3, Math.floor(d.financialImpact / 120000));
        const left = urgencyIdx * 25 + 6;
        const top = 100 - impactBucket * 25 - 12;
        return (
          <div key={d.id}
            title={d.title}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan to-primary ring-2 ring-cyan/30"
            style={{ left: `${left}%`, top: `${top}%` }}
          />
        );
      })}
      <div className="absolute bottom-1 left-3 right-3 flex justify-between text-[10px] text-muted-foreground">
        <span>Baixa</span><span>Média</span><span>Alta</span><span>Crítica</span>
      </div>
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground">Impacto →</div>
    </div>
  );
}
