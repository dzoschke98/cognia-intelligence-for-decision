import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompany, setTaxStatus } from "@/lib/cognia/store";
import { RiskBadge, StatusBadge, ConfidenceIndicator, EngineVersionBadge } from "@/components/cognia/Badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtBRL, fmtDateTime } from "@/lib/cognia/format";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, Pencil, TrendingUp } from "lucide-react";
import { DisclaimerMVP } from "./legal.$id";

export const Route = createFileRoute("/tax/$id")({
  head: () => ({ meta: [{ title: "Diagnóstico Tributário — CognIA" }] }),
  component: () => <AppShell><TaxDetail /></AppShell>,
});

function TaxDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const analysis = useStore((s) => s.tax.find((a) => a.id === id));
  const [rejectOpen, setRejectOpen] = useState(false);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [score, setScore] = useState(analysis?.fiscalScore ?? 50);
  const [summary, setSummary] = useState(analysis?.summary ?? "");
  const [note, setNote] = useState("");

  if (!analysis) return (
    <div className="space-y-4"><p>Diagnóstico não encontrado.</p><Link to="/tax" className="text-cyan">Voltar</Link></div>
  );

  function approve() { setTaxStatus(id, "aprovado"); toast.success("Diagnóstico aprovado"); }
  function reject() {
    if (!reason) return toast.error("Informe o motivo");
    setTaxStatus(id, "rejeitado", { reason }); setRejectOpen(false); toast.success("Diagnóstico rejeitado");
  }
  function correct() {
    setTaxStatus(id, "corrigido", { correction: { fiscalScore: score, summary }, note });
    setCorrectOpen(false); toast.success("Diagnóstico corrigido");
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate({ to: "/tax" })} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar para Tax Engine
      </button>

      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-cyan">Diagnóstico tributário</div>
            <h1 className="text-2xl font-semibold tracking-tight">{getCompany(analysis.companyId)?.name}</h1>
            <div className="text-sm text-muted-foreground">{analysis.fileType} · Competência {analysis.competence}</div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <StatusBadge status={analysis.validationStatus} />
              <RiskBadge risk={analysis.risk} />
              <ConfidenceIndicator value={analysis.confidence} />
              <EngineVersionBadge version={analysis.engineVersion} hash={analysis.promptHash} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Impacto financeiro estimado</div>
            <div className="text-3xl font-semibold tabular-nums text-success">{fmtBRL(analysis.financialImpact)}</div>
          </div>
        </div>
      </div>

      <DisclaimerMVP />

      <div className="glass-card p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan">Diagnóstico executivo</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
      </div>

      <Card title="Inconsistências">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Registro</th>
              <th className="px-3 py-2 text-left">Descrição</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-center">Severidade</th>
              <th className="px-3 py-2 text-left">Confiança</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {analysis.inconsistencies.map((it, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-medium">{it.type}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{it.registry}</td>
                <td className="px-3 py-2 text-muted-foreground">{it.description}</td>
                <td className="px-3 py-2 text-right tabular-nums text-risk">{fmtBRL(it.value)}</td>
                <td className="px-3 py-2 text-center"><RiskBadge risk={it.severity} /></td>
                <td className="px-3 py-2"><ConfidenceIndicator value={it.confidence} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan">Oportunidades tributárias</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analysis.opportunities.map((o, i) => (
            <div key={i} className="glass-card group relative overflow-hidden p-4">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-success/40 to-cyan/40 opacity-20 blur-2xl group-hover:opacity-40" />
              <TrendingUp className="h-4 w-4 text-success" />
              <div className="mt-2 text-xs text-muted-foreground">{o.title}</div>
              <div className="text-xl font-semibold tabular-nums">{o.value > 0 ? fmtBRL(o.value) : "—"}</div>
              <p className="mt-2 text-xs text-muted-foreground">{o.description}</p>
            </div>
          ))}
        </div>
      </div>

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

      <Card title="Validação humana">
        <p className="mb-4 text-xs text-muted-foreground">Recomenda-se validar com tributarista antes de qualquer ação. A decisão final é sempre humana.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={approve} className="bg-success/20 text-success border border-success/30 hover:bg-success/30"><CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar diagnóstico</Button>
          <Button onClick={() => setCorrectOpen(true)} variant="outline" className="border-cyan/30 text-cyan hover:bg-cyan/10"><Pencil className="mr-2 h-4 w-4" /> Corrigir diagnóstico</Button>
          <Button onClick={() => setRejectOpen(true)} variant="outline" className="border-risk/30 text-risk hover:bg-risk/10"><XCircle className="mr-2 h-4 w-4" /> Rejeitar diagnóstico</Button>
        </div>
        {analysis.rejectionReason && <div className="mt-3 rounded-md border border-risk/20 bg-risk/10 p-3 text-xs"><b>Motivo:</b> {analysis.rejectionReason}</div>}
        {analysis.correctionNote && <div className="mt-3 rounded-md border border-cyan/20 bg-cyan/10 p-3 text-xs"><b>Observação:</b> {analysis.correctionNote}</div>}
        <div className="mt-4 text-xs text-muted-foreground">Última atualização: {fmtDateTime(analysis.createdAt)} · Responsável: {analysis.responsible}</div>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar diagnóstico</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo da rejeição..." />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button onClick={reject} className="bg-risk text-white">Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Corrigir diagnóstico</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Score fiscal (0-100)</Label><Input type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Resumo</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} /></div>
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
