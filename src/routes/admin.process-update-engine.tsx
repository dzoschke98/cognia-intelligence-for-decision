import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, runSourceSyncMock, setMovementStatus, logProcessEngine, currentUser, getCompany } from "@/lib/cognia/store";
import { fmtBRL, fmtDate, fmtDateTime, relativeTime } from "@/lib/cognia/format";
import { RiskBadge } from "@/components/cognia/Badges";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { RefreshCw, ShieldAlert, Activity, AlertTriangle, PlayCircle, ArrowRight } from "lucide-react";
import type { ProcessMovement } from "@/lib/cognia/types";

export const Route = createFileRoute("/admin/process-update-engine")({
  head: () => ({ meta: [{ title: "Motor Atualizador de Processos — CognIA" }] }),
  component: () => <AppShell><ProcessUpdateEngine /></AppShell>,
});

function ProcessUpdateEngine() {
  const user = currentUser();
  const sources = useStore((s) => s.sources);
  const movements = useStore((s) => s.movements);
  const [selected, setSelected] = useState<ProcessMovement | null>(null);

  if (user && user.role !== "Administrador") {
    return (
      <div className="glass-card p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-warning" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground">Este módulo é visível apenas para perfis Administrador.</p>
      </div>
    );
  }

  const monitored = 22840;
  const newMovs = movements.filter((m) => m.status === "novo").length;
  const updatedToday = movements.filter((m) => new Date(m.date).toDateString() === new Date().toDateString()).length;
  const reanalyses = movements.filter((m) => m.status === "reprocessado").length;
  const critical = movements.filter((m) => m.riskAfter >= 80).length;
  const failures = sources.filter((s) => s.status === "falha").length + 3;

  function sync(id: string) {
    const added = runSourceSyncMock(id);
    toast.success(`${added} novas movimentações importadas`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
            <RefreshCw className="h-3.5 w-3.5" /> Legal Engine Sync V1
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Motor Atualizador de Processos</h1>
          <p className="text-sm text-muted-foreground">Importação, atualização e reprocessamento inteligente de movimentações processuais.</p>
        </div>
        <span className="rounded-full border border-purple/30 bg-purple/10 px-3 py-1 text-[11px] font-medium text-purple">Admin Only</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Processos monitorados" value={monitored.toLocaleString("pt-BR")} />
        <Kpi label="Movimentações novas" value={String(newMovs)} accent="text-cyan" />
        <Kpi label="Atualizados hoje" value={String(updatedToday)} accent="text-success" />
        <Kpi label="Reanálises executadas" value={String(reanalyses)} accent="text-primary" />
        <Kpi label="Alertas críticos" value={String(critical)} accent="text-risk" />
        <Kpi label="Falhas de sincronização" value={String(failures)} accent="text-warning" />
        <Kpi label="Próxima execução" value="Hoje às 22h" />
        <Kpi label="Custo IA (mês)" value={fmtBRL(312.4)} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Fontes externas simuladas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((s) => (
            <div key={s.id} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{s.name}</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                  s.status === "ativo" ? "bg-success/15 text-success" :
                  s.status === "pausado" ? "bg-warning/15 text-warning" :
                  s.status === "falha" ? "bg-risk/15 text-risk" :
                  "bg-cyan/15 text-cyan"
                }`}>{s.status}</span>
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                <div>Última execução: {relativeTime(s.lastRunAt)}</div>
                <div>Processos: <span className="tabular-nums text-foreground">{s.linkedProcesses.toLocaleString("pt-BR")}</span></div>
                <div>Movimentações: <span className="tabular-nums text-foreground">{s.importedMovements.toLocaleString("pt-BR")}</span></div>
                <div>Taxa de sucesso: <span className="tabular-nums text-foreground">{s.successRate}%</span></div>
              </div>
              <Button size="sm" onClick={() => sync(s.id)} className="mt-3 w-full bg-gradient-to-r from-primary to-purple text-white">
                <PlayCircle className="mr-1.5 h-4 w-4" /> Executar sincronização mockada
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Movimentações importadas</h2>
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Processo</th>
                <th className="px-3 py-2 text-left">Fonte</th>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Impacto</th>
                <th className="px-3 py-2 text-center">Risco</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {movements.slice(0, 60).map((m) => (
                <tr key={m.id} className="cursor-pointer hover:bg-white/5" onClick={() => { setSelected(m); logProcessEngine("process_update_engine.viewed"); }}>
                  <td className="px-3 py-2 font-mono">{m.processNumber}</td>
                  <td className="px-3 py-2">{m.sourceName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtDate(m.date)}</td>
                  <td className="px-3 py-2">{m.type}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.impact}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`tabular-nums text-[11px] ${m.riskAfter > m.riskBefore ? "text-risk" : "text-success"}`}>
                      {m.riskBefore} → {m.riskAfter}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-[10px] uppercase text-muted-foreground">{m.status}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-cyan"><ArrowRight className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-[#0B0F1A]">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-sm">{selected.processNumber}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="glass-card p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Empresa</div>
                  <div>{getCompany(selected.companyId)?.name}</div>
                </div>
                <div className="glass-card space-y-1 p-3 text-xs">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Movimentação recebida</div>
                  <div className="font-medium">{selected.type}</div>
                  <div className="text-muted-foreground">{selected.summary}</div>
                  <div className="text-muted-foreground">{fmtDateTime(selected.date)} · {selected.sourceName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="glass-card p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Risco anterior</div>
                    <div className="text-xl font-semibold tabular-nums">{selected.riskBefore}</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Risco recalculado</div>
                    <div className={`text-xl font-semibold tabular-nums ${selected.riskAfter > selected.riskBefore ? "text-risk" : "text-success"}`}>{selected.riskAfter}</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor anterior</div>
                    <div className="text-sm font-semibold tabular-nums">{fmtBRL(selected.valueBefore)}</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Valor atualizado</div>
                    <div className={`text-sm font-semibold tabular-nums ${selected.valueAfter > selected.valueBefore ? "text-risk" : "text-success"}`}>{fmtBRL(selected.valueAfter)}</div>
                  </div>
                </div>
                <div className="glass-card p-3 text-xs">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Activity className="h-3 w-3" /> Recomendação da CognIA
                  </div>
                  <div>{selected.reason}</div>
                  <div className="mt-1 text-muted-foreground">Confiança: <span className="text-foreground tabular-nums">{selected.confidence}%</span></div>
                </div>
                <div className="rounded-md border border-warning/30 bg-warning/10 p-2 text-[11px]">
                  <AlertTriangle className="mr-1 inline h-3 w-3 text-warning" />
                  Necessidade de validação humana antes de qualquer ação processual.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-purple text-white" onClick={() => { setMovementStatus(selected.id, "validado"); toast.success("Enviado para validação"); setSelected(null); }}>Enviar validação</Button>
                  <Button size="sm" variant="outline" onClick={() => { setMovementStatus(selected.id, "reprocessado"); toast.success("Análise atualizada"); setSelected(null); }}>Atualizar análise</Button>
                  <Button size="sm" variant="outline" onClick={() => { logProcessEngine("process_update_engine.deadline.created"); toast.success("Prazo criado na Agenda"); }}>Criar prazo</Button>
                  <Button size="sm" variant="outline" onClick={() => { logProcessEngine("process_update_engine.draft_requested"); toast.success("Sugestão de peça criada"); }}>Gerar peça</Button>
                  <Button size="sm" variant="ghost" className="col-span-2 text-muted-foreground" onClick={() => { setMovementStatus(selected.id, "ignorado"); toast("Movimentação ignorada"); setSelected(null); }}>Ignorar movimentação</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
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
