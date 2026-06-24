import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/cognia/AppShell";
import { Button } from "@/components/ui/button";
import { FileDown, FileBarChart, Scale, Receipt, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Relatórios — CognIA" }] }),
  component: () => <AppShell><Reports /></AppShell>,
});

const reports = [
  { id: "r1", title: "Relatório Jurídico Executivo", icon: Scale, summary: "Síntese de exposição, riscos e recomendações jurídicas.", owner: "Renata Almeida", date: "23/06/2026", kpis: [{ k: "Processos", v: "8" }, { k: "Risco consolidado", v: "R$ 542k" }, { k: "Confiança média", v: "82%" }] },
  { id: "r2", title: "Relatório Tributário Executivo", icon: Receipt, summary: "Inconsistências e oportunidades fiscais consolidadas.", owner: "Nathan Endrigo", date: "23/06/2026", kpis: [{ k: "Diagnósticos", v: "8" }, { k: "Oportunidades", v: "R$ 1.12M" }, { k: "Confiança média", v: "82%" }] },
  { id: "r3", title: "Relatório Integrado CFO", icon: FileBarChart, summary: "Visão consolidada para o CFO — risco + oportunidade.", owner: "Mariana Costa", date: "22/06/2026", kpis: [{ k: "Impacto total", v: "R$ 1.66M" }, { k: "Recomendações", v: "10" }, { k: "Score consolidado", v: "73" }] },
  { id: "r4", title: "Relatório de Validações", icon: CheckCircle2, summary: "Status e SLA de validações humanas em andamento.", owner: "Davi Fadel", date: "23/06/2026", kpis: [{ k: "Pendentes", v: "10" }, { k: "Aprovadas", v: "2" }, { k: "Rejeitadas", v: "1" }] },
  { id: "r5", title: "Relatório de Riscos e Oportunidades", icon: TrendingUp, summary: "Matriz de impacto x urgência priorizada.", owner: "Delmer Zoschke", date: "22/06/2026", kpis: [{ k: "Críticos", v: "2" }, { k: "Altos", v: "5" }, { k: "Cross", v: "2" }] },
];

function Reports() {
  function gen() {
    toast.success("Relatório gerado com sucesso", { description: "PDF mockado disponível para download." });
  }
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-cyan">Relatórios Executivos</div>
        <h1 className="text-3xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Visualize, gere e distribua relatórios executivos da CognIA.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {reports.map((r) => (
          <div key={r.id} className="glass-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-to-br from-primary/30 to-purple/30 text-cyan">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.summary}</p>
                </div>
              </div>
              <Button size="sm" onClick={gen} className="bg-gradient-to-r from-primary to-purple text-white">
                <FileDown className="mr-1.5 h-3.5 w-3.5" /> Gerar PDF
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {r.kpis.map((k) => (
                <div key={k.k} className="rounded-md border border-white/5 bg-white/5 p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.k}</div>
                  <div className="text-sm font-semibold">{k.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>Responsável: {r.owner}</span>
              <span>{r.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
