import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { graphNodes, graphEdges } from "@/lib/cognia/mockData";
import type { GraphNode } from "@/lib/cognia/types";
import { Network, X } from "lucide-react";

export const Route = createFileRoute("/knowledge-graph")({
  head: () => ({ meta: [{ title: "Knowledge Graph — CognIA" }] }),
  component: () => <AppShell><KG /></AppShell>,
});

const typeColor: Record<GraphNode["type"], string> = {
  Empresa: "#2563EB",
  Processo: "#7C3AED",
  Pedido: "#00C2BA",
  Tese: "#22C55E",
  Risco: "#EF4444",
  Tributo: "#FACC15",
  "Crédito": "#22C55E",
  Oportunidade: "#00C2BA",
  "Recomendação": "#7C3AED",
  "Validação": "#FACC15",
  Especialista: "#FFFFFF",
};

function KG() {
  const [selected, setSelected] = useState<GraphNode | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
          <Network className="h-3.5 w-3.5" /> Knowledge Graph
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Conexões inteligentes</h1>
        <p className="text-sm text-muted-foreground">
          O Knowledge Graph é o ativo que conecta dados, documentos, especialistas, análises e decisões ao longo do tempo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="glass-card overflow-auto p-2">
          <svg viewBox="0 0 800 680" className="h-[680px] w-full">
            <defs>
              <linearGradient id="edgeGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#00C2BA" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="3" /></filter>
            </defs>
            {graphEdges.map((e, i) => {
              const a = graphNodes.find((n) => n.id === e.from);
              const b = graphNodes.find((n) => n.id === e.to);
              if (!a || !b) return null;
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="url(#edgeGrad)" strokeWidth={1} opacity={0.5} />
              );
            })}
            {graphNodes.map((n) => {
              const isSel = selected?.id === n.id;
              return (
                <g key={n.id} className="cursor-pointer" onClick={() => setSelected(n)}>
                  <circle cx={n.x} cy={n.y} r={isSel ? 24 : 18}
                    fill={typeColor[n.type]} fillOpacity={0.15}
                    stroke={typeColor[n.type]} strokeWidth={isSel ? 2 : 1.2}
                    filter={isSel ? "url(#glow)" : undefined} />
                  <text x={n.x} y={n.y + 38} textAnchor="middle"
                    className="fill-white text-[10px] font-medium"
                    style={{ fontSize: 10 }}>
                    {n.label}
                  </text>
                  <text x={n.x} y={n.y + 4} textAnchor="middle"
                    className="fill-white" style={{ fontSize: 8, opacity: 0.8 }}>
                    {n.type[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan">Tipos de entidade</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(typeColor).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: v }} />
                  <span className="text-muted-foreground">{k}</span>
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: typeColor[selected.type] }}>{selected.type}</div>
                  <h3 className="text-base font-semibold">{selected.label}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{selected.description}</p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="text-muted-foreground">Conexões:</div>
                <ul className="space-y-1">
                  {graphEdges
                    .filter((e) => e.from === selected.id || e.to === selected.id)
                    .map((e, i) => {
                      const other = graphNodes.find((n) => n.id === (e.from === selected.id ? e.to : e.from));
                      return other ? (
                        <li key={i} className="flex items-center gap-2 rounded border border-white/5 bg-white/5 p-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: typeColor[other.type] }} />
                          <span>{other.label}</span>
                          <span className="ml-auto text-muted-foreground">{other.type}</span>
                        </li>
                      ) : null;
                    })}
                </ul>
                <div className="pt-2 text-muted-foreground">Última atualização: hoje</div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-4 text-xs text-muted-foreground">
              Clique em um nó do grafo para ver detalhes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
