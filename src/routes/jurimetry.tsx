import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, setPendingStatus, logJurimetry } from "@/lib/cognia/store";
import { jurimetryAggregates, jurimetryClaims, jurimetrySuggestions, jurimetryHistory, jurimetryByCity } from "@/lib/cognia/radarMock";
import { RiskBadge } from "@/components/cognia/Badges";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtBRL } from "@/lib/cognia/format";
import { LineChart, BarChart3, ClipboardCheck, Sparkles, Search, ArrowLeft, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import type { JurimetryClaim } from "@/lib/cognia/types";

export const Route = createFileRoute("/jurimetry")({
  head: () => ({ meta: [{ title: "Jurimetria Trabalhista — CognIA" }] }),
  component: () => <AppShell><Jurimetry /></AppShell>,
});

function Jurimetry() {
  const pendings = useStore((s) => s.pendings);
  const [selected, setSelected] = useState<JurimetryClaim | null>(null);
  const [filter, setFilter] = useState("");

  const filteredClaims = useMemo(
    () => jurimetryClaims.filter((c) => c.claim.toLowerCase().includes(filter.toLowerCase())),
    [filter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
            <LineChart className="h-3.5 w-3.5" /> Legal Intelligence Engine · Jurimetria
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Jurimetria Trabalhista Automatizada</h1>
          <p className="text-sm text-muted-foreground">Análise automática de pedidos, resultados, riscos e tendências da carteira trabalhista.</p>
        </div>
        <div className="rounded-md border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs text-cyan">
          Menos preenchimento manual. Mais inteligência validada.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Processos analisados" value={fmt(jurimetryAggregates.processes)} />
        <Kpi label="Pedidos extraídos" value={fmt(jurimetryAggregates.claims)} />
        <Kpi label="Taxa de êxito" value={`${jurimetryAggregates.successPct}%`} accent="text-success" />
        <Kpi label="Taxa de acordo" value={`${jurimetryAggregates.agreementPct}%`} accent="text-cyan" />
        <Kpi label="Taxa de condenação" value={`${jurimetryAggregates.convictionPct}%`} accent="text-risk" />
        <Kpi label="Ticket médio de acordo" value={fmtBRL(jurimetryAggregates.avgAgreement)} />
        <Kpi label="Ticket médio de condenação" value={fmtBRL(jurimetryAggregates.avgConviction)} />
        <Kpi label="Qualidade do cadastro" value={`${jurimetryAggregates.qualityPct}%`} accent="text-success" />
        <Kpi label="Campos pendentes" value={fmt(jurimetryAggregates.pendingFields)} accent="text-warning" />
      </div>

      <JurimetryAiHighlight />

      <Tabs defaultValue="overview" onValueChange={(v) => logJurimetry(`jurimetry.tab.${v}.viewed`)}>
        <TabsList className="flex flex-wrap gap-1 bg-white/5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="claims">Análise por Pedido</TabsTrigger>
          <TabsTrigger value="city">Por Cidade/Tribunal</TabsTrigger>
          <TabsTrigger value="lawyer">Por Advogado</TabsTrigger>
          <TabsTrigger value="judge">Por Juiz</TabsTrigger>
          <TabsTrigger value="unit">Por Unidade</TabsTrigger>
          <TabsTrigger value="phase">Por Fase</TabsTrigger>
          <TabsTrigger value="quality">Qualidade do Cadastro</TabsTrigger>
          <TabsTrigger
            value="ai"
            className="relative gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/30 data-[state=active]:to-cyan/20 data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_0_0_1px] data-[state=active]:shadow-cyan/40"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan" />
            Sugestões da IA
            {jurimetrySuggestions.length > 0 && (
              <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-cyan/20 px-1 text-[10px] font-semibold text-cyan">
                {jurimetrySuggestions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="glass-card p-5 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold">Performance por ano</h3>
              <YearChart />
            </div>
            <div className="glass-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Distribuição de resultados</h3>
              <ResultDist />
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Distribuição por cidade / tribunal</h3>
            <div className="space-y-2">
              {jurimetryByCity.map((c) => (
                <div key={c.city}>
                  <div className="mb-1 flex justify-between text-xs"><span>{c.city}</span><span className="tabular-nums">{fmt(c.count)} · êxito {c.success}%</span></div>
                  <div className="h-2 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan" style={{ width: `${(c.count / 5240) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-3">
          <div className="glass-card flex items-center gap-3 p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar pedido…" className="pl-9 border-white/5 bg-white/5" />
            </div>
            <div className="text-xs text-muted-foreground">Dados alimentados automaticamente pelo Legal Engine · revisão humana sob demanda.</div>
          </div>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Pedido</th>
                  <th className="px-3 py-2 text-right">Qtd.</th>
                  <th className="px-3 py-2 text-left">% Êxito</th>
                  <th className="px-3 py-2 text-left">% Acordos</th>
                  <th className="px-3 py-2 text-left">% Condenações</th>
                  <th className="px-3 py-2 text-left">% Encerrado</th>
                  <th className="px-3 py-2 text-left">% Extinto</th>
                  <th className="px-3 py-2 text-right">Valor acordo</th>
                  <th className="px-3 py-2 text-right">Valor cond.</th>
                  <th className="px-3 py-2 text-center">Risco</th>
                  <th className="px-3 py-2 text-center">IA</th>
                  <th className="px-3 py-2 text-center">Validação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredClaims.map((c) => (
                  <tr key={c.claim} className="cursor-pointer hover:bg-white/5" onClick={() => { setSelected(c); logJurimetry("jurimetry.claim.filtered"); }}>
                    <td className="px-3 py-2 font-medium">{c.claim}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(c.count)}</td>
                    <td className="px-3 py-2"><Bar v={c.successPct} color="bg-success" /></td>
                    <td className="px-3 py-2"><Bar v={c.agreementPct} color="bg-cyan" /></td>
                    <td className="px-3 py-2"><Bar v={c.convictionPct} color="bg-risk" /></td>
                    <td className="px-3 py-2"><Bar v={c.closedPct} color="bg-primary" /></td>
                    <td className="px-3 py-2"><Bar v={c.extinctPct} color="bg-warning" /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtBRL(c.avgAgreement)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtBRL(c.avgConviction)}</td>
                    <td className="px-3 py-2 text-center"><RiskBadge risk={c.avgRisk >= 70 ? "alto" : c.avgRisk >= 50 ? "medio" : "baixo"} /></td>
                    <td className="px-3 py-2 text-center tabular-nums">{c.confidence}%</td>
                    <td className="px-3 py-2 text-center text-[10px] uppercase text-muted-foreground">{c.validation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && <ClaimDrawer claim={selected} onClose={() => setSelected(null)} />}
        </TabsContent>

        <TabsContent value="city"><GroupList rows={jurimetryByCity.map((c) => ({ k: c.city, v: c.count, info: `êxito ${c.success}%` }))} /></TabsContent>
        <TabsContent value="lawyer"><GroupList rows={["Escritório Mock", "Almeida & Cia", "Souza Advocacia", "JR Advogados", "MBA Trabalhista"].map((n, i) => ({ k: n, v: 4200 - i * 540, info: `êxito ${62 - i * 2}%` }))} /></TabsContent>
        <TabsContent value="judge"><GroupList rows={Array.from({ length: 8 }, (_, i) => ({ k: `Juiz ${String.fromCharCode(65 + i)}. Silva`, v: 1900 - i * 180, info: `condenação ${15 + i}%` }))} /></TabsContent>
        <TabsContent value="unit"><GroupList rows={["Unidade SP", "Unidade Campinas", "Unidade Curitiba", "Unidade BH", "Unidade RJ"].map((n, i) => ({ k: n, v: 5200 - i * 720, info: `acordo ${18 - i}%` }))} /></TabsContent>
        <TabsContent value="phase"><GroupList rows={["Conhecimento", "Liquidação", "Execução", "Arquivo provisório", "Encerrado"].map((n, i) => ({ k: n, v: 9800 - i * 1700, info: `risco médio ${[62, 58, 72, 41, 22][i]}` }))} /></TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Preenchidos pela IA" value="312.421" accent="text-cyan" />
            <Kpi label="Validados por humano" value="89.420" accent="text-success" />
            <Kpi label="Pendentes" value="1.284" accent="text-warning" />
            <Kpi label="Divergentes" value="342" accent="text-risk" />
            <Kpi label="Baixa confiança" value="612" />
            <Kpi label="Pedidos sem categorização" value="78" />
            <Kpi label="Resultados sem classificação" value="44" />
            <Kpi label="Documentos para revisão" value="129" />
          </div>
          <div className="glass-card overflow-hidden">
            <div className="border-b border-white/5 p-4">
              <h3 className="text-sm font-semibold">Pendências de qualidade da carteira</h3>
              <p className="text-xs text-muted-foreground">Sugestões da IA aguardando validação humana — diferencial frente a sistemas com cadastro manual.</p>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Processo</th>
                  <th className="px-3 py-2 text-left">Campo</th>
                  <th className="px-3 py-2 text-left">Sugerido pela IA</th>
                  <th className="px-3 py-2 text-center">Confiança</th>
                  <th className="px-3 py-2 text-left">Responsável</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendings.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-3 py-2 font-mono">{p.processNumber}</td>
                    <td className="px-3 py-2">{p.field}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.suggested}</td>
                    <td className="px-3 py-2 text-center tabular-nums">{p.confidence}%</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.responsible}</td>
                    <td className="px-3 py-2 text-center text-[10px] uppercase text-muted-foreground">{p.status}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-success" onClick={() => { setPendingStatus(p.id, "aprovado"); toast.success("Sugestão aprovada"); }}>Aprovar</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-cyan" onClick={() => { setPendingStatus(p.id, "corrigido"); toast("Sugestão corrigida"); }}>Corrigir</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-risk" onClick={() => { setPendingStatus(p.id, "rejeitado"); toast.error("Sugestão rejeitada"); }}>Rejeitar</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-warning" onClick={() => { setPendingStatus(p.id, "especialista"); toast("Enviado ao especialista"); }}>Especialista</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-3">
          <div className="flex items-start gap-2.5 rounded-md border border-warning/20 bg-warning/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <span>Sugere-se revisar com especialista — toda recomendação da IA exige validação humana.</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {jurimetrySuggestions.map((s) => (
              <div key={s.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <RiskBadge risk={s.priority} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>Processos impactados: <span className="text-foreground tabular-nums">{s.impactedProcesses}</span></div>
                  <div>Impacto estimado: <span className="text-foreground tabular-nums">{s.financialImpact ? fmtBRL(s.financialImpact) : "—"}</span></div>
                  <div>Confiança: <span className="text-foreground tabular-nums">{s.confidence}%</span></div>
                  <div>Responsável: <span className="text-foreground">{s.owner}</span></div>
                </div>
                <Button size="sm" className="mt-3 bg-gradient-to-r from-primary to-purple text-white" onClick={() => { logJurimetry("jurimetry.suggestion.sent_to_validation"); toast.success("Enviado para validação"); }}>
                  {s.action}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-[10px] text-muted-foreground">MVP com dados mockados. Jurimetria simulada para demonstração.</div>
    </div>
  );
}

function fmt(n: number) { return new Intl.NumberFormat("pt-BR").format(n); }

function JurimetryAiHighlight() {
  const critical = jurimetrySuggestions.filter((s) => s.priority === "critico" || s.priority === "alto");
  const totalImpact = jurimetrySuggestions.reduce((s, x) => s + (x.financialImpact || 0), 0);
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan/30 bg-gradient-to-r from-primary/15 via-cyan/10 to-purple/15 p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan/20 text-cyan glow-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-cyan">
              Inteligência CognIA
              <span className="rounded-full bg-cyan/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan">
                {jurimetrySuggestions.length} novas
              </span>
            </div>
            <h3 className="text-lg font-semibold">Sugestões da IA disponíveis</h3>
            <p className="text-xs text-muted-foreground">
              A CognIA identificou {jurimetrySuggestions.length} oportunidades de revisão na carteira trabalhista
              {critical.length > 0 && <>, sendo <span className="text-warning font-medium">{critical.length} de alta prioridade</span></>}.
              Impacto financeiro estimado: <span className="text-foreground font-medium">{fmtBRL(totalImpact)}</span>.
            </p>
          </div>
        </div>
        <a href="#ai-suggestions-tab" onClick={(e) => {
          e.preventDefault();
          const trigger = document.querySelector<HTMLElement>('[data-value="ai"], [role="tab"][value="ai"]');
          trigger?.click();
          document.querySelector('[role="tabpanel"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
          className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-purple px-4 py-2 text-sm font-medium text-white shadow-lg hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" /> Ver sugestões
        </a>
      </div>
      {critical.length > 0 && (
        <div className="relative mt-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-2.5 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <span>
            <span className="font-medium text-warning">Alerta executivo:</span> {critical.length} sugestão(ões) de prioridade alta/crítica exigem validação humana imediata.
          </span>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, accent = "" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function Bar({ v, color }: { v: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${color}`} style={{ width: `${v}%` }} /></div>
      <span className="tabular-nums text-[11px]">{v}%</span>
    </div>
  );
}

function YearChart() {
  const max = 70;
  return (
    <div className="space-y-3">
      {jurimetryHistory.map((y) => (
        <div key={y.year}>
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>{y.year}</span><span>êxito {y.success}% · acordo {y.agreement}% · condenação {y.conviction}%</span></div>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
            <div className="bg-success" style={{ width: `${(y.success / max) * 100}%` }} />
            <div className="bg-cyan" style={{ width: `${(y.agreement / max) * 100}%` }} />
            <div className="bg-risk" style={{ width: `${(y.conviction / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultDist() {
  const items = [
    { k: "Êxitos", v: 60.6, c: "bg-success" },
    { k: "Acordos", v: 16.6, c: "bg-cyan" },
    { k: "Condenações", v: 17.0, c: "bg-risk" },
    { k: "Encerrados", v: 4.2, c: "bg-primary" },
    { k: "Extintos", v: 1.6, c: "bg-warning" },
  ];
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.k}>
          <div className="mb-1 flex justify-between text-xs"><span>{i.k}</span><span className="tabular-nums">{i.v}%</span></div>
          <div className="h-2 rounded-full bg-white/5"><div className={`h-full rounded-full ${i.c}`} style={{ width: `${i.v}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function GroupList({ rows }: { rows: { k: string; v: number; info: string }[] }) {
  const max = Math.max(...rows.map((r) => r.v));
  return (
    <div className="glass-card p-5 space-y-2">
      {rows.map((r) => (
        <div key={r.k}>
          <div className="mb-1 flex justify-between text-xs"><span>{r.k}</span><span className="tabular-nums">{fmt(r.v)} · {r.info}</span></div>
          <div className="h-2 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan" style={{ width: `${(r.v / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function ClaimDrawer({ claim, onClose }: { claim: JurimetryClaim; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0B0F1A] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{claim.claim}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <Stat k="Processos" v={fmt(claim.count)} />
          <Stat k="% Êxito" v={`${claim.successPct}%`} />
          <Stat k="% Acordos" v={`${claim.agreementPct}%`} />
          <Stat k="% Condenações" v={`${claim.convictionPct}%`} />
          <Stat k="Valor médio acordo" v={fmtBRL(claim.avgAgreement)} />
          <Stat k="Valor médio cond." v={fmtBRL(claim.avgConviction)} />
          <Stat k="Risco médio" v={String(claim.avgRisk)} />
          <Stat k="Confiança IA" v={`${claim.confidence}%`} />
        </div>
        <div className="mt-4 rounded-md border border-cyan/20 bg-cyan/5 p-3 text-xs">
          <div className="text-cyan">Recomendação CognIA</div>
          <p className="mt-1 text-muted-foreground">Pedidos de {claim.claim.toLowerCase()} apresentam risco médio {claim.avgRisk}. Recomenda-se priorizar validação dos processos com score acima de 70.</p>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">Campos pendentes de validação: <b className="text-foreground">{Math.floor(claim.count * 0.04)}</b></div>
        <Link to="/legal" className="mt-4 inline-block text-xs text-cyan hover:underline">Ver processos relacionados →</Link>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{v}</div>
    </div>
  );
}
