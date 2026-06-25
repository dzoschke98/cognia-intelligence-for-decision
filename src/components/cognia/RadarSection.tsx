import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/cognia/store";
import { RiskBadge } from "@/components/cognia/Badges";
import { Radar, ArrowRight } from "lucide-react";

export function RadarSection({ limit = 4 }: { limit?: number }) {
  const radar = useStore((s) => s.radar);
  const items = radar.slice(0, limit);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
            <Radar className="h-3.5 w-3.5" /> Radar de Inteligência
          </div>
          <h2 className="text-lg font-semibold">Atualizações relevantes conectadas à sua carteira jurídica e tributária</h2>
        </div>
        <Link to="/radar" className="text-xs text-cyan hover:underline">Ver radar completo →</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((u) => (
          <div key={u.id} className="group rounded-lg border border-white/5 bg-white/5 p-4 transition hover:border-white/15 hover:bg-white/10">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan">{u.area}</span>
              <RiskBadge risk={u.relevance} />
            </div>
            <h3 className="mt-2 text-sm font-semibold">{u.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{u.summary}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{u.source} · {new Date(u.date).toLocaleDateString("pt-BR")}</span>
              <span className="text-foreground">{u.impactedCount} {u.impactedKind}</span>
            </div>
            <div className="mt-3 rounded-md border border-white/5 bg-background/40 p-2 text-[11px]">
              <span className="text-cyan">Ação sugerida:</span> {u.suggestedAction}
            </div>
            <Link to="/radar/$id" params={{ id: u.id }} className="mt-3 inline-flex items-center gap-1 text-xs text-cyan hover:underline">
              Ver impacto na carteira <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[10px] text-muted-foreground">Dados mockados. Atualizações simuladas para demonstração do MVP.</div>
    </div>
  );
}
