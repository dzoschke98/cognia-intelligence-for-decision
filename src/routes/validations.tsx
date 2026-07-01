import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, setLegalStatus, setTaxStatus, getCompany } from "@/lib/cognia/store";
import { RiskBadge, StatusBadge, ConfidenceIndicator } from "@/components/cognia/Badges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { relativeTime } from "@/lib/cognia/format";
import { fmtBRL } from "@/lib/cognia/format";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import type { LegalAnalysis, TaxAnalysis } from "@/lib/cognia/types";
import { SummaryFooter } from "@/components/cognia/SummaryFooter";

export const Route = createFileRoute("/validations")({
  head: () => ({ meta: [{ title: "Validações — CognIA" }] }),
  component: () => <AppShell><Validations /></AppShell>,
});

type Item = {
  id: string; kind: "Jurídica" | "Tributária"; title: string; engine: string;
  confidence: number; risk: import("@/lib/cognia/types").RiskLevel; status: import("@/lib/cognia/types").ValidationStatus;
  owner: string; createdAt: string; route: "/legal/$id" | "/tax/$id"; companyId: string;
};

function Validations() {
  const legal = useStore((s) => s.legal);
  const tax = useStore((s) => s.tax);
  const navigate = useNavigate();
  const [review, setReview] = useState<{ item: Item; data: LegalAnalysis | TaxAnalysis } | null>(null);

  const items: Item[] = [
    ...legal.map<Item>((a) => ({
      id: a.id, kind: "Jurídica", title: a.processNumber, engine: a.engineVersion,
      confidence: a.confidence, risk: a.risk, status: a.validationStatus,
      owner: a.responsible, createdAt: a.createdAt, route: "/legal/$id", companyId: a.companyId,
    })),
    ...tax.map<Item>((a) => ({
      id: a.id, kind: "Tributária", title: `${a.fileType} · ${a.competence}`, engine: a.engineVersion,
      confidence: a.confidence, risk: a.risk, status: a.validationStatus,
      owner: a.responsible, createdAt: a.createdAt, route: "/tax/$id", companyId: a.companyId,
    })),
  ];

  const counts = {
    pendente: items.filter((i) => i.status === "pendente").length,
    aprovado: items.filter((i) => i.status === "aprovado").length,
    corrigido: items.filter((i) => i.status === "corrigido").length,
    rejeitado: items.filter((i) => i.status === "rejeitado").length,
    lowConf: items.filter((i) => i.confidence < 75).length,
  };

  function approve(it: Item) {
    (it.kind === "Jurídica" ? setLegalStatus : setTaxStatus)(it.id, "aprovado");
    toast.success(`${it.kind} aprovada`);
  }
  function reject(it: Item) {
    (it.kind === "Jurídica" ? setLegalStatus : setTaxStatus)(it.id, "rejeitado", { reason: "Rejeitado pela fila de validação." });
    toast.success(`${it.kind} rejeitada`);
  }
  function openReview(it: Item) {
    const data = it.kind === "Jurídica"
      ? legal.find((a) => a.id === it.id) as LegalAnalysis
      : tax.find((a) => a.id === it.id) as TaxAnalysis;
    setReview({ item: it, data });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-cyan">Governança</div>
        <h1 className="text-3xl font-semibold tracking-tight">Validação humana</h1>
        <p className="text-sm text-muted-foreground">Fila de análises aguardando revisão pelo especialista responsável.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <Counter label="Pendentes" value={counts.pendente} tone="text-warning" />
        <Counter label="Aprovadas" value={counts.aprovado} tone="text-success" />
        <Counter label="Corrigidas" value={counts.corrigido} tone="text-cyan" />
        <Counter label="Rejeitadas" value={counts.rejeitado} tone="text-risk" />
        <Counter label="Baixa confiança" value={counts.lowConf} tone="text-purple" />
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-accent/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Engine</th>
              <th className="px-4 py-3 text-left">Confiança</th>
              <th className="px-4 py-3 text-center">Risco</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Responsável</th>
              <th className="px-4 py-3 text-left">Aguardando</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((it) => (
              <tr key={`${it.kind}-${it.id}`} className="hover:bg-accent/40">
                <td className="px-4 py-3"><span className="rounded border border-border bg-accent/40 px-2 py-0.5 text-xs">{it.kind}</span></td>
                <td className="px-4 py-3 font-medium">{it.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{it.engine}</td>
                <td className="px-4 py-3"><ConfidenceIndicator value={it.confidence} /></td>
                <td className="px-4 py-3 text-center"><RiskBadge risk={it.risk} /></td>
                <td className="px-4 py-3 text-center"><StatusBadge status={it.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{it.owner}</td>
                <td className="px-4 py-3 text-muted-foreground">{relativeTime(it.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openReview(it)} title="Revisar completo">
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                    {it.status === "pendente" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => approve(it)} className="text-success" title="Aprovar rápido"><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => reject(it)} className="text-risk" title="Rejeitar rápido"><XCircle className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => navigate({ to: it.route, params: { id: it.id } })} className="text-xs text-cyan">Abrir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SummaryFooter
        recordCount={items.length}
        recordLabel="análises"
        items={[
          { label: "Pendentes", value: String(counts.pendente), color: "warning" },
          { label: "Aprovadas", value: String(counts.aprovado), color: "success" },
          { label: "Corrigidas", value: String(counts.corrigido), color: "cyan" },
          { label: "Rejeitadas", value: String(counts.rejeitado), color: "risk" },
        ]}
      />

      <ReviewSheet review={review} onClose={() => setReview(null)} />
    </div>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="glass-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function ReviewSheet({ review, onClose }: { review: { item: Item; data: LegalAnalysis | TaxAnalysis } | null; onClose: () => void }) {
  const [note, setNote] = useState("");
  if (!review) return (
    <Sheet open={false} onOpenChange={() => {}}>
      <SheetContent />
    </Sheet>
  );
  const { item, data } = review;

  function apply(status: "aprovado" | "corrigido" | "rejeitado") {
    if ((status === "corrigido" || status === "rejeitado") && !note.trim()) {
      toast.error("Comentário é obrigatório para corrigir ou rejeitar");
      return;
    }
    const fn = item.kind === "Jurídica" ? setLegalStatus : setTaxStatus;
    fn(item.id, status, status === "rejeitado" ? { reason: note } : { note });
    toast.success(status === "aprovado" ? "Análise aprovada" : status === "corrigido" ? "Análise aprovada com correção" : "Análise rejeitada");
    setNote("");
    onClose();
  }

  return (
    <Sheet open={!!review} onOpenChange={(v) => { if (!v) { setNote(""); onClose(); } }}>
      <SheetContent side="right" className="w-[600px] max-w-full overflow-y-auto sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="rounded border border-border bg-accent/40 px-2 py-0.5 text-xs">{item.kind}</span>
            <span className="truncate">{item.title}</span>
          </SheetTitle>
          <SheetDescription>{getCompany(item.companyId)?.name} · {item.engine}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <RiskBadge risk={item.risk} />
          <ConfidenceIndicator value={item.confidence} />
        </div>

        {item.kind === "Jurídica" ? <LegalReview a={data as LegalAnalysis} /> : <TaxReview a={data as TaxAnalysis} />}

        <div className="mt-6 space-y-3 rounded-lg border border-border bg-accent/40 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan">Validação do especialista</div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comentário / justificativa (obrigatório ao corrigir ou rejeitar)…" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => apply("aprovado")} className="bg-success text-white hover:bg-success/90">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Aprovar
            </Button>
            <Button size="sm" variant="outline" onClick={() => apply("corrigido")} className="border-cyan/30 text-cyan">
              Aprovar com correção
            </Button>
            <Button size="sm" variant="outline" onClick={() => apply("rejeitado")} className="border-risk/30 text-risk">
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Rejeitar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LegalReview({ a }: { a: LegalAnalysis }) {
  return (
    <div className="mt-4 space-y-4 text-sm">
      <div>
        <div className="text-xs font-semibold uppercase text-cyan">Resumo</div>
        <p className="mt-1 text-muted-foreground">{a.summary}</p>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase text-cyan">Score de risco</div>
        <div className="mt-1 flex items-center gap-3">
          <Progress value={a.riskScore} className="flex-1" />
          <span className="font-bold tabular-nums">{a.riskScore}</span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase text-cyan">Partes</div>
        <ul className="mt-1 text-xs text-muted-foreground">
          {a.parties.map((p, i) => <li key={i}>{p.role}: {p.name}</li>)}
        </ul>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase text-cyan">Pedidos</div>
        <table className="mt-1 w-full text-xs">
          <thead className="text-muted-foreground"><tr><th className="text-left">Pedido</th><th className="text-right">Valor</th><th>Risco</th></tr></thead>
          <tbody className="divide-y divide-border">
            {a.claims.map((c, i) => (
              <tr key={i}><td>{c.claim}</td><td className="text-right tabular-nums">{fmtBRL(c.estimatedValue)}</td><td className="text-center"><RiskBadge risk={c.risk} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaxReview({ a }: { a: TaxAnalysis }) {
  return (
    <div className="mt-4 space-y-4 text-sm">
      <div>
        <div className="text-xs font-semibold uppercase text-cyan">Resumo</div>
        <p className="mt-1 text-muted-foreground">{a.summary}</p>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase text-cyan">Inconsistências</div>
        <table className="mt-1 w-full text-xs">
          <thead className="text-muted-foreground"><tr><th className="text-left">Tipo</th><th className="text-left">Descrição</th><th className="text-right">Valor</th></tr></thead>
          <tbody className="divide-y divide-border">
            {a.inconsistencies.map((c, i) => (
              <tr key={i}><td>{c.type}</td><td className="text-muted-foreground">{c.description}</td><td className="text-right tabular-nums text-risk">{fmtBRL(c.value)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase text-cyan">Oportunidades</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.opportunities.map((o, i) => (
            <li key={i} className="flex justify-between border-b border-border py-1">
              <span>{o.title}</span><span className="text-success tabular-nums">{fmtBRL(o.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
