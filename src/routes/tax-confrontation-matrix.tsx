import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addLog } from "@/lib/cognia/store";
import { fmtBRL } from "@/lib/cognia/format";
import {
  tcmKpis, tcmSources, tcmMatrix, tcmOpportunities, tcmContingencies,
  tcmValidations as seedValidations, tcmHistory, tcmTributeEvolution,
  tcmReformScenario, tcmRecommendations, tcmByEstablishment,
  TCM_STATUS_LABEL, TCM_STATUS_COLOR,
  type TcmStatus, type TcmCross, type TcmValidation,
} from "@/lib/cognia/taxMatrixMock";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis, ComposedChart,
} from "recharts";
import {
  Grid3x3, AlertTriangle, Sparkles, ArrowLeft, FileDown, Send,
  CheckCircle2, XCircle, Pencil, Search, ExternalLink,
} from "lucide-react";

const CARD = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 } as const;
const COLORS = { primary: "#2563EB", cyan: "#00C2BA", purple: "#7C3AED", success: "#22C55E", warning: "#FACC15", risk: "#EF4444" };

export const Route = createFileRoute("/tax-confrontation-matrix")({
  head: () => ({ meta: [{ title: "Matriz de Confrontos Fiscais — CognIA" }] }),
  component: () => <AppShell><TaxConfrontationMatrix /></AppShell>,
});

function TaxConfrontationMatrix() {
  const [selected, setSelected] = useState<TcmCross | null>(null);
  const [validations, setValidations] = useState<TcmValidation[]>(seedValidations);

  return (
    <div className="space-y-6">
      <Header />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Receita Bruta Analisada" value={fmtBRL(tcmKpis.grossRevenue)} />
        <Kpi label="Compras Analisadas" value={fmtBRL(tcmKpis.purchases)} />
        <Kpi label="Tributos Apurados" value={fmtBRL(tcmKpis.taxesApurados)} />
        <Kpi label="DARFs Recolhidos" value={fmtBRL(tcmKpis.darfsRecolhidos)} accent="text-success" />
        <Kpi label="Oportunidades Potenciais" value="R$ 36,03 mi" accent="text-cyan" />
        <Kpi label="Possibilidades a Explorar" value="R$ 2,01 mi" accent="text-cyan" />
        <Kpi label="Contingências Potenciais" value="R$ 6,01 mi" accent="text-risk" />
        <Kpi label="Cruzamentos c/ Divergência" value={String(tcmKpis.divergences)} accent="text-warning" />
        <Kpi label="Pendências de Validação" value={String(tcmKpis.pendingValidation)} accent="text-warning" />
        <Kpi label="Qualidade dos Cruzamentos" value={`${tcmKpis.quality}%`} accent="text-success" />
      </div>

      <Tabs
        defaultValue="overview"
        onValueChange={(v) => addLog({ action: `tax_confrontation_matrix.tab.${v}.viewed`, resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" })}
      >
        <TabsList className="flex flex-wrap gap-1 bg-white/5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="matrix">Matriz de Cruzamentos</TabsTrigger>
          <TabsTrigger value="icms">ICMS</TabsTrigger>
          <TabsTrigger value="ipi">IPI</TabsTrigger>
          <TabsTrigger value="pis">PIS/COFINS</TabsTrigger>
          <TabsTrigger value="irpj">IRPJ/CSLL</TabsTrigger>
          <TabsTrigger value="prev">Previdenciário</TabsTrigger>
          <TabsTrigger value="reform">Reforma Tributária</TabsTrigger>
          <TabsTrigger value="opps">Oportunidades</TabsTrigger>
          <TabsTrigger value="conts">Contingências</TabsTrigger>
          <TabsTrigger value="val">Validação Humana</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4"><Overview /></TabsContent>
        <TabsContent value="matrix" className="mt-4"><MatrixTab onSelect={setSelected} /></TabsContent>
        <TabsContent value="icms" className="mt-4"><TributeTab tribute="ICMS" /></TabsContent>
        <TabsContent value="ipi"  className="mt-4"><TributeTab tribute="IPI" /></TabsContent>
        <TabsContent value="pis"  className="mt-4"><TributeTab tribute="PIS/COFINS" /></TabsContent>
        <TabsContent value="irpj" className="mt-4"><TributeTab tribute="IRPJ/CSLL" /></TabsContent>
        <TabsContent value="prev" className="mt-4"><TributeTab tribute="Previdenciário" /></TabsContent>
        <TabsContent value="reform" className="mt-4"><ReformTab /></TabsContent>
        <TabsContent value="opps" className="mt-4"><OpportunitiesTab /></TabsContent>
        <TabsContent value="conts" className="mt-4"><ContingenciesTab /></TabsContent>
        <TabsContent value="val" className="mt-4"><ValidationTab items={validations} setItems={setValidations} /></TabsContent>
      </Tabs>

      <CrossSheet cross={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Header() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
            <Grid3x3 className="h-3.5 w-3.5" /> Tax Intelligence Engine · Matriz
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Matriz de Confrontos Fiscais</h1>
          <p className="text-sm text-muted-foreground">
            Cruzamento inteligente de obrigações, inconsistências, oportunidades e impactos tributários.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Compare EFD, ECD, ECF, XMLs, DCTF, DARFs, PER/DCOMP e bases fiscais para encontrar riscos e oportunidades com rastreabilidade.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-[11px] font-semibold text-cyan">
            Tax Intelligence Engine V1 — MVP Mockado
          </span>
          <Link to="/tax" className="text-xs text-cyan hover:underline">
            <ArrowLeft className="mr-1 inline h-3 w-3" /> Voltar ao Tax Engine
          </Link>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-md border border-warning/20 bg-warning/5 p-2.5 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
        <span>Ambiente MVP com dados mockados. As análises são simuladas e não substituem parecer tributário.</span>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

/* ============================== OVERVIEW ============================== */
function Overview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Alíquota Efetiva Atual</div>
          <div className="mt-1 text-4xl font-semibold tabular-nums">{tcmKpis.effectiveRateCurrent}%</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Alíquota Efetiva após Oportunidades</div>
          <div className="mt-1 flex items-baseline gap-3">
            <div className="text-4xl font-semibold tabular-nums text-cyan">{tcmKpis.effectiveRateAfter}%</div>
            <span className="text-xs text-success">Redução estimada: 0,15 p.p.</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Receita × Compras × Tributos</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={tcmHistory}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip contentStyle={CARD} formatter={(v: number) => fmtBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="receita" name="Receita" fill={COLORS.primary} />
              <Bar dataKey="compras" name="Compras" fill={COLORS.cyan} />
              <Line dataKey="tributos" name="Tributos" stroke={COLORS.warning} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Evolução de tributos</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={tcmTributeEvolution}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CARD} formatter={(v: number) => fmtBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="ICMS" stroke={COLORS.primary} />
              <Line dataKey="IPI" stroke={COLORS.warning} />
              <Line dataKey="PIS/COFINS" stroke={COLORS.cyan} />
              <Line dataKey="IRPJ/CSLL" stroke={COLORS.purple} />
              <Line dataKey="INSS" stroke={COLORS.success} />
              <Line dataKey="Total" stroke={COLORS.risk} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cyan">
          <Sparkles className="h-4 w-4" /> O que merece atenção agora?
        </h3>
        <div className="space-y-2">
          {tcmRecommendations.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/5 bg-white/5 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-cyan">{r.tribute}</span>
                  <UrgencyBadge value={r.urgency} />
                  <span className="text-muted-foreground">Confiança {r.confidence}%</span>
                </div>
                <div className="mt-1 text-sm">{r.action}</div>
                <div className="text-[11px] text-muted-foreground">Responsável sugerido: {r.owner}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Impacto estimado</div>
                <div className="text-base font-semibold tabular-nums">{fmtBRL(r.impact)}</div>
                <Button size="sm" variant="ghost" className="mt-1 h-7 text-cyan"
                  onClick={() => { addLog({ action: "tax_confrontation_matrix.action.created", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Ação criada e enviada para validação"); }}>
                  Ver detalhe <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UrgencyBadge({ value }: { value: "baixo" | "medio" | "alto" | "critico" }) {
  const map = {
    baixo: "bg-success/15 text-success border-success/30",
    medio: "bg-warning/15 text-warning border-warning/30",
    alto: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    critico: "bg-risk/15 text-risk border-risk/40",
  };
  const label = { baixo: "Baixa", medio: "Média", alto: "Alta", critico: "Crítica" }[value];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${map[value]}`}>{label}</span>;
}

/* ============================== MATRIX ============================== */
function MatrixTab({ onSelect }: { onSelect: (c: TcmCross) => void }) {
  const grid = useMemo(() => {
    const m = new Map<string, TcmCross>();
    for (const c of tcmMatrix) m.set(`${c.row}::${c.col}`, c);
    return m;
  }, []);

  return (
    <div className="space-y-4">
      <div className="glass-card p-3 text-xs text-muted-foreground">
        Clique em uma célula para abrir o painel de detalhes do cruzamento.
      </div>

      <div className="glass-card overflow-auto p-3">
        <table className="min-w-[900px] w-full border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card p-2 text-left text-muted-foreground">Fonte ↓ / Fonte →</th>
              {tcmSources.map((s) => (
                <th key={s} className="p-2 text-left text-[10px] font-medium text-muted-foreground">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tcmSources.map((row) => (
              <tr key={row}>
                <td className="sticky left-0 z-10 bg-card p-2 text-[11px] font-medium">{row}</td>
                {tcmSources.map((col) => {
                  if (row === col) return <td key={col} className="rounded bg-white/[0.02]" />;
                  const cell = grid.get(`${row}::${col}`) ?? grid.get(`${col}::${row}`);
                  const status: TcmStatus = cell?.status ?? "ok";
                  return (
                    <td key={col}>
                      <button
                        onClick={() => {
                          if (cell) {
                            onSelect(cell);
                            addLog({ action: "tax_confrontation_matrix.crosscheck.opened", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" });
                          }
                        }}
                        className={`h-14 w-full min-w-[80px] rounded border px-1.5 text-left transition hover:scale-[1.02] ${TCM_STATUS_COLOR[status]}`}
                        title={cell?.description ?? "OK"}
                      >
                        <div className="text-[9px] uppercase tracking-wider opacity-80">{TCM_STATUS_LABEL[status]}</div>
                        {cell && cell.impact > 0 && <div className="text-[10px] font-semibold tabular-nums">{fmtBRL(cell.impact)}</div>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card flex flex-wrap gap-3 p-3 text-[11px]">
        {(Object.keys(TCM_STATUS_LABEL) as TcmStatus[]).map((s) => (
          <span key={s} className={`rounded-full border px-2 py-0.5 ${TCM_STATUS_COLOR[s]}`}>{TCM_STATUS_LABEL[s]}</span>
        ))}
      </div>
    </div>
  );
}

function CrossSheet({ cross, onClose }: { cross: TcmCross | null; onClose: () => void }) {
  return (
    <Sheet open={!!cross} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {cross && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${TCM_STATUS_COLOR[cross.status]}`}>{TCM_STATUS_LABEL[cross.status]}</span>
                {cross.row} × {cross.col}
              </SheetTitle>
              <SheetDescription>{cross.description}</SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-3 text-xs">
              <Row k="Empresa" v={cross.company} />
              <Row k="Estabelecimento" v={cross.establishment} />
              <Row k="Competência" v={cross.competence} />
              <Row k="Arquivos confrontados" v={`${cross.row} × ${cross.col}`} />
              <Row k="Valor esperado" v={fmtBRL(cross.expected)} />
              <Row k="Valor encontrado" v={fmtBRL(cross.found)} />
              <Row k="Diferença" v={<span className="text-warning">{fmtBRL(cross.expected - cross.found)}</span>} />
              <Row k="Impacto financeiro" v={<span className="font-semibold">{fmtBRL(cross.impact)}</span>} />
              <Row k="Confiança da IA" v={`${cross.confidence}%`} />
              <Row k="Origem do dado" v="Cruzamento fiscal simulado" />
              <Row k="Responsável sugerido" v={cross.owner} />
              <Row k="Status de validação" v="Pendente" />

              <div className="rounded-md border border-cyan/20 bg-cyan/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-cyan">Recomendação da CognIA</div>
                <p className="mt-1 text-xs text-foreground">{cross.recommendation}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <ActBtn label="Enviar para validação" onClick={() => { addLog({ action: "tax_confrontation_matrix.validation.approved", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Enviado para validação humana"); }} />
              <ActBtn label="Criar ação" onClick={() => { addLog({ action: "tax_confrontation_matrix.action.created", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Ação criada"); }} />
              <ActBtn label="Ignorar" onClick={() => { addLog({ action: "tax_confrontation_matrix.crosscheck.opened", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0", result: "success" }); toast("Item ignorado"); }} />
              <ActBtn label="Gerar relatório" onClick={() => { addLog({ action: "tax_confrontation_matrix.report.generated", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Relatório mockado gerado"); }} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
function ActBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button size="sm" variant="outline" onClick={onClick}>{label}</Button>;
}

/* ============================== TRIBUTES ============================== */
function TributeTab({ tribute }: { tribute: string }) {
  const opps = tcmOpportunities.filter((o) => o.tribute === tribute);
  const conts = tcmContingencies.filter((c) => c.tribute === tribute);
  const totalOpp = opps.reduce((s, o) => s + o.potential, 0);
  const totalCont = conts.reduce((s, c) => s + c.exposure, 0);
  const rec = tcmRecommendations.find((r) => r.tribute === tribute);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Alíquota efetiva atual" value="1,50%" />
        <Kpi label="Após oportunidades" value="1,35%" accent="text-cyan" />
        <Kpi label={`Oportunidades ${tribute}`} value={fmtBRL(totalOpp)} accent="text-cyan" />
        <Kpi label={`Contingências ${tribute}`} value={fmtBRL(totalCont)} accent="text-risk" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Histórico ({tribute})</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tcmTributeEvolution}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CARD} formatter={(v: number) => fmtBRL(v)} />
              <Bar dataKey={tributeKey(tribute)} fill={COLORS.cyan} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Por estabelecimento / UF</h3>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-muted-foreground">
                <tr><th className="p-2 text-left">Estabelecimento</th><th className="p-2 text-left">UF</th><th className="p-2 text-right">Oportunidades</th><th className="p-2 text-right">Contingências</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tcmByEstablishment.map((e) => (
                  <tr key={e.est}><td className="p-2">{e.est}</td><td className="p-2">{e.uf}</td>
                    <td className="p-2 text-right tabular-nums text-cyan">{fmtBRL(e.oport)}</td>
                    <td className="p-2 text-right tabular-nums text-risk">{fmtBRL(e.conting)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TableCard title={`Oportunidades — ${tribute}`}>
          {opps.length === 0
            ? <Empty text="Sem oportunidades mapeadas." />
            : opps.map((o) => (
              <tr key={o.id} className="border-b border-white/5">
                <td className="p-2">{o.kind}</td>
                <td className="p-2 text-muted-foreground">{o.description}</td>
                <td className="p-2 text-right tabular-nums text-cyan">{fmtBRL(o.potential)}</td>
              </tr>
            ))}
        </TableCard>
        <TableCard title={`Contingências — ${tribute}`}>
          {conts.length === 0
            ? <Empty text="Sem contingências mapeadas." />
            : conts.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="p-2">{c.origin}</td>
                <td className="p-2 text-muted-foreground">{c.description}</td>
                <td className="p-2 text-right tabular-nums text-risk">{fmtBRL(c.exposure)}</td>
              </tr>
            ))}
        </TableCard>
      </div>

      {rec && (
        <div className="glass-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-cyan">Recomendação da CognIA</div>
          <div className="mt-1 text-sm">{rec.action}</div>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Impacto estimado: <b className="text-foreground">{fmtBRL(rec.impact)}</b></span>
            <span>Confiança {rec.confidence}%</span>
            <Button size="sm" className="ml-auto bg-gradient-to-r from-primary to-purple text-white"
              onClick={() => { addLog({ action: "tax_confrontation_matrix.validation.approved", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Enviado para validação humana"); }}>
              <Send className="mr-1 h-3 w-3" /> Enviar para validação humana
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function tributeKey(t: string) {
  const map: Record<string, string> = { "ICMS": "ICMS", "IPI": "IPI", "PIS/COFINS": "PIS/COFINS", "IRPJ/CSLL": "IRPJ/CSLL", "Previdenciário": "INSS" };
  return map[t] ?? "Total";
}
function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-white/5 p-3 text-sm font-semibold">{title}</div>
      <table className="w-full text-xs">
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <tr><td className="p-6 text-center text-muted-foreground">{text}</td></tr>;
}

/* ============================== REFORM ============================== */
function ReformTab() {
  const [ibs, setIbs] = useState(tcmReformScenario.defaults.IBS);
  const [cbs, setCbs] = useState(tcmReformScenario.defaults.CBS);
  const [is, setIs] = useState(tcmReformScenario.defaults.IS);
  const [simpleExit, setSimpleExit] = useState(0);

  const bars = [
    { name: "Atual", value: tcmReformScenario.current.taxes },
    { name: "Reforma", value: tcmReformScenario.reform.taxes },
  ];
  const priceImpact = [
    { name: "Compra", Atual: 1.0, Reforma: 1 + (ibs + cbs) / 1000 },
    { name: "Venda",  Atual: 1.0, Reforma: 1 + (ibs + cbs) / 900 },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Impacto da Reforma Tributária</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Cenário Atual</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Small l="Receita Bruta" v={fmtBRL(tcmReformScenario.current.revenue)} />
            <Small l="Compra Bruta" v={fmtBRL(tcmReformScenario.current.purchases)} />
            <Small l="Tributos Apurados" v={fmtBRL(tcmReformScenario.current.taxes)} />
            <Small l="Carga Tributária" v={`${tcmReformScenario.current.load}%`} accent="text-warning" />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="mb-3 text-xs uppercase tracking-widest text-cyan">Cenário Reforma</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Small l="Receita Projetada" v={fmtBRL(tcmReformScenario.reform.revenue)} />
            <Small l="Compra Projetada" v={fmtBRL(tcmReformScenario.reform.purchases)} />
            <Small l="Tributos Projetados" v={fmtBRL(tcmReformScenario.reform.taxes)} accent="text-risk" />
            <Small l="Carga Projetada" v={`${tcmReformScenario.reform.load}%`} accent="text-risk" />
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Parâmetros de simulação</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <NumInput label="IBS (%)" value={ibs} onChange={setIbs} />
          <NumInput label="CBS (%)" value={cbs} onChange={setCbs} />
          <NumInput label="IS (%)" value={is} onChange={setIs} />
          <NumInput label="% fornecedores fora do SN" value={simpleExit} onChange={setSimpleExit} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { addLog({ action: "tax_confrontation_matrix.reform_simulation.generated", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Simulação executada"); }}>Simular cenário</Button>
          <Button size="sm" variant="outline" onClick={() => toast.success("Simulação mockada salva")}>Salvar simulação mockada</Button>
          <Button size="sm" variant="outline" onClick={() => { addLog({ action: "tax_confrontation_matrix.report.generated", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Relatório executivo gerado"); }}><FileDown className="mr-1 h-3 w-3" /> Gerar relatório executivo</Button>
          <Button size="sm" variant="outline" onClick={() => { addLog({ action: "tax_confrontation_matrix.validation.approved", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Enviado para validação tributária"); }}><Send className="mr-1 h-3 w-3" /> Enviar para validação</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Tributos atuais × reforma</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bars}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip contentStyle={CARD} formatter={(v: number) => fmtBRL(v)} />
              <Bar dataKey="value" fill={COLORS.cyan} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Impacto no preço</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priceImpact}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={CARD} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Atual" fill={COLORS.primary} />
              <Bar dataKey="Reforma" fill={COLORS.risk} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-md border border-cyan/20 bg-cyan/5 p-3 text-xs">
        Com os parâmetros simulados, a carga tributária projetada aumenta de {tcmReformScenario.current.load}% para {tcmReformScenario.reform.load}%,
        indicando necessidade de revisão de preço, margem e fornecedores.
      </div>
    </div>
  );
}

function Small({ l, v, accent }: { l: string; v: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
      <div className={`text-base font-semibold tabular-nums ${accent ?? ""}`}>{v}</div>
    </div>
  );
}
function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="border-white/5 bg-white/5" />
    </div>
  );
}

/* ============================== OPPORTUNITIES ============================== */
function OpportunitiesTab() {
  const [q, setQ] = useState("");
  const list = tcmOpportunities.filter((o) => `${o.tribute} ${o.kind} ${o.description}`.toLowerCase().includes(q.toLowerCase()));
  const total = list.reduce((s, o) => s + o.potential, 0);
  const validated = list.filter((o) => o.status === "validado").reduce((s, o) => s + o.validated, 0);
  const inVal = list.filter((o) => o.status === "em_validacao").reduce((s, o) => s + o.potential, 0);
  const usable = list.filter((o) => o.status === "aproveitado" || o.status === "em_execucao").reduce((s, o) => s + o.validated, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Total identificado" value={fmtBRL(total)} accent="text-cyan" />
        <Kpi label="Em validação" value={fmtBRL(inVal)} accent="text-warning" />
        <Kpi label="Validado" value={fmtBRL(validated)} accent="text-success" />
        <Kpi label="Aproveitado" value={fmtBRL(usable)} />
        <Kpi label="Success fee potencial (15%)" value={fmtBRL(total * 0.15)} accent="text-purple" />
      </div>

      <div className="glass-card flex items-center gap-2 p-2">
        <Search className="ml-2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar oportunidade..." className="border-none bg-transparent" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white/5 text-[10px] uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">ID</th><th className="p-2 text-left">Tributo</th><th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Descrição</th><th className="p-2 text-left">Arquivos</th>
              <th className="p-2 text-right">Potencial</th><th className="p-2 text-right">Validado</th>
              <th className="p-2 text-left">Status</th><th className="p-2 text-right">Confiança</th><th className="p-2 text-left">Responsável</th>
              <th className="p-2 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {list.map((o) => (
              <tr key={o.id}>
                <td className="p-2 font-mono text-[10px]">{o.id}</td>
                <td className="p-2">{o.tribute}</td>
                <td className="p-2">{o.kind}</td>
                <td className="p-2 text-muted-foreground">{o.description}</td>
                <td className="p-2 text-muted-foreground">{o.sources}</td>
                <td className="p-2 text-right tabular-nums text-cyan">{fmtBRL(o.potential)}</td>
                <td className="p-2 text-right tabular-nums">{o.validated ? fmtBRL(o.validated) : "—"}</td>
                <td className="p-2"><span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px]">{o.status.replace("_", " ")}</span></td>
                <td className="p-2 text-right">{o.confidence}%</td>
                <td className="p-2">{o.owner}</td>
                <td className="p-2 text-center">
                  <Button size="sm" variant="ghost" className="h-6 text-cyan" onClick={() => { addLog({ action: "tax_confrontation_matrix.opportunity.created", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" }); toast.success("Enviado para validação humana"); }}>Validar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== CONTINGENCIES ============================== */
function ContingenciesTab() {
  const scatter = tcmContingencies.map((c) => ({
    x: { baixa: 1, media: 2, alta: 3 }[c.probability],
    y: { baixo: 1, medio: 2, alto: 3, critico: 4 }[c.severity],
    z: c.exposure,
    name: c.description,
  }));

  return (
    <div className="space-y-4">
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white/5 text-[10px] uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">ID</th><th className="p-2 text-left">Tributo</th><th className="p-2 text-left">Origem</th>
              <th className="p-2 text-left">Descrição</th><th className="p-2 text-left">Arquivos</th>
              <th className="p-2 text-right">Exposição</th><th className="p-2 text-left">Severidade</th>
              <th className="p-2 text-left">Probabilidade</th><th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Recomendação</th><th className="p-2 text-left">Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tcmContingencies.map((c) => (
              <tr key={c.id}>
                <td className="p-2 font-mono text-[10px]">{c.id}</td>
                <td className="p-2">{c.tribute}</td>
                <td className="p-2">{c.origin}</td>
                <td className="p-2 text-muted-foreground">{c.description}</td>
                <td className="p-2 text-muted-foreground">{c.sources}</td>
                <td className="p-2 text-right tabular-nums text-risk">{fmtBRL(c.exposure)}</td>
                <td className="p-2"><UrgencyBadge value={c.severity} /></td>
                <td className="p-2">{c.probability}</td>
                <td className="p-2">{c.status.replace("_", " ")}</td>
                <td className="p-2 text-muted-foreground">{c.recommendation}</td>
                <td className="p-2">{c.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Matriz Impacto × Probabilidade</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="Probabilidade" domain={[0, 4]} ticks={[1, 2, 3]} tickFormatter={(v: number) => (["", "Baixa", "Média", "Alta"][v] ?? "")} tick={{ fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="Severidade" domain={[0, 5]} ticks={[1, 2, 3, 4]} tickFormatter={(v: number) => (["", "Baixo", "Médio", "Alto", "Crítico"][v] ?? "")} tick={{ fontSize: 11 }} />
            <ZAxis type="number" dataKey="z" range={[60, 400]} />
            <Tooltip contentStyle={CARD} cursor={{ strokeDasharray: "3 3" }} formatter={(_v, _n, p: any) => [fmtBRL(p.payload.z), p.payload.name]} />
            <Scatter data={scatter} fill={COLORS.risk} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ============================== VALIDATION ============================== */
function ValidationTab({ items, setItems }: { items: TcmValidation[]; setItems: (v: TcmValidation[]) => void }) {
  const [reject, setReject] = useState<TcmValidation | null>(null);
  const [correct, setCorrect] = useState<TcmValidation | null>(null);
  const [reason, setReason] = useState("");
  const [correction, setCorrection] = useState({ value: "", note: "", classification: "", owner: "", motive: "" });

  function update(id: string, patch: Partial<TcmValidation>) {
    setItems(items.map((i) => i.id === id ? { ...i, ...patch } : i));
  }
  function approve(v: TcmValidation) {
    update(v.id, { status: "aprovado" });
    addLog({ action: "tax_confrontation_matrix.validation.approved", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" });
    toast.success("Aprovado");
  }
  function askDoc(v: TcmValidation) {
    addLog({ action: "tax_confrontation_matrix.action.created", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" });
    toast("Documento solicitado ao responsável");
    update(v.id, { status: "especialista" });
  }
  function sendSpecialist(v: TcmValidation) {
    update(v.id, { status: "especialista" });
    addLog({ action: "tax_confrontation_matrix.action.created", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" });
    toast.success("Encaminhado ao especialista");
  }

  return (
    <div className="space-y-4">
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white/5 text-[10px] uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Tributo</th>
              <th className="p-2 text-left">Descrição</th><th className="p-2 text-right">Valor</th>
              <th className="p-2 text-right">Confiança</th><th className="p-2 text-left">Severidade</th>
              <th className="p-2 text-left">Responsável</th><th className="p-2 text-left">Status</th>
              <th className="p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((v) => (
              <tr key={v.id}>
                <td className="p-2 capitalize">{v.kind}</td>
                <td className="p-2">{v.tribute}</td>
                <td className="p-2 text-muted-foreground">{v.description}</td>
                <td className="p-2 text-right tabular-nums">{fmtBRL(v.value)}</td>
                <td className="p-2 text-right">{v.confidence}%</td>
                <td className="p-2"><UrgencyBadge value={v.severity} /></td>
                <td className="p-2">{v.owner}</td>
                <td className="p-2"><span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] capitalize">{v.status}</span></td>
                <td className="p-2">
                  <div className="flex flex-wrap justify-center gap-1">
                    <IconBtn title="Aprovar" onClick={() => approve(v)} className="text-success"><CheckCircle2 className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn title="Corrigir" onClick={() => setCorrect(v)} className="text-cyan"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn title="Rejeitar" onClick={() => setReject(v)} className="text-risk"><XCircle className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn title="Solicitar documento" onClick={() => askDoc(v)}><FileDown className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn title="Enviar para especialista" onClick={() => sendSpecialist(v)}><Send className="h-3.5 w-3.5" /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!reject} onOpenChange={(v) => { if (!v) setReject(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar item</DialogTitle></DialogHeader>
          <Textarea placeholder="Motivo da rejeição" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (!reason) return toast.error("Informe o motivo");
              if (reject) update(reject.id, { status: "rejeitado" });
              addLog({ action: "tax_confrontation_matrix.validation.rejected", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" });
              toast.success("Rejeitado");
              setReason(""); setReject(null);
            }}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!correct} onOpenChange={(v) => { if (!v) setCorrect(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Corrigir item</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Valor corrigido</Label><Input value={correction.value} onChange={(e) => setCorrection({ ...correction, value: e.target.value })} /></div>
            <div><Label>Classificação</Label><Input value={correction.classification} onChange={(e) => setCorrection({ ...correction, classification: e.target.value })} /></div>
            <div><Label>Responsável</Label><Input value={correction.owner} onChange={(e) => setCorrection({ ...correction, owner: e.target.value })} /></div>
            <div><Label>Motivo da correção</Label><Input value={correction.motive} onChange={(e) => setCorrection({ ...correction, motive: e.target.value })} /></div>
            <div><Label>Observação</Label><Textarea value={correction.note} onChange={(e) => setCorrection({ ...correction, note: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrect(null)}>Cancelar</Button>
            <Button onClick={() => {
              if (correct) update(correct.id, { status: "corrigido" });
              addLog({ action: "tax_confrontation_matrix.validation.corrected", resource: "tax_matrix", engine: "tax", engineVersion: "tax-engine-v1.0.0" });
              toast.success("Correção registrada");
              setCorrect(null);
            }}>Salvar correção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IconBtn({ children, onClick, title, className }: { children: React.ReactNode; onClick: () => void; title: string; className?: string }) {
  return (
    <button title={title} onClick={onClick} className={`grid h-7 w-7 place-items-center rounded border border-white/10 bg-white/5 transition hover:bg-white/10 ${className ?? ""}`}>
      {children}
    </button>
  );
}
