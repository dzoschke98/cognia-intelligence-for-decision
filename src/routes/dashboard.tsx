import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore } from "@/lib/cognia/store";
import { fmtBRL, relativeTime } from "@/lib/cognia/format";
import { RiskBadge } from "@/components/cognia/Badges";
import { RadarSection } from "@/components/cognia/RadarSection";
import {
  FileText, AlertTriangle, TrendingUp, CheckCircle2, BellRing,
  ShieldCheck, Coins, Timer, ArrowUpRight, Sparkles,
  XCircle, Pencil, Upload, Activity,
} from "lucide-react";
import type { LegalAnalysis, TaxAnalysis } from "@/lib/cognia/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CognIA" }] }),
  component: () => <AppShell><Dashboard /></AppShell>,
});

function Dashboard() {
  const legal = useStore((s) => s.legal);
  const tax = useStore((s) => s.tax);
  const decisions = useStore((s) => s.decisions);
  const docs = useStore((s) => s.documents);

  const pendingValidations =
    legal.filter((a) => a.validationStatus === "pendente").length +
    tax.filter((a) => a.validationStatus === "pendente").length;
  const totalApproved = legal.filter((a) => a.validationStatus === "aprovado").length + tax.filter((a) => a.validationStatus === "aprovado").length;
  const totalAll = legal.length + tax.length;
  const approvalRate = totalAll ? Math.round((totalApproved / totalAll) * 100) : 0;

  const consolidatedRisk = Math.round(legal.reduce((s, a) => s + a.estimatedValue * (a.riskScore / 100), 0));
  const taxOpps = tax.reduce((s, a) => s + a.opportunitiesValue, 0);
  const criticalAlerts = decisions.filter((d) => d.urgency === "critico" || d.urgency === "alto").length;
  const aiCost = [...legal, ...tax].reduce((s, a) => s + a.estimatedCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-cyan">CognIA Hub</div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada de inteligência jurídica, tributária e decisão.</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
          A CognIA não substitui especialistas. Ela amplia a capacidade de análise, priorização e decisão.
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={FileText} label="Documentos processados (mês)" value={String(docs.length)} accent="from-primary to-cyan" />
        <Kpi icon={CheckCircle2} label="Análises pendentes" value={String(pendingValidations)} accent="from-warning to-orange-500" />
        <Kpi icon={ShieldCheck} label="Risco jurídico consolidado" value={fmtBRL(consolidatedRisk)} accent="from-risk to-purple" />
        <Kpi icon={TrendingUp} label="Oportunidades tributárias" value={fmtBRL(taxOpps)} accent="from-success to-cyan" />
        <Kpi icon={BellRing} label="Alertas críticos" value={String(criticalAlerts)} accent="from-risk to-warning" />
        <Kpi icon={CheckCircle2} label="Taxa de aprovação humana" value={`${approvalRate}%`} accent="from-cyan to-primary" />
        <Kpi icon={Coins} label="Custo de IA (mês)" value={`US$ ${aiCost.toFixed(2)}`} accent="from-purple to-primary" />
        <Kpi icon={Timer} label="Tempo médio economizado" value="38h" accent="from-cyan to-success" />
      </div>

      <RadarSection />

      {/* Priority list */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan" />
                <h2 className="text-lg font-semibold">O que merece sua atenção agora?</h2>
              </div>
              <p className="text-xs text-muted-foreground">Priorizado pelo Decision Intelligence Engine V0</p>
            </div>
            <Link to="/decision" className="text-xs text-cyan hover:underline">Ver tudo →</Link>
          </div>
          <ul className="space-y-3">
            {decisions.slice(0, 5).map((d) => (
              <li key={d.id} className="group flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/5 p-3 transition hover:border-white/10 hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-primary/30 to-purple/30 text-cyan">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.origin} · {d.suggestedOwner}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-sm font-semibold tabular-nums">{fmtBRL(d.financialImpact)}</div>
                    <RiskBadge risk={d.urgency} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-white" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk distribution */}
        <div className="space-y-6">
          <RiskDistribution legal={legal} tax={tax} />
          <AnalysisByType legal={legal.length} tax={tax.length} decision={decisions.length} />
        </div>
      </div>

      <DocsTrend />
      <RecentActivity />
    </div>
  );
}

function RecentActivity() {
  const logs = useStore((s) => s.logs).slice(0, 8);
  const iconFor = (a: string) => {
    if (a === "analysis.approved") return { I: CheckCircle2, c: "text-success" };
    if (a === "analysis.rejected") return { I: XCircle, c: "text-risk" };
    if (a === "analysis.corrected") return { I: Pencil, c: "text-cyan" };
    if (a === "document.upload") return { I: Upload, c: "text-muted-foreground" };
    if (a === "document.processed") return { I: FileText, c: "text-cyan" };
    if (a === "legal.analysis.generated" || a === "tax.diagnosis.generated") return { I: Sparkles, c: "text-purple" };
    return { I: Activity, c: "text-muted-foreground" };
  };
  const labelFor = (a: string) => ({
    "analysis.approved": "Análise aprovada",
    "analysis.rejected": "Análise rejeitada",
    "analysis.corrected": "Análise corrigida com correção",
    "document.upload": "Documento enviado",
    "document.processed": "Documento processado",
    "legal.analysis.generated": "Análise jurídica gerada pelo engine",
    "tax.diagnosis.generated": "Diagnóstico tributário gerado pelo engine",
    "user.login": "Acesso à plataforma",
  } as Record<string, string>)[a] ?? a;

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 text-sm font-semibold">Atividade recente</h3>
      <ul className="divide-y divide-border">
        {logs.map((l) => {
          const { I, c } = iconFor(l.action);
          return (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <I className={`h-4 w-4 ${c}`} />
                <div>
                  <div className="font-medium">{labelFor(l.action)}</div>
                  <div className="text-xs text-muted-foreground">{l.userEmail}</div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{relativeTime(l.timestamp)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <div className="glass-card group relative overflow-hidden p-4">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition group-hover:opacity-40`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-cyan" />
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function RiskDistribution({ legal, tax }: { legal: LegalAnalysis[]; tax: TaxAnalysis[] }) {
  const all = [...legal, ...tax];
  const counts = {
    baixo: all.filter((a) => a.risk === "baixo").length,
    medio: all.filter((a) => a.risk === "medio").length,
    alto: all.filter((a) => a.risk === "alto").length,
    critico: all.filter((a) => a.risk === "critico").length,
  };
  const total = all.length || 1;
  const rows = [
    { label: "Baixo", v: counts.baixo, color: "bg-success" },
    { label: "Médio", v: counts.medio, color: "bg-warning" },
    { label: "Alto", v: counts.alto, color: "bg-orange-500" },
    { label: "Crítico", v: counts.critico, color: "bg-risk" },
  ];
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 text-sm font-semibold">Distribuição de risco</h3>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="tabular-nums">{r.v}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5">
              <div className={`h-full rounded-full ${r.color}`} style={{ width: `${(r.v / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisByType({ legal, tax, decision }: { legal: number; tax: number; decision: number }) {
  const total = legal + tax + decision;
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 text-sm font-semibold">Análises por tipo</h3>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
        <div className="bg-primary" style={{ width: `${(legal / total) * 100}%` }} />
        <div className="bg-cyan" style={{ width: `${(tax / total) * 100}%` }} />
        <div className="bg-purple" style={{ width: `${(decision / total) * 100}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Legend color="bg-primary" label="Jurídico" v={legal} />
        <Legend color="bg-cyan" label="Tributário" v={tax} />
        <Legend color="bg-purple" label="Decisão" v={decision} />
      </div>
    </div>
  );
}
function Legend({ color, label, v }: { color: string; label: string; v: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}

function DocsTrend() {
  const data = [12, 18, 14, 22, 28, 24, 31, 36, 33, 42, 47, 52];
  const max = Math.max(...data);
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Evolução — documentos processados (12 meses)</h3>
        <span className="text-xs text-muted-foreground">+34% vs período anterior</span>
      </div>
      <div className="flex h-32 items-end gap-2">
        {data.map((v, i) => (
          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-cyan/80 transition hover:from-primary hover:to-cyan" style={{ height: `${(v / max) * 100}%` }} title={String(v)} />
        ))}
      </div>
    </div>
  );
}
