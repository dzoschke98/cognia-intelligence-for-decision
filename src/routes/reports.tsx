import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileDown, FileBarChart, Scale, Receipt, CheckCircle2, TrendingUp, LineChart as LineIcon } from "lucide-react";
import { toast } from "sonner";
import { useStore, getCompany, getCompanies } from "@/lib/cognia/store";
import { fmtBRL, fmtDate } from "@/lib/cognia/format";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, ComposedChart, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { jurimetryClaims, jurimetryHistory, jurimetryByCity, jurimetryAggregates } from "@/lib/cognia/radarMock";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Relatórios — CognIA" }] }),
  component: () => <AppShell><Reports /></AppShell>,
});

type ReportId = "r0" | "r1" | "r2" | "r3" | "r4" | "r5" | "r6";

const reportsMeta: { id: ReportId; title: string; icon: React.ElementType; summary: string; owner: string }[] = [
  { id: "r0", title: "Relatório de Jurimetria Trabalhista", icon: LineIcon, summary: "Visão geral, análise por pedido, tendências e qualidade do cadastro.", owner: "Renata Almeida" },
  { id: "r1", title: "Relatório Jurídico Executivo", icon: Scale, summary: "Síntese de exposição, riscos e recomendações jurídicas.", owner: "Renata Almeida" },
  { id: "r2", title: "Relatório Tributário Executivo", icon: Receipt, summary: "Inconsistências e oportunidades fiscais consolidadas.", owner: "Nathan Endrigo" },
  { id: "r3", title: "Relatório Integrado CFO", icon: FileBarChart, summary: "Visão consolidada para o CFO — risco + oportunidade.", owner: "Mariana Costa" },
  { id: "r4", title: "Relatório de Validações", icon: CheckCircle2, summary: "Status e SLA de validações humanas em andamento.", owner: "Davi Fadel" },
  { id: "r5", title: "Relatório de Riscos e Oportunidades", icon: TrendingUp, summary: "Matriz de impacto x urgência priorizada.", owner: "Delmer Zoschke" },
  { id: "r6", title: "Relatório da Matriz de Confrontos Fiscais", icon: Receipt, summary: "Cruzamentos, oportunidades, contingências e Reforma Tributária.", owner: "Nathan Endrigo" },
];

const COLORS = { primary: "#2563EB", cyan: "#00C2BA", purple: "#7C3AED", success: "#22C55E", warning: "#FACC15", risk: "#EF4444", orange: "#F97316" };
const CARD_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 } as const;

function Reports() {
  const [open, setOpen] = useState<ReportId | null>(null);
  const today = fmtDate(new Date().toISOString());

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-cyan">Relatórios Executivos</div>
        <h1 className="text-3xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Visualize, gere e distribua relatórios executivos da CognIA.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {reportsMeta.map((r) => (
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
              <Button size="sm" onClick={() => setOpen(r.id)} className="bg-gradient-to-r from-primary to-purple text-white">
                <FileDown className="mr-1.5 h-3.5 w-3.5" /> Gerar PDF
              </Button>
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>Responsável: {r.owner}</span>
              <span>{today}</span>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <ReportDialog id={open} title={reportsMeta.find((r) => r.id === open)!.title} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

function ReportDialog({ id, title, onClose }: { id: ReportId; title: string; onClose: () => void }) {
  const today = fmtDate(new Date().toISOString());
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <div className="text-xs text-muted-foreground">Gerado em {today}</div>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {id === "r0" && <R0 />}
          {id === "r1" && <R1 />}
          {id === "r2" && <R2 />}
          {id === "r3" && <R3 />}
          {id === "r4" && <R4 />}
          {id === "r5" && <R5 />}
          {id === "r6" && <R6 />}
          <p className="text-[10px] italic text-muted-foreground">
            Relatório gerado com dados mockados para demonstração do MVP.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button onClick={() => toast.success("PDF mockado gerado para download")} className="bg-gradient-to-r from-primary to-purple text-white">
            <FileDown className="mr-1.5 h-3.5 w-3.5" /> Baixar PDF (mock)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Kpis({ items }: { items: { k: string; v: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((i) => (
        <div key={i.k} className="rounded-md border border-border bg-accent/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{i.k}</div>
          <div className="text-lg font-semibold">{i.v}</div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan">{title}</h4>
      {children}
    </div>
  );
}

function R0() {
  const top = [...jurimetryClaims].sort((a, b) => b.count - a.count).slice(0, 8).map((c) => ({ name: c.claim.length > 18 ? c.claim.slice(0, 18) + "…" : c.claim, count: c.count }));
  return (
    <div className="space-y-4">
      <Kpis items={[
        { k: "Processos", v: jurimetryAggregates.processes.toLocaleString("pt-BR") },
        { k: "Pedidos", v: jurimetryAggregates.claims.toLocaleString("pt-BR") },
        { k: "Taxa de êxito", v: `${jurimetryAggregates.successPct}%` },
        { k: "Qualidade cadastro", v: `${jurimetryAggregates.qualityPct}%` },
      ]} />
      <Section title="Top 8 pedidos">
        <ChartBox><BarChart data={top}><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis dataKey="name" fontSize={10} stroke="oklch(0.68 0.02 260)" /><YAxis fontSize={10} stroke="oklch(0.68 0.02 260)" /><Tooltip contentStyle={CARD_STYLE} /><Bar dataKey="count" fill={COLORS.primary} radius={[6, 6, 0, 0]} /></BarChart></ChartBox>
      </Section>
      <Section title="Evolução histórica (2019-2026)">
        <ChartBox><LineChart data={jurimetryHistory}><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis dataKey="year" fontSize={10} stroke="oklch(0.68 0.02 260)" /><YAxis fontSize={10} stroke="oklch(0.68 0.02 260)" /><Tooltip contentStyle={CARD_STYLE} /><Legend /><Line dataKey="success" stroke={COLORS.cyan} name="Êxito" /><Line dataKey="agreement" stroke={COLORS.primary} name="Acordo" /><Line dataKey="conviction" stroke={COLORS.purple} name="Condenação" /></LineChart></ChartBox>
      </Section>
      <Section title="Distribuição por tribunal / cidade">
        <ChartBox><BarChart data={jurimetryByCity}><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis dataKey="city" fontSize={9} stroke="oklch(0.68 0.02 260)" interval={0} angle={-25} textAnchor="end" height={80} /><YAxis fontSize={10} stroke="oklch(0.68 0.02 260)" /><Tooltip contentStyle={CARD_STYLE} /><Bar dataKey="count" fill={COLORS.cyan} radius={[6, 6, 0, 0]} /></BarChart></ChartBox>
      </Section>
    </div>
  );
}

function R1() {
  const legal = useStore((s) => s.legal);
  const total = legal.length;
  const totalVal = legal.reduce((s, a) => s + a.estimatedValue, 0);
  const consRisk = Math.round(legal.reduce((s, a) => s + a.estimatedValue * (a.riskScore / 100), 0));
  const avgConf = total ? legal.reduce((s, a) => s + a.confidence, 0) / total : 0;
  const top5 = [...legal].sort((a, b) => b.estimatedValue - a.estimatedValue).slice(0, 5).map((a) => ({ name: a.processNumber.slice(0, 12), value: a.estimatedValue }));
  const dist = [
    { name: "Baixo", value: legal.filter((a) => a.risk === "baixo").length, fill: COLORS.success },
    { name: "Médio", value: legal.filter((a) => a.risk === "medio").length, fill: COLORS.warning },
    { name: "Alto", value: legal.filter((a) => a.risk === "alto").length, fill: COLORS.orange },
    { name: "Crítico", value: legal.filter((a) => a.risk === "critico").length, fill: COLORS.risk },
  ];
  return (
    <div className="space-y-4">
      <Kpis items={[
        { k: "Total processos", v: String(total) },
        { k: "Valor total estimado", v: fmtBRL(totalVal) },
        { k: "Risco consolidado", v: fmtBRL(consRisk) },
        { k: "Confiança média", v: `${avgConf.toFixed(0)}%` },
      ]} />
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Top 5 processos por valor">
          <ChartBox h={220}><BarChart data={top5}><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis dataKey="name" fontSize={10} stroke="oklch(0.68 0.02 260)" /><YAxis fontSize={10} stroke="oklch(0.68 0.02 260)" /><Tooltip contentStyle={CARD_STYLE} formatter={(v: number) => fmtBRL(v)} /><Bar dataKey="value" fill={COLORS.primary} radius={[6, 6, 0, 0]} /></BarChart></ChartBox>
        </Section>
        <Section title="Distribuição por nível de risco">
          <ChartBox h={220}><PieChart><Pie data={dist} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>{dist.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip contentStyle={CARD_STYLE} /><Legend /></PieChart></ChartBox>
        </Section>
      </div>
      <Section title="Últimas 5 análises">
        <MiniTable head={["Processo", "Risco", "Valor", "Status"]} rows={legal.slice(0, 5).map((a) => [a.processNumber, a.risk, fmtBRL(a.estimatedValue), a.validationStatus])} />
      </Section>
    </div>
  );
}

function R2() {
  const tax = useStore((s) => s.tax);
  const total = tax.length;
  const inc = tax.reduce((s, a) => s + a.inconsistenciesValue, 0);
  const opp = tax.reduce((s, a) => s + a.opportunitiesValue, 0);
  const avgScore = total ? tax.reduce((s, a) => s + a.fiscalScore, 0) / total : 0;
  const byCompany = getCompanies().map((c) => {
    const arr = tax.filter((t) => t.companyId === c.id);
    return { name: c.name.slice(0, 10), Inconsistências: arr.reduce((s, a) => s + a.inconsistenciesValue, 0), Oportunidades: arr.reduce((s, a) => s + a.opportunitiesValue, 0) };
  });
  const byType: Record<string, number> = {};
  tax.forEach((t) => { byType[t.fileType] = (byType[t.fileType] ?? 0) + t.opportunitiesValue; });
  const pie = Object.entries(byType).map(([name, value]) => ({ name, value }));
  const pieColors = [COLORS.primary, COLORS.cyan, COLORS.purple, COLORS.success, COLORS.warning];
  return (
    <div className="space-y-4">
      <Kpis items={[
        { k: "Diagnósticos", v: String(total) },
        { k: "Inconsistências", v: fmtBRL(inc) },
        { k: "Oportunidades", v: fmtBRL(opp) },
        { k: "Fiscal score médio", v: avgScore.toFixed(0) },
      ]} />
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Inconsistências vs oportunidades por empresa">
          <ChartBox h={220}><BarChart data={byCompany}><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis dataKey="name" fontSize={10} stroke="oklch(0.68 0.02 260)" /><YAxis fontSize={10} stroke="oklch(0.68 0.02 260)" /><Tooltip contentStyle={CARD_STYLE} formatter={(v: number) => fmtBRL(v)} /><Legend /><Bar dataKey="Inconsistências" fill={COLORS.risk} /><Bar dataKey="Oportunidades" fill={COLORS.success} /></BarChart></ChartBox>
        </Section>
        <Section title="Oportunidades por tipo de arquivo">
          <ChartBox h={220}><PieChart><Pie data={pie} dataKey="value" nameKey="name" outerRadius={80}>{pie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}</Pie><Tooltip contentStyle={CARD_STYLE} formatter={(v: number) => fmtBRL(v)} /><Legend /></PieChart></ChartBox>
        </Section>
      </div>
      <Section title="Top 5 diagnósticos por impacto">
        <MiniTable head={["Empresa", "Documento", "Oportunidades", "Status"]} rows={[...tax].sort((a, b) => b.opportunitiesValue - a.opportunitiesValue).slice(0, 5).map((t) => [getCompany(t.companyId)?.name ?? "", t.fileType, fmtBRL(t.opportunitiesValue), t.validationStatus])} />
      </Section>
    </div>
  );
}

function R3() {
  const legal = useStore((s) => s.legal);
  const tax = useStore((s) => s.tax);
  const risk = Math.round(legal.reduce((s, a) => s + a.estimatedValue * (a.riskScore / 100), 0));
  const opp = tax.reduce((s, a) => s + a.opportunitiesValue, 0);
  const pend = legal.filter((a) => a.validationStatus === "pendente").length + tax.filter((a) => a.validationStatus === "pendente").length;
  const cost = [...legal, ...tax].reduce((s, a) => s + a.estimatedCost, 0);
  const total = legal.length + tax.length;
  const approved = legal.filter((a) => a.validationStatus === "aprovado").length + tax.filter((a) => a.validationStatus === "aprovado").length;
  const approvalRate = total ? (approved / total) * 100 : 0;
  const byCompany = getCompanies().map((c) => {
    const l = legal.filter((a) => a.companyId === c.id);
    const t = tax.filter((a) => a.companyId === c.id);
    return {
      name: c.name.slice(0, 12),
      Risco: Math.round(l.reduce((s, a) => s + a.estimatedValue * (a.riskScore / 100), 0)),
      Oportunidade: t.reduce((s, a) => s + a.opportunitiesValue, 0),
    };
  });
  return (
    <div className="space-y-4">
      <Kpis items={[
        { k: "Risco jurídico", v: fmtBRL(risk) },
        { k: "Oportunidade tributária", v: fmtBRL(opp) },
        { k: "Saldo líquido", v: fmtBRL(opp - risk) },
        { k: "Análises pendentes", v: String(pend) },
        { k: "Custo de IA (mês)", v: `US$ ${cost.toFixed(2)}` },
        { k: "Taxa de aprovação", v: `${approvalRate.toFixed(1)}%` },
      ]} />
      <Section title="Risco × Oportunidade por empresa">
        <ChartBox><ComposedChart data={byCompany}><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis dataKey="name" fontSize={10} stroke="oklch(0.68 0.02 260)" /><YAxis fontSize={10} stroke="oklch(0.68 0.02 260)" /><Tooltip contentStyle={CARD_STYLE} formatter={(v: number) => fmtBRL(v)} /><Legend /><Bar dataKey="Risco" fill={COLORS.risk} /><Line dataKey="Oportunidade" stroke={COLORS.success} strokeWidth={2} /></ComposedChart></ChartBox>
      </Section>
      <div className="rounded-md border border-border bg-accent/40 p-4 text-sm text-muted-foreground">
        Consolidação do mês: {fmtBRL(opp)} em oportunidades tributárias frente a {fmtBRL(risk)} em risco jurídico consolidado.
        Saldo líquido de {fmtBRL(opp - risk)}, com {pend} análises aguardando validação e {approvalRate.toFixed(1)}% de aprovação humana média.
      </div>
    </div>
  );
}

function R4() {
  const legal = useStore((s) => s.legal);
  const tax = useStore((s) => s.tax);
  const statuses = ["pendente", "aprovado", "corrigido", "rejeitado"] as const;
  const data = statuses.map((st) => ({
    name: st, Legal: legal.filter((a) => a.validationStatus === st).length, Tax: tax.filter((a) => a.validationStatus === st).length,
  }));
  const pendings = [...legal, ...tax].filter((a) => a.validationStatus === "pendente").sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).slice(0, 6);
  return (
    <div className="space-y-4">
      <Section title="Distribuição por status">
        <ChartBox><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis dataKey="name" fontSize={10} stroke="oklch(0.68 0.02 260)" /><YAxis fontSize={10} stroke="oklch(0.68 0.02 260)" /><Tooltip contentStyle={CARD_STYLE} /><Legend /><Bar dataKey="Legal" fill={COLORS.primary} /><Bar dataKey="Tax" fill={COLORS.cyan} /></BarChart></ChartBox>
      </Section>
      <Section title="Pendentes há mais tempo">
        <MiniTable head={["Identificador", "Responsável", "Criado em"]} rows={pendings.map((a: any) => [a.processNumber ?? `${a.fileType} · ${a.competence}`, a.responsible, fmtDate(a.createdAt)])} />
      </Section>
    </div>
  );
}

function R5() {
  const decisions = useStore((s) => s.decisions);
  const urgMap = { baixo: 1, medio: 2, alto: 3, critico: 4 } as const;
  const scatter = decisions.map((d) => ({ x: urgMap[d.urgency], y: d.financialImpact, title: d.title }));
  const byOrigin = ["Legal", "Tax", "Cross"].map((o) => ({ name: o, value: decisions.filter((d) => d.origin === o).reduce((s, d) => s + d.financialImpact, 0) }));
  return (
    <div className="space-y-4">
      <Section title="Matriz de prioridade (urgência × impacto)">
        <ChartBox><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis type="number" dataKey="x" name="Urgência" domain={[0, 5]} stroke="oklch(0.68 0.02 260)" fontSize={10} /><YAxis type="number" dataKey="y" name="Impacto" stroke="oklch(0.68 0.02 260)" fontSize={10} tickFormatter={(v) => fmtBRL(v)} /><ZAxis range={[80, 80]} /><Tooltip contentStyle={CARD_STYLE} formatter={(v: number) => typeof v === "number" && v > 5 ? fmtBRL(v) : v} /><Scatter data={scatter} fill={COLORS.primary} /></ScatterChart></ChartBox>
      </Section>
      <Section title="Impacto financeiro por origem">
        <ChartBox h={220}><BarChart data={byOrigin}><CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" /><XAxis dataKey="name" fontSize={10} stroke="oklch(0.68 0.02 260)" /><YAxis fontSize={10} stroke="oklch(0.68 0.02 260)" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} /><Tooltip contentStyle={CARD_STYLE} formatter={(v: number) => fmtBRL(v)} /><Bar dataKey="value" fill={COLORS.purple} radius={[6, 6, 0, 0]} /></BarChart></ChartBox>
      </Section>
      <Section title="Ordenado por prioridade">
        <MiniTable head={["Título", "Origem", "Impacto", "Score"]} rows={[...decisions].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 8).map((d) => [d.title, d.origin, fmtBRL(d.financialImpact), String(d.priorityScore)])} />
      </Section>
    </div>
  );
}

function ChartBox({ children, h = 280 }: { children: React.ReactElement; h?: number }) {
  return <div style={{ height: h }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

function MiniTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-accent/40 text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
