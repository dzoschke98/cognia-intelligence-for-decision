import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, setAgendaStatus } from "@/lib/cognia/store";
import { labelForAgendaOrigin } from "@/lib/cognia/operationsMock";
import { fmtDate } from "@/lib/cognia/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { RiskBadge } from "@/components/cognia/Badges";
import { toast } from "sonner";

export const Route = createFileRoute("/general-agenda")({
  head: () => ({ meta: [{ title: "Agenda Geral — CognIA" }] }),
  component: () => <AppShell><Agenda /></AppShell>,
});

function Agenda() {
  const agenda = useStore((s) => s.agenda);
  const [view, setView] = useState("today");

  const now = new Date();
  const today = now.toDateString();
  const kpis = useMemo(() => {
    const inDays = (n: number) => agenda.filter((e) => {
      const d = new Date(e.date);
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= n;
    });
    return {
      todayCount: agenda.filter((e) => new Date(e.date).toDateString() === today).length,
      dueToday: agenda.filter((e) => new Date(e.date).toDateString() === today && e.type.startsWith("prazo")).length,
      next7: inDays(7).length,
      audiencias: agenda.filter((e) => e.type === "audiencia" && e.status !== "concluido").length,
      minutas: agenda.filter((e) => e.type === "revisao_minuta").length,
      validacoes: agenda.filter((e) => e.type === "validacao_ia").length,
      criticas: agenda.filter((e) => e.priority === "critico").length,
      tributarias: agenda.filter((e) => e.area === "tributario" && e.status !== "concluido").length,
      atRisk: agenda.filter((e) => e.atRisk).length,
    };
  }, [agenda, today]);

  const grouped = useMemo(() => {
    const buckets: Record<string, typeof agenda> = { Hoje: [], Amanhã: [], "Esta semana": [], "Próxima semana": [], Depois: [] };
    agenda.forEach((e) => {
      const d = new Date(e.date);
      const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (d.toDateString() === today) buckets.Hoje.push(e);
      else if (diff === 1) buckets.Amanhã.push(e);
      else if (diff > 1 && diff <= 6) buckets["Esta semana"].push(e);
      else if (diff > 6 && diff <= 13) buckets["Próxima semana"].push(e);
      else if (diff > 0) buckets.Depois.push(e);
    });
    return buckets;
  }, [agenda, today]);

  const critical = agenda.filter((e) => e.priority === "critico" || e.atRisk).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
          <CalendarDays className="h-3.5 w-3.5" /> Agenda operacional
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Agenda Geral</h1>
        <p className="text-sm text-muted-foreground">Prazos, audiências, movimentações, validações e ações críticas da operação.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Compromissos hoje" value={String(kpis.todayCount)} />
        <Kpi label="Prazos vencendo hoje" value={String(kpis.dueToday)} accent="text-warning" />
        <Kpi label="Próximos 7 dias" value={String(kpis.next7)} accent="text-cyan" />
        <Kpi label="Audiências" value={String(kpis.audiencias)} />
        <Kpi label="Minutas pendentes" value={String(kpis.minutas)} />
        <Kpi label="Validações pendentes" value={String(kpis.validacoes)} accent="text-warning" />
        <Kpi label="Movimentações críticas" value={String(kpis.criticas)} accent="text-risk" />
        <Kpi label="Ações tributárias" value={String(kpis.tributarias)} />
        <Kpi label="Prazos em risco" value={String(kpis.atRisk)} accent="text-risk" />
      </div>

      {critical.length > 0 && (
        <div className="glass-card border-risk/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-risk">
            <AlertTriangle className="h-4 w-4" /> Alertas críticos
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {critical.map((e) => (
              <li key={e.id}>• <span className="text-foreground">{e.title}</span> — {e.clientName} · {fmtDate(e.date)} {e.time}</li>
            ))}
          </ul>
        </div>
      )}

      <Tabs value={view} onValueChange={setView}>
        <TabsList className="bg-white/5">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="week">Próximos 7 dias</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-2">
          <div className="glass-card p-4">
            <h3 className="mb-2 text-sm font-semibold">O que vence hoje</h3>
            {grouped.Hoje.length === 0 && <div className="text-xs text-muted-foreground">Sem compromissos para hoje 🎉</div>}
            <ul className="divide-y divide-white/5">
              {grouped.Hoje.map((e) => <EventRow key={e.id} e={e} />)}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-3">
          {Object.entries(grouped).map(([k, list]) => (
            list.length > 0 && (
              <div key={k} className="glass-card p-4">
                <h3 className="mb-2 text-sm font-semibold">{k} <span className="text-xs text-muted-foreground">· {list.length}</span></h3>
                <ul className="divide-y divide-white/5">{list.map((e) => <EventRow key={e.id} e={e} />)}</ul>
              </div>
            )
          ))}
        </TabsContent>

        <TabsContent value="list">
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Evento</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-left">Responsável</th>
                  <th className="px-3 py-2 text-left">Origem</th>
                  <th className="px-3 py-2 text-center">Prioridade</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {agenda.map((e) => (
                  <tr key={e.id} className="hover:bg-white/5">
                    <td className="px-3 py-2">{e.title}</td>
                    <td className="px-3 py-2">{e.clientName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(e.date)} · {e.time}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.responsible}</td>
                    <td className="px-3 py-2 text-muted-foreground">{labelForAgendaOrigin(e.origin)}</td>
                    <td className="px-3 py-2 text-center"><RiskBadge risk={e.priority} /></td>
                    <td className="px-3 py-2 text-center text-[10px] uppercase text-muted-foreground">{e.status.replace("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid gap-3 md:grid-cols-4">
            {(["pendente", "em_andamento", "concluido", "atrasado"] as const).map((st) => (
              <div key={st} className="glass-card p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{st.replace("_", " ")}</h3>
                <div className="space-y-2">
                  {agenda.filter((e) => e.status === st).slice(0, 8).map((e) => (
                    <div key={e.id} className="rounded-md border border-white/5 bg-white/5 p-2 text-xs">
                      <div className="font-medium">{e.title}</div>
                      <div className="text-muted-foreground">{e.clientName} · {fmtDate(e.date)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventRow({ e }: { e: import("@/lib/cognia/types").AgendaEvent }) {
  return (
    <li className="flex items-center gap-3 py-2 text-xs">
      <Clock className="h-3.5 w-3.5 text-cyan" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{e.title}</div>
        <div className="text-muted-foreground">{e.clientName} · {e.time} · {labelForAgendaOrigin(e.origin)}</div>
      </div>
      <RiskBadge risk={e.priority} />
      <Button size="sm" variant="ghost" className="h-7 text-success" onClick={() => { setAgendaStatus(e.id, "concluido"); toast.success("Concluído"); }}>
        <CheckCircle2 className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-cyan" onClick={() => toast(e.suggestedAction)}>
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
}

function Kpi({ label, value, accent = "" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}
