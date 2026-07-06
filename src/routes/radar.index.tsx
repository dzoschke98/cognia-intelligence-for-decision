import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompany, toggleRadarFavorite, logRadarShareWhatsApp } from "@/lib/cognia/store";
import { enrichRadar, whatsAppShareUrl } from "@/lib/cognia/radarEnrich";
import { RiskBadge } from "@/components/cognia/Badges";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Radar, Search, Sparkles, Star, BookmarkCheck, Share2, ArrowRight,
  FileSearch, AlertTriangle, ExternalLink, CalendarDays,
} from "lucide-react";
import type { RadarUpdate } from "@/lib/cognia/types";

export const Route = createFileRoute("/radar/")({
  head: () => ({ meta: [{ title: "Radar de Inteligência — CognIA" }] }),
  component: () => <AppShell><RadarPage /></AppShell>,
});

const AREAS = ["Trabalhista", "Tributário", "Reforma Tributária", "Compliance", "Jurisprudência", "Regulatório"];

function RadarPage() {
  const radar = useStore((s) => s.radar);
  const [area, setArea] = useState("all");
  const [rel, setRel] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const navigate = useNavigate();

  const enriched = useMemo(() => radar.map(enrichRadar), [radar]);
  const filtered = useMemo(() => enriched.filter((r) => {
    if (area !== "all" && r.area !== area) return false;
    if (rel !== "all" && r.relevance !== rel) return false;
    if (status !== "all") {
      if (status === "favoritado" && !r.favorite) return false;
      if (status !== "favoritado" && r.status !== status) return false;
    }
    if (onlyFavs && !r.favorite) return false;
    if (search && !`${r.title} ${r.summary} ${(r.tags ?? []).join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [enriched, area, rel, status, search, onlyFavs]);

  const hero = filtered[0] ?? enriched[0];
  const grid = filtered.slice(hero ? 1 : 0);

  const favs = enriched.filter((r) => r.favorite);
  const critical = enriched.filter((r) => r.relevance === "critico" || r.relevance === "alto");
  const pending = enriched.filter((r) => r.status === "novo" || r.status === "em_revisao");
  const mostRelevant = [...enriched].sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0)).slice(0, 5);

  function handleShare(u: RadarUpdate) {
    logRadarShareWhatsApp(u.id);
    const url = whatsAppShareUrl(u);
    try {
      const w = window.open(url, "_blank", "noopener");
      if (!w) throw new Error("blocked");
      toast.success("Compartilhamento via WhatsApp aberto");
    } catch {
      toast("Link de compartilhamento gerado (mock)", { description: "Ambiente MVP — mensagem preparada." });
    }
  }
  function handleFav(u: RadarUpdate) {
    const isFav = toggleRadarFavorite(u.id);
    toast(isFav ? "Adicionado aos favoritos" : "Removido dos favoritos");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
            <Radar className="h-3.5 w-3.5" /> CognIA Radar
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Radar de Inteligência</h1>
          <p className="text-sm text-muted-foreground">Atualizações relevantes, impactos na carteira e recomendações da CognIA.</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-muted-foreground max-w-md">
          MVP com dados mockados. Atualizações simuladas para demonstração. As recomendações exigem validação humana.
        </div>
      </div>

      {/* KPIs favoritos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={BookmarkCheck} label="Itens salvos para análise" value={String(favs.length)} accent="from-cyan/40 to-primary/40" />
        <Kpi icon={AlertTriangle} label="Favoritos críticos" value={String(favs.filter((f) => f.relevance === "critico" || f.relevance === "alto").length)} accent="from-risk/40 to-warning/40" />
        <Kpi icon={Sparkles} label="Alertas críticos totais" value={String(critical.length)} accent="from-warning/40 to-purple/40" />
        <Kpi icon={FileSearch} label="Pendentes de análise" value={String(pending.length)} accent="from-purple/40 to-primary/40" />
      </div>

      {/* Filtros */}
      <div className="glass-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar temas, normas, decisões..." className="pl-9 border-white/5 bg-white/5" />
        </div>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas as áreas</SelectItem>{AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={rel} onValueChange={setRel}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Relevância" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda relevância</SelectItem>
            <SelectItem value="baixo">Baixa</SelectItem><SelectItem value="medio">Média</SelectItem>
            <SelectItem value="alto">Alta</SelectItem><SelectItem value="critico">Crítica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="lido">Lido</SelectItem>
            <SelectItem value="favoritado">Favoritado</SelectItem>
            <SelectItem value="em_revisao">Em análise</SelectItem>
            <SelectItem value="acao_criada">Ação criada</SelectItem>
            <SelectItem value="enviado_validacao">Enviado para validação</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={onlyFavs ? "default" : "ghost"} size="sm" onClick={() => setOnlyFavs((v) => !v)} className={onlyFavs ? "bg-gradient-to-r from-primary to-purple text-white" : ""}>
          <Star className="mr-1.5 h-3.5 w-3.5" /> Favoritos
        </Button>
        <Button variant="ghost" size="sm" onClick={() => toast("Radar atualizado (mock)")}>
          <Radar className="mr-1.5 h-3.5 w-3.5" /> Atualizar radar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Coluna principal */}
        <div className="space-y-6">
          {/* Hero */}
          {hero && (
            <article className="glass-card overflow-hidden">
              <div className={`relative h-52 w-full bg-gradient-to-br ${hero.gradient}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur">{hero.area}</span>
                  <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur">Análise exclusiva CognIA</span>
                </div>
                <div className="absolute right-4 top-4"><RiskBadge risk={hero.relevance} /></div>
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-semibold leading-tight">{hero.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{hero.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(hero.date).toLocaleDateString("pt-BR")}</span>
                  <span>· {hero.source}</span>
                  <span>· <b className="text-foreground">{hero.impactedCount}</b> {hero.impactedKind} impactados</span>
                  <span>· Score de impacto: <b className="text-cyan">{hero.impactScore}/100</b></span>
                  <span>· ~{hero.readingMinutes} min de leitura</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={() => navigate({ to: "/radar/$id", params: { id: hero.id } })} className="bg-gradient-to-r from-primary to-purple text-white">
                    Ler análise <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate({ to: "/radar/$id", params: { id: hero.id } })}>
                    <FileSearch className="mr-1.5 h-3.5 w-3.5" /> Ver impacto na carteira
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleFav(hero)}>
                    <Star className={`mr-1.5 h-3.5 w-3.5 ${hero.favorite ? "fill-warning text-warning" : ""}`} /> {hero.favorite ? "Favoritado" : "Favoritar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleShare(hero)}>
                    <Share2 className="mr-1.5 h-3.5 w-3.5" /> Compartilhar WhatsApp
                  </Button>
                </div>
              </div>
            </article>
          )}

          {/* Grid editorial */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inteligências recentes</h3>
              <span className="text-xs text-muted-foreground">{filtered.length} atualizações</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {grid.map((u) => (
                <NewsCard key={u.id} u={u} onFav={handleFav} onShare={handleShare} />
              ))}
              {grid.length === 0 && <div className="text-sm text-muted-foreground">Nenhum item encontrado com os filtros atuais.</div>}
            </div>
          </div>

          {/* Salvos para analisar depois */}
          {favs.length > 0 && (
            <div className="glass-card p-5">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
                <BookmarkCheck className="h-3.5 w-3.5" /> Salvos para analisar depois
              </div>
              <div className="space-y-2">
                {favs.slice(0, 6).map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-white/5 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{u.title}</div>
                      <div className="text-[11px] text-muted-foreground">{u.area} · {new Date(u.date).toLocaleDateString("pt-BR")} · {u.impactedCount} {u.impactedKind}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <RiskBadge risk={u.relevance} />
                      <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/radar/$id", params: { id: u.id } })}>Ler</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleFav(u)}>Remover</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <SidebarBlock title="Mais relevantes">
            {mostRelevant.map((u, i) => (
              <SidebarItem key={u.id} n={i + 1} u={u} onClick={() => navigate({ to: "/radar/$id", params: { id: u.id } })} />
            ))}
          </SidebarBlock>

          <SidebarBlock title="Favoritos recentes">
            {favs.length === 0 && <div className="text-xs text-muted-foreground">Nenhum favorito ainda. Clique na estrela em qualquer card para salvar.</div>}
            {favs.slice(0, 4).map((u) => (
              <SidebarItem key={u.id} u={u} onClick={() => navigate({ to: "/radar/$id", params: { id: u.id } })} icon={<Star className="h-3 w-3 fill-warning text-warning" />} />
            ))}
          </SidebarBlock>

          <SidebarBlock title="Pendentes de análise" badge={pending.length}>
            {pending.slice(0, 4).map((u) => (
              <SidebarItem key={u.id} u={u} onClick={() => navigate({ to: "/radar/$id", params: { id: u.id } })} />
            ))}
          </SidebarBlock>

          <div className="glass-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
              <Sparkles className="h-3.5 w-3.5" /> Sugestões da CognIA
            </div>
            <div className="space-y-2">
              {["Revisar processos de horas extras", "Validar crédito de PIS/COFINS", "Gerar relatório executivo da Reforma Tributária", "Enviar divergência para validação humana"].map((t) => (
                <div key={t} className="rounded-md border border-white/5 bg-white/5 p-2.5 text-xs">
                  <div className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-cyan" />{t}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="mb-3 text-xs uppercase tracking-widest text-cyan">Áreas monitoradas</div>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <span key={a} className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan">{a}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NewsCard({ u, onFav, onShare }: { u: ReturnType<typeof enrichRadar>; onFav: (u: RadarUpdate) => void; onShare: (u: RadarUpdate) => void }) {
  return (
    <article className="glass-card group overflow-hidden transition hover:border-white/20">
      <div className={`relative h-24 w-full bg-gradient-to-br ${u.gradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur">{u.area}</span>
        <div className="absolute right-3 top-3"><RiskBadge risk={u.relevance} /></div>
      </div>
      <div className="p-4">
        <Link to="/radar/$id" params={{ id: u.id }} className="text-sm font-semibold leading-snug hover:text-cyan">{u.title}</Link>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{u.summary}</p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{new Date(u.date).toLocaleDateString("pt-BR")}</span>
          <span>Impacto: <b className="text-cyan">{u.impactScore}</b> · {u.impactedCount} {u.impactedKind}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link to="/radar/$id" params={{ id: u.id }} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10">Ler <ExternalLink className="h-3 w-3" /></Link>
          <button onClick={() => onFav(u)} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10">
            <Star className={`h-3 w-3 ${u.favorite ? "fill-warning text-warning" : ""}`} /> {u.favorite ? "Favorito" : "Favoritar"}
          </button>
          <button onClick={() => onShare(u)} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10">
            <Share2 className="h-3 w-3" /> WhatsApp
          </button>
        </div>
      </div>
    </article>
  );
}

function SidebarBlock({ title, children, badge }: { title: string; children: React.ReactNode; badge?: number }) {
  return (
    <div className="glass-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-cyan">{title}</div>
        {badge !== undefined && badge > 0 && (
          <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">{badge}</span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function SidebarItem({ u, n, onClick, icon }: { u: any; n?: number; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-2 rounded-md border border-transparent p-2 text-left transition hover:border-white/10 hover:bg-white/5">
      {n !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{String(n).padStart(2, "0")}</span>}
      {icon}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-xs font-medium">{u.title}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">{u.area} · {getCompany(u.companyId)?.name ?? "—"}</div>
      </div>
      <span className="text-[11px] text-cyan tabular-nums">{u.impactScore}</span>
    </button>
  );
}
function Kpi({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <div className="glass-card relative overflow-hidden p-4">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-25 blur-2xl`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-cyan" />
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      </div>
    </div>
  );
}
// unused imports guard
void CalendarDays;
