import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompany, setLegalStatus } from "@/lib/cognia/store";
import { RiskBadge, StatusBadge, ConfidenceIndicator, EngineVersionBadge } from "@/components/cognia/Badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtBRL, fmtDateTime } from "@/lib/cognia/format";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, Pencil, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/legal/$id")({
  head: () => ({ meta: [{ title: "Análise Jurídica — CognIA" }] }),
  component: () => <AppShell><LegalDetail /></AppShell>,
});

function LegalDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const analysis = useStore((s) => s.legal.find((a) => a.id === id));
  const [rejectOpen, setRejectOpen] = useState(false);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [score, setScore] = useState(analysis?.riskScore ?? 50);
  const [summary, setSummary] = useState(analysis?.summary ?? "");
  const [recommendation, setRecommendation] = useState("");
  const [note, setNote] = useState("");

  if (!analysis) return (
    <div className="space-y-4">
      <p>Análise não encontrada.</p>
      <Link to="/legal" className="text-cyan">Voltar</Link>
    </div>
  );

  function approve() {
    setLegalStatus(id, "aprovado");
    toast.success("Análise aprovada");
  }
  function reject() {
    if (!reason) return toast.error("Informe o motivo");
    setLegalStatus(id, "rejeitado", { reason });
    setRejectOpen(false);
    toast.success("Análise rejeitada");
  }
  function correct() {
    const a = analysis!;
    setLegalStatus(id, "corrigido", {
      correction: { riskScore: score, summary, recommendations: recommendation ? [recommendation, ...a.recommendations] : a.recommendations },
      note,
    });
    setCorrectOpen(false);
    toast.success("Análise corrigida");
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate({ to: "/legal" })} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar para Legal Engine
      </button>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">Análise jurídica</div>
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{analysis.processNumber}</h1>
            <div className="text-sm text-muted-foreground">{getCompany(analysis.companyId)?.name} · {analysis.processType} · {analysis.uf}</div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <StatusBadge status={analysis.validationStatus} />
              <RiskBadge risk={analysis.risk} />
              <ConfidenceIndicator value={analysis.confidence} />
              <EngineVersionBadge version={analysis.engineVersion} hash={analysis.promptHash} />
              <span className="text-xs text-muted-foreground">Custo estimado: US$ {analysis.estimatedCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Valor estimado</div>
            <div className="text-3xl font-semibold tabular-nums">{fmtBRL(analysis.estimatedValue)}</div>
          </div>
        </div>
      </div>

      <DisclaimerMVP />

      {/* Summary + Score */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card lg:col-span-2 p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan">Resumo executivo</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
        </div>
        <div className="glass-card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan">Score de risco</h2>
          <RiskGauge score={analysis.riskScore} />
          <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            {analysis.riskJustification.map((j, i) => (
              <li key={i} className="flex gap-2"><span className="text-cyan">•</span> {j}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Parties & Claims */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Partes">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {analysis.parties.map((p, i) => (
                <tr key={i}>
                  <td className="py-2 pr-3 text-xs uppercase tracking-wider text-muted-foreground">{p.role}</td>
                  <td className="py-2">{p.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Fontes simuladas">
          <ul className="space-y-2 text-sm">
            {analysis.sources.map((s, i) => (
              <li key={i} className="flex gap-2"><span className="text-cyan">→</span> <span className="text-muted-foreground">{s}</span></li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Pedidos extraídos">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Pedido</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-center">Risco</th>
              <th className="px-3 py-2 text-left">Confiança</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {analysis.claims.map((c, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-medium">{c.claim}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.category}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtBRL(c.estimatedValue)}</td>
                <td className="px-3 py-2 text-center"><RiskBadge risk={c.risk} /></td>
                <td className="px-3 py-2"><ConfidenceIndicator value={c.confidence} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Recomendações">
        <ol className="space-y-2 text-sm">
          {analysis.recommendations.map((r, i) => (
            <li key={i} className="flex gap-3 rounded-md border border-white/5 bg-white/5 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cyan/15 text-xs font-semibold text-cyan">{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Validation */}
      <Card title="Validação humana">
        <p className="mb-4 text-xs text-muted-foreground">A análise deve ser revisada por especialista antes de qualquer ação. A decisão final é sempre humana.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={approve} className="bg-success/20 text-success border border-success/30 hover:bg-success/30">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar análise
          </Button>
          <Button onClick={() => setCorrectOpen(true)} variant="outline" className="border-cyan/30 text-cyan hover:bg-cyan/10">
            <Pencil className="mr-2 h-4 w-4" /> Corrigir análise
          </Button>
          <Button onClick={() => setRejectOpen(true)} variant="outline" className="border-risk/30 text-risk hover:bg-risk/10">
            <XCircle className="mr-2 h-4 w-4" /> Rejeitar análise
          </Button>
        </div>
        {analysis.rejectionReason && (
          <div className="mt-3 rounded-md border border-risk/20 bg-risk/10 p-3 text-xs"><b>Motivo da rejeição:</b> {analysis.rejectionReason}</div>
        )}
        {analysis.correctionNote && (
          <div className="mt-3 rounded-md border border-cyan/20 bg-cyan/10 p-3 text-xs"><b>Observação do especialista:</b> {analysis.correctionNote}</div>
        )}
        <div className="mt-4 text-xs text-muted-foreground">Última atualização: {fmtDateTime(analysis.createdAt)} · Responsável: {analysis.responsible}</div>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar análise</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo da rejeição..." />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button onClick={reject} className="bg-risk text-white">Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Corrigir análise</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Score de risco (0-100)</Label><Input type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Resumo</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} /></div>
            <div className="space-y-1.5"><Label>Nova recomendação</Label><Input value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="Recomendação adicional..." /></div>
            <div className="space-y-1.5"><Label>Observação do especialista</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCorrectOpen(false)}>Cancelar</Button>
            <Button onClick={correct} className="bg-cyan text-background">Salvar correção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan">{title}</h2>
      {children}
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const tone = score >= 81 ? "from-risk to-purple" : score >= 61 ? "from-orange-500 to-risk" : score >= 31 ? "from-warning to-orange-500" : "from-success to-cyan";
  const label = score >= 81 ? "Crítico" : score >= 61 ? "Alto" : score >= 31 ? "Médio" : "Baixo";
  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="text-4xl font-bold tabular-nums">{score}</span>
        <span className="text-sm text-muted-foreground">/100 · {label}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${score}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>0</span><span>30</span><span>60</span><span>80</span><span>100</span>
      </div>
    </div>
  );
}

export function DisclaimerMVP() {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-warning/20 bg-warning/5 p-3 text-xs text-muted-foreground">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      <span><b className="text-warning">Ambiente MVP com dados mockados.</b> As análises são simuladas e não representam parecer jurídico ou tributário.</span>
    </div>
  );
}
