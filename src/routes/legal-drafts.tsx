import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, createDraft, updateDraft, setDraftStatus, logDraft } from "@/lib/cognia/store";
import { fmtBRL, fmtDateTime } from "@/lib/cognia/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PenSquare, Plus, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import type { LegalDraft, DraftPole, DraftArea } from "@/lib/cognia/types";

const TYPES = [
  "Petição inicial trabalhista", "Contestação trabalhista", "Réplica",
  "Manifestação sobre documentos", "Recurso ordinário", "Agravo",
  "Embargos de declaração", "Acordo", "Notificação extrajudicial",
  "Parecer preliminar", "Defesa administrativa tributária", "Impugnação",
  "Requerimento de compensação/restituição",
];

export const Route = createFileRoute("/legal-drafts")({
  head: () => ({ meta: [{ title: "Gera Minutas e Petições — CognIA" }] }),
  component: () => <AppShell><LegalDrafts /></AppShell>,
});

function LegalDrafts() {
  const drafts = useStore((s) => s.drafts);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<LegalDraft | null>(null);

  const kpis = useMemo(() => ({
    created: drafts.length,
    review: drafts.filter((d) => d.status === "em_revisao").length,
    approved: drafts.filter((d) => d.status === "aprovada").length,
    rejected: drafts.filter((d) => d.status === "rejeitada").length,
    linked: drafts.filter((d) => d.status === "vinculada" || d.linkedProcessId).length,
  }), [drafts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
            <PenSquare className="h-3.5 w-3.5" /> Legal Engine · Assistente de peças
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Gera Minutas e Petições</h1>
          <p className="text-sm text-muted-foreground">Geração assistida de minutas jurídicas com base em dados, pedidos, valores e estratégia.</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="bg-gradient-to-r from-primary to-purple text-white">
          <Plus className="mr-1.5 h-4 w-4" /> Nova minuta ou petição
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
        <span>Minuta gerada por IA para apoio ao advogado. O conteúdo deve ser revisado, ajustado e validado antes de qualquer protocolo.</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Minutas criadas" value={String(kpis.created)} />
        <Kpi label="Em revisão" value={String(kpis.review)} accent="text-warning" />
        <Kpi label="Aprovadas" value={String(kpis.approved)} accent="text-success" />
        <Kpi label="Rejeitadas" value={String(kpis.rejected)} accent="text-risk" />
        <Kpi label="Vinculadas a processo" value={String(kpis.linked)} accent="text-cyan" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-left">Processo</th>
              <th className="px-3 py-2 text-left">Polo</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-left">Responsável</th>
              <th className="px-3 py-2 text-left">Atualização</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {drafts.map((d) => (
              <tr key={d.id} className="cursor-pointer hover:bg-white/5" onClick={() => setEditing(d)}>
                <td className="px-3 py-2 font-medium">{d.type}</td>
                <td className="px-3 py-2">{d.clientName}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{d.processNumber ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{d.pole === "polo_ativo" ? "Ativo" : d.pole === "polo_passivo" ? "Passivo" : d.pole === "terceiro" ? "Terceiro" : "Consultivo"}</td>
                <td className="px-3 py-2 text-center text-[10px] uppercase text-muted-foreground">{d.status.replace("_", " ")}</td>
                <td className="px-3 py-2 text-muted-foreground">{d.responsible}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDateTime(d.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DraftWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={(d) => setEditing(d)} />
      <DraftEditor draft={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function DraftWizard({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (d: LegalDraft) => void }) {
  const [pole, setPole] = useState<DraftPole>("polo_passivo");
  const [area, setArea] = useState<DraftArea>("Trabalhista");
  const [type, setType] = useState(TYPES[1]);
  const [client, setClient] = useState("");
  const [counter, setCounter] = useState("");
  const [processNumber, setProcess] = useState("");
  const [summary, setSummary] = useState("");
  const [objective, setObjective] = useState("");
  const [total, setTotal] = useState(50000);

  function submit() {
    if (!client) return toast.error("Informe o nome do cliente");
    const d = createDraft({
      type, area, pole, clientName: client, counterparty: counter || "—",
      processNumber: processNumber || undefined,
      summary, objective, totalValue: total,
      content: buildContent({ type, pole, client, counter, summary, objective, total }),
    });
    toast.success("Minuta gerada pela IA");
    onOpenChange(false);
    onCreated(d);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0B0F1A]">
        <DialogHeader>
          <DialogTitle>Nova minuta ou petição</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Cliente atua como</Label>
            <Select value={pole} onValueChange={(v) => setPole(v as DraftPole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="polo_ativo">Polo ativo</SelectItem>
                <SelectItem value="polo_passivo">Polo passivo</SelectItem>
                <SelectItem value="terceiro">Terceiro interessado</SelectItem>
                <SelectItem value="consultivo">Consultivo/preventivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Área</Label>
            <Select value={area} onValueChange={(v) => setArea(v as DraftArea)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                <SelectItem value="Cível">Cível</SelectItem>
                <SelectItem value="Tributário">Tributário</SelectItem>
                <SelectItem value="Administrativo">Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Tipo de peça</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Cliente</Label><Input value={client} onChange={(e) => setClient(e.target.value)} /></div>
          <div><Label>Parte contrária</Label><Input value={counter} onChange={(e) => setCounter(e.target.value)} /></div>
          <div><Label>Processo (opcional)</Label><Input value={processNumber} onChange={(e) => setProcess(e.target.value)} /></div>
          <div><Label>Valor da causa (R$)</Label><Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} /></div>
          <div className="sm:col-span-2"><Label>Objetivo da peça</Label><Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} /></div>
          <div className="sm:col-span-2"><Label>Resumo dos fatos</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} /></div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-gradient-to-r from-primary to-purple text-white" onClick={submit}>
            <FileText className="mr-1.5 h-4 w-4" /> Gerar minuta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildContent(x: { type: string; pole: string; client: string; counter: string; summary: string; objective: string; total: number }) {
  return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A)

Referência: ${x.type}

I — DAS PARTES
${x.pole === "polo_ativo" ? "Requerente" : "Requerido/Reclamada"}: ${x.client}
${x.pole === "polo_ativo" ? "Requerido" : "Requerente/Reclamante"}: ${x.counter}

II — DOS FATOS
${x.summary || "[Resumo dos fatos]"}

III — DO OBJETIVO
${x.objective || "[Objetivo da peça]"}

IV — DOS FUNDAMENTOS
${x.pole === "polo_ativo" ? "A tese inicial encontra amparo em jurisprudência dominante." : "A tese defensiva sustenta-se nos documentos anexos e no princípio da eventualidade."}

V — DOS PEDIDOS
${x.pole === "polo_ativo" ? "Requer-se a procedência integral dos pedidos formulados." : "Requer-se a improcedência dos pedidos formulados."}

VI — DO VALOR
Atribui-se à causa o valor de ${fmtBRL(x.total)}.

Termos em que pede deferimento.

⚠ MINUTA GERADA POR IA — revisão humana obrigatória antes de qualquer protocolo.`;
}

function DraftEditor({ draft, onClose }: { draft: LegalDraft | null; onClose: () => void }) {
  const [content, setContent] = useState(draft?.content ?? "");
  if (draft && content !== draft.content && content === "") setContent(draft.content);
  return (
    <Sheet open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto bg-[#0B0F1A]">
        {draft && (
          <>
            <SheetHeader>
              <SheetTitle>{draft.type} · {draft.clientName}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <Textarea value={content || draft.content} onChange={(e) => setContent(e.target.value)} rows={22} className="font-mono text-xs" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button size="sm" variant="outline" onClick={() => { updateDraft(draft.id, { content }); toast.success("Rascunho salvo"); }}>Salvar rascunho</Button>
                <Button size="sm" variant="outline" onClick={() => { setDraftStatus(draft.id, "em_revisao"); toast.success("Enviado para revisão"); onClose(); }}>Enviar revisão</Button>
                <Button size="sm" className="bg-success text-white" onClick={() => { setDraftStatus(draft.id, "aprovada"); toast.success("Minuta aprovada"); onClose(); }}>Aprovar</Button>
                <Button size="sm" variant="outline" onClick={() => { logDraft("legal_draft.exported_mock"); toast.success("DOCX exportado (mock)"); }}>Exportar DOCX</Button>
                <Button size="sm" variant="outline" onClick={() => { logDraft("legal_draft.linked_to_process"); setDraftStatus(draft.id, "vinculada"); toast.success("Vinculada ao processo"); }}>Vincular processo</Button>
                <Button size="sm" variant="outline" onClick={() => { logDraft("legal_draft.edited"); toast("Nova versão gerada"); }}>Gerar nova versão</Button>
                <Button size="sm" variant="ghost" className="text-risk sm:col-span-2" onClick={() => { setDraftStatus(draft.id, "rejeitada"); toast.error("Minuta rejeitada"); onClose(); }}>Rejeitar</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Kpi({ label, value, accent = "" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}
