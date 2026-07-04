import { Link } from "@tanstack/react-router";
import { useStore, currentUser } from "@/lib/cognia/store";
import { RefreshCw, CalendarDays, PenSquare, ListTodo, ArrowUpRight, Sparkles } from "lucide-react";

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function OperationsWidgets() {
  const sources = useStore((s) => s.sources);
  const movements = useStore((s) => s.movements);
  const agenda = useStore((s) => s.agenda);
  const drafts = useStore((s) => s.drafts);
  const workQueue = useStore((s) => s.workQueue);
  const pendings = useStore((s) => s.pendings);
  const isAdmin = currentUser()?.role === "Administrador";

  const newMovs = movements.filter((m) => m.status === "novo").length;
  const activeSources = sources.filter((s) => s.status === "ativo" || s.status === "mockado").length;
  const todayAgenda = agenda.filter((a) => isToday(a.date) && a.status !== "concluido").length;
  const atRisk = agenda.filter((a) => a.atRisk).length;
  const inReview = drafts.filter((d) => d.status === "em_revisao" || d.status === "rascunho").length;
  const openQueue = workQueue.filter((w) => w.status === "aberta" || w.status === "em_andamento").length;
  const criticalQueue = workQueue.filter((w) => w.priority === "critico" || w.priority === "alto").length;
  const iaSuggestions = pendings.filter((p) => p.status === "pendente").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cyan" />
        <h2 className="text-lg font-semibold">Operação inteligente</h2>
        <span className="text-xs text-muted-foreground">— módulos ativos da CognIA</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin && (
          <WidgetCard
            to="/admin/process-update-engine"
            icon={RefreshCw}
            title="Motor Atualizador"
            metric={String(newMovs)}
            metricLabel="movimentações novas"
            hint={`${activeSources} fontes ativas`}
            accent="from-cyan/40 to-primary/40"
          />
        )}
        <WidgetCard
          to="/general-agenda"
          icon={CalendarDays}
          title="Agenda Geral"
          metric={String(todayAgenda)}
          metricLabel="vencem hoje"
          hint={atRisk > 0 ? `${atRisk} em risco` : "Sem itens em risco"}
          hintTone={atRisk > 0 ? "risk" : "success"}
          accent="from-warning/40 to-orange-500/40"
        />
        <WidgetCard
          to="/legal-drafts"
          icon={PenSquare}
          title="Gera Minutas"
          metric={String(inReview)}
          metricLabel="minutas em revisão"
          hint={`${drafts.length} totais`}
          accent="from-purple/40 to-primary/40"
        />
        <WidgetCard
          to="/work-queue"
          icon={ListTodo}
          title="Central de Pendências"
          metric={String(openQueue)}
          metricLabel="pendências abertas"
          hint={criticalQueue > 0 ? `${criticalQueue} críticas/altas` : "Nenhuma prioridade alta"}
          hintTone={criticalQueue > 0 ? "risk" : "success"}
          accent="from-risk/40 to-purple/40"
        />
      </div>
      {iaSuggestions > 0 && (
        <Link
          to="/jurimetry"
          className="glass-card group flex flex-wrap items-center justify-between gap-3 border-cyan/30 p-4 transition hover:border-cyan/60"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-cyan/30 to-purple/30 text-cyan">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Sugestões da IA aguardando validação</div>
              <div className="text-xs text-muted-foreground">
                {iaSuggestions} sugestões da Jurimetria prontas para aprovação humana.
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-cyan group-hover:underline">
            Revisar sugestões <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}
    </div>
  );
}

function WidgetCard({
  to, icon: Icon, title, metric, metricLabel, hint, hintTone = "muted", accent,
}: {
  to: string; icon: React.ElementType; title: string; metric: string; metricLabel: string;
  hint: string; hintTone?: "muted" | "risk" | "success"; accent: string;
}) {
  const toneClass =
    hintTone === "risk" ? "text-risk" : hintTone === "success" ? "text-success" : "text-muted-foreground";
  return (
    <Link
      to={to}
      className="glass-card group relative overflow-hidden p-4 transition hover:border-white/20"
    >
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-25 blur-2xl transition group-hover:opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-cyan" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{metric}</span>
          <span className="text-xs text-muted-foreground">{metricLabel}</span>
        </div>
        <div className={`mt-2 text-[11px] ${toneClass}`}>{hint}</div>
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-cyan opacity-0 transition group-hover:opacity-100">
          Abrir módulo <ArrowUpRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}
