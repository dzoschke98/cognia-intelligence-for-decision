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
  const raw = useStore((s) => s.radar.find((r) => r.id === id));
  const update = raw ? enrichRadar(raw) : null;
  const recent = useStore((s) => s.radar).filter((r) => r.id !== id).slice(0, 4).map(enrichRadar);

  useEffect(() => {
    if (raw && raw.status === "novo") setRadarStatus(raw.id, "lido");
    if (raw) logRadarImpact(raw.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!update) return <div className="text-sm text-muted-foreground">Atualização não encontrada.</div>;
  const u = update;

  function handleCreate(title: string) {
    createRadarAction(u.id, title);
    toast.success("Ação programada criada", { description: "Recomendação enviada para o Decision Engine." });
  }
  function handleDismiss() { dismissRadarSuggestion(u.id); toast("Recomendação descartada"); }
  function handleFav() { const f = toggleRadarFavorite(u.id); toast(f ? "Adicionado aos favoritos" : "Removido dos favoritos"); }
  function handleShare() {
    logRadarShareWhatsApp(u.id);
    try { const w = window.open(whatsAppShareUrl(u), "_blank", "noopener"); if (!w) throw new Error("blocked"); toast.success("WhatsApp aberto"); }
    catch { toast("Link de compartilhamento gerado (mock)"); }
  }
  function handleQueue() { sendRadarToWorkQueue(u.id, "sugestao_ia"); toast.success("Pendência criada na Central de Pendências"); }
  function handleValidation() { setRadarStatus(u.id, "enviado_validacao"); toast.success("Enviado para validação humana"); }
  function handleSummary() { generateRadarExecutiveSummary(u.id); toast.success("Resumo executivo gerado (mock)"); }
  function handleAgenda() {
    createRadarAgendaEvent(u.id, {
      title: `Revisar: ${u.title}`,
      date: new Date(Date.now() + 3 * 86400000).toISOString(),
      responsible: u.suggestions[0]?.owner ?? "Renata Almeida",
      priority: u.relevance,
    });
    toast.success("Lembrete criado na Agenda Geral");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/radar" className="inline-flex items-center gap-1 text-xs text-cyan hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Radar
        </Link>
        <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs">Descartar recomendação</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <article className="glass-card overflow-hidden">
            <div className={`relative h-48 bg-gradient-to-br ${u.gradient}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.15),transparent_60%)]" />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur">{u.area}</span>
                <RiskBadge risk={u.relevance} />
              </div>
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-semibold tracking-tight">{u.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{u.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span>{u.author}</span>
                <span>· {u.source}</span>
                <span>· {new Date(u.date).toLocaleDateString("pt-BR")}</span>
                <span>· ~{u.readingMinutes} min</span>
                <span>· Score {u.impactScore}/100</span>
                <span>· Empresa <b className="text-foreground">{getCompany(u.companyId)?.name}</b></span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={handleFav} variant="outline"><Star className={`mr-1.5 h-3.5 w-3.5 ${u.favorite ? "fill-warning text-warning" : ""}`} /> {u.favorite ? "Favoritado" : "Favoritar"}</Button>
                <Button size="sm" onClick={handleShare} variant="outline"><Share2 className="mr-1.5 h-3.5 w-3.5" /> Compartilhar WhatsApp</Button>
                <Button size="sm" onClick={handleSummary} variant="outline"><FileText className="mr-1.5 h-3.5 w-3.5" /> Gerar resumo executivo</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {u.tags.map((t) => <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>)}
              </div>
            </div>
          </article>

          <div className="glass-card p-6">
            <div className="text-xs uppercase tracking-widest text-cyan">Análise executiva</div>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {u.content.split("\n\n").map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, '<b class="text-foreground">$1</b>') }} />)}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan"><Radar className="h-3.5 w-3.5" /> Impacto na carteira</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <ImpactCard label="Itens impactados" value={`${u.impactedCount} ${u.impactedKind}`} />
              <ImpactCard label="Valor potencial" value={`R$ ${(u.potentialValue / 1000).toFixed(0)}k`} />
              <ImpactCard label="Confiança da IA" value={`${u.confidence}%`} />
              <ImpactCard label="Score de impacto" value={`${u.impactScore}/100`} />
              <ImpactCard label="Urgência" value={u.urgency} />
              <ImpactCard label="Status" value={u.status} />
            </div>
            <div className="mt-4 space-y-2">
              {u.impacts.length === 0 && <div className="text-xs text-muted-foreground">Mapeamento detalhado em processamento.</div>}
              {u.impacts.map((it, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-white/5 bg-white/5 p-3 text-sm">
                  <div><div className="font-mono text-xs">{it.ref}</div><div className="text-xs text-muted-foreground">{it.detail}</div></div>
                  {it.risk && <RiskBadge risk={it.risk} />}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan"><Sparkles className="h-3.5 w-3.5" /> Recomendação da CognIA</div>
            <ul className="mt-3 space-y-2 text-sm">
              {u.recommendations.map((r, i) => <li key={i} className="flex gap-2"><span className="text-cyan">•</span> {r}</li>)}
            </ul>
            <div className="mt-4 text-xs uppercase tracking-widest text-warning">Pontos que exigem validação humana</div>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {u.validationPoints.map((r, i) => <li key={i} className="flex gap-2"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" /> {r}</li>)}
            </ul>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan"><Sparkles className="h-3.5 w-3.5" /> Sugestões da CognIA</div>
            <p className="mt-1 text-xs text-muted-foreground">Recomenda-se avaliar — toda sugestão exige validação humana.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {u.suggestions.map((s) => (
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
        </div>

        <aside className="space-y-4">
          <div className="glass-card p-4">
            <div className="mb-3 text-xs uppercase tracking-widest text-cyan">Ações recomendadas</div>
            <div className="space-y-2">
              <Button size="sm" className="w-full justify-start bg-gradient-to-r from-primary to-purple text-white" onClick={handleQueue}><ListTodo className="mr-1.5 h-3.5 w-3.5" /> Criar pendência</Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={handleValidation}><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Enviar para validação</Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={handleAgenda}><CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Criar lembrete na Agenda</Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={handleSummary}><FileText className="mr-1.5 h-3.5 w-3.5" /> Gerar resumo executivo</Button>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="mb-3 text-xs uppercase tracking-widest text-cyan">Relacionadas</div>
            <div className="space-y-2">
              {recent.map((r) => (
                <Link key={r.id} to="/radar/$id" params={{ id: r.id }} className="block rounded-md border border-white/5 bg-white/5 p-2 hover:border-white/15">
                  <div className="line-clamp-2 text-xs font-medium">{r.title}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{r.area} · Score {r.impactScore}</div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="text-[10px] text-muted-foreground">MVP com dados mockados. Atualizações simuladas para demonstração. As recomendações exigem validação humana.</div>
    </div>
  );
}

function ImpactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
