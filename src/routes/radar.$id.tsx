import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/cognia/AppShell";
import {
  useStore, getCompany, createRadarAction, dismissRadarSuggestion, logRadarImpact, setRadarStatus,
  toggleRadarFavorite, logRadarShareWhatsApp, sendRadarToWorkQueue, createRadarAgendaEvent, generateRadarExecutiveSummary,
} from "@/lib/cognia/store";
import { enrichRadar, whatsAppShareUrl } from "@/lib/cognia/radarEnrich";
import { RiskBadge } from "@/components/cognia/Badges";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Radar, ShieldCheck, Sparkles, AlertTriangle, Star, Share2, ListTodo, CalendarDays, FileText } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/radar/$id")({
  head: () => ({ meta: [{ title: "Atualização — Radar CognIA" }] }),
  component: () => <AppShell><Detail /></AppShell>,
});

function Detail() {
  const { id } = useParams({ from: "/radar/$id" });
  const update = useStore((s) => s.radar.find((r) => r.id === id));

  useEffect(() => {
    if (update && update.status === "novo") setRadarStatus(update.id, "analisado");
    if (update) logRadarImpact(update.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!update) return <div className="text-sm text-muted-foreground">Atualização não encontrada.</div>;

  function handleCreate(title: string) {
    createRadarAction(update!.id, title);
    toast.success("Ação programada criada", { description: "Recomendação enviada para o Decision Engine." });
  }
  function handleDismiss() {
    dismissRadarSuggestion(update!.id);
    toast("Recomendação descartada");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/radar" className="inline-flex items-center gap-1 text-xs text-cyan hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Radar
        </Link>
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs">Descartar recomendação</Button>
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-cyan">{update.area}</span>
          <RiskBadge risk={update.relevance} />
          <span className="text-xs text-muted-foreground">{update.source} · {new Date(update.date).toLocaleDateString("pt-BR")}</span>
          <span className="ml-auto text-xs text-muted-foreground">Empresa: <b className="text-foreground">{getCompany(update.companyId)?.name}</b></span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{update.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{update.summary}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wider text-cyan">Por que isso importa?</div>
            <p className="mt-2 text-sm">{update.whyMatters}</p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wider text-cyan">Ação sugerida</div>
            <p className="mt-2 text-sm">{update.suggestedAction}</p>
            <div className="mt-3 text-[11px] text-muted-foreground"><AlertTriangle className="mr-1 inline h-3 w-3 text-warning" /> Recomenda-se avaliar e validar com especialista humano.</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
          <Radar className="h-3.5 w-3.5" /> Carteira impactada
        </div>
        <h2 className="mt-1 text-lg font-semibold">{update.impactedCount} {update.impactedKind} potencialmente impactados</h2>
        <div className="mt-4 space-y-2">
          {update.impacts.length === 0 && <div className="text-xs text-muted-foreground">Mapeamento detalhado de itens impactados em processamento.</div>}
          {update.impacts.map((it, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-white/5 bg-white/5 p-3 text-sm">
              <div>
                <div className="font-mono text-xs">{it.ref}</div>
                <div className="text-xs text-muted-foreground">{it.detail}</div>
              </div>
              {it.risk && <RiskBadge risk={it.risk} />}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
          <Sparkles className="h-3.5 w-3.5" /> Sugestões da CognIA
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Recomenda-se avaliar — toda sugestão exige validação humana.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {update.suggestions.map((s) => (
            <div key={s.id} className="rounded-lg border border-white/5 bg-white/5 p-4">
              <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{s.title}</h3><RiskBadge risk={s.priority} /></div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div>Responsável: <span className="text-foreground">{s.owner}</span></div>
                <div>Prazo: <span className="text-foreground">{s.deadline}</span></div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.reason}</p>
              <Button size="sm" className="mt-3 bg-gradient-to-r from-primary to-purple text-white" onClick={() => handleCreate(s.title)}>
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Criar ação programada
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground">Dados mockados. Atualizações simuladas para demonstração do MVP.</div>
    </div>
  );
}
