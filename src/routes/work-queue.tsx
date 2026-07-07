import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, setWorkQueueStatus, delegateWorkQueue } from "@/lib/cognia/store";
import { labelForWorkQueueKind, labelForAgendaOrigin } from "@/lib/cognia/operationsMock";
import { fmtDate } from "@/lib/cognia/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ListTodo, Search, AlertTriangle } from "lucide-react";
import { RiskBadge } from "@/components/cognia/Badges";
import { SummaryFooter } from "@/components/cognia/SummaryFooter";
import { toast } from "sonner";
import type { WorkQueueItem } from "@/lib/cognia/types";

export const Route = createFileRoute("/work-queue")({
  head: () => ({ meta: [{ title: "Central de Pendências — CognIA" }] }),
  component: () => <AppShell><WorkQueue /></AppShell>,
});

function routeForKind(kind: WorkQueueItem["kind"]): string {
  switch (kind) {
    case "validacao_humana": return "/validations";
    case "minuta_revisao": return "/legal-drafts";
    case "cruzamento_pendente":
    case "oportunidade_tributaria":
    case "contingencia_sem_acao": return "/tax-confrontation-matrix";
    case "prazo_critico": return "/general-agenda";
    case "movimentacao_nova": return "/admin/process-update-engine";
    case "sugestao_ia": return "/jurimetry";
    default: return "/decision";
  }
}

function WorkQueue() {
  const items = useStore((s) => s.workQueue);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [delegateItem, setDelegateItem] = useState<WorkQueueItem | null>(null);
  const [delegateName, setDelegateName] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => items.filter((i) => {
    if (area !== "all" && i.area !== area) return false;
    if (priority !== "all" && i.priority !== priority) return false;
    if (status !== "all" && i.status !== status) return false;
    if (search && !`${i.title} ${i.detail}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, area, priority, status, search]);

  const now = new Date();
  const kpis = {
    total: items.length,
    critical: items.filter((i) => i.priority === "critico").length,
    dueToday: items.filter((i) => new Date(i.dueDate).toDateString() === now.toDateString()).length,
    awaitingValidation: items.filter((i) => i.kind === "validacao_humana").length,
    unassigned: items.filter((i) => !i.responsible).length,
    fromAI: items.filter((i) => i.origin === "sugestao_ia").length,
    tax: items.filter((i) => i.area === "tributario").length,
    legal: items.filter((i) => i.area === "juridico").length,
  };

  function openDelegate(item: WorkQueueItem) {
    setDelegateItem(item);
    setDelegateName(item.responsible ?? "");
  }
  function confirmDelegate() {
    if (!delegateItem) return;
    const name = delegateName.trim();
    if (!name) { toast.error("Informe o responsável"); return; }
    delegateWorkQueue(delegateItem.id, name);
    toast.success("Pendência delegada");
    setDelegateItem(null);
    setDelegateName("");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
          <ListTodo className="h-3.5 w-3.5" /> Operacional
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Central de Pendências</h1>
        <p className="text-sm text-muted-foreground">Consolida tudo que exige ação humana: validações, sugestões, prazos, cruzamentos e tarefas.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Kpi label="Pendências totais" value={String(kpis.total)} />
        <Kpi label="Críticas" value={String(kpis.critical)} accent="text-risk" />
        <Kpi label="Vencendo hoje" value={String(kpis.dueToday)} accent="text-warning" />
        <Kpi label="Aguardando validação" value={String(kpis.awaitingValidation)} accent="text-warning" />
        <Kpi label="Sem responsável" value={String(kpis.unassigned)} accent="text-risk" />
        <Kpi label="Criadas pela IA" value={String(kpis.fromAI)} accent="text-cyan" />
        <Kpi label="Tributárias" value={String(kpis.tax)} />
        <Kpi label="Jurídicas" value={String(kpis.legal)} />
      </div>

      <div className="glass-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pendência…" className="pl-9 border-white/5 bg-white/5" />
        </div>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            <SelectItem value="juridico">Jurídico</SelectItem>
            <SelectItem value="tributario">Tributário</SelectItem>
            <SelectItem value="executivo">Executivo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="medio">Médio</SelectItem>
            <SelectItem value="baixo">Baixo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="aberta">Aberta</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="delegada">Delegada</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Pendência</th>
              <th className="px-3 py-2 text-left">Área</th>
              <th className="px-3 py-2 text-left">Origem</th>
              <th className="px-3 py-2 text-left">Responsável</th>
              <th className="px-3 py-2 text-left">Vencimento</th>
              <th className="px-3 py-2 text-center">Prioridade</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-white/5">
                <td className="px-3 py-2">
                  <div className="font-medium">{labelForWorkQueueKind(i.kind)}</div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[280px]">{i.detail}</div>
                </td>
                <td className="px-3 py-2 text-muted-foreground capitalize">{i.area}</td>
                <td className="px-3 py-2 text-muted-foreground">{labelForAgendaOrigin(i.origin)}</td>
                <td className="px-3 py-2 text-muted-foreground">{i.responsible ?? <span className="text-risk">Sem responsável</span>}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtDate(i.dueDate)}</td>
                <td className="px-3 py-2 text-center"><RiskBadge risk={i.priority} /></td>
                <td className="px-3 py-2 text-center text-[10px] uppercase text-muted-foreground">{i.status.replace("_", " ")}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex flex-wrap justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-primary"
                      onClick={() => navigate({ to: routeForKind(i.kind) })}>
                      Ver
                    </Button>
                    {i.status !== "concluida" && (
                      <Button size="sm" variant="ghost" className="h-7 text-success"
                        onClick={() => { setWorkQueueStatus(i.id, "concluida"); toast.success("Pendência concluída"); }}>
                        Concluir
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-cyan" onClick={() => openDelegate(i)}>
                      Delegar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhuma pendência encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <SummaryFooter
        recordCount={filtered.length}
        recordLabel="pendências"
        items={[
          { label: "Críticas", value: String(filtered.filter((i) => i.priority === "critico").length), color: "risk" },
          { label: "Sem responsável", value: String(filtered.filter((i) => !i.responsible).length), color: "warning" },
          { label: "Concluídas", value: String(filtered.filter((i) => i.status === "concluida").length), color: "success" },
        ]}
      />

      <div className="flex items-start gap-2 rounded-md border border-cyan/20 bg-cyan/5 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
        Pendências consolidam sinais do Motor Atualizador, Jurimetria, Sugestões da IA, Gera Minutas, Malha Fiscal, Matriz de Confronto, Agenda Geral, Decision Engine e Validação Humana.
      </div>

      <Dialog open={!!delegateItem} onOpenChange={(o) => { if (!o) { setDelegateItem(null); setDelegateName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegar pendência</DialogTitle>
          </DialogHeader>
          {delegateItem && (
            <div className="space-y-3">
              <div className="rounded-md border border-white/10 bg-white/5 p-3 text-xs">
                <div className="font-medium">{labelForWorkQueueKind(delegateItem.kind)}</div>
                <div className="mt-1 text-muted-foreground">{delegateItem.detail}</div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delegate-name">Responsável</Label>
                <Input
                  id="delegate-name"
                  value={delegateName}
                  onChange={(e) => setDelegateName(e.target.value)}
                  placeholder="Nome do responsável"
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setDelegateItem(null); setDelegateName(""); }}>Cancelar</Button>
            <Button className="bg-gradient-to-r from-primary to-purple text-white" onClick={confirmDelegate}>
              Confirmar delegação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ label, value, accent = "" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}
