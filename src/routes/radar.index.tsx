import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompany } from "@/lib/cognia/store";
import { RiskBadge } from "@/components/cognia/Badges";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radar, Search, AlertTriangle, BellRing, Sparkles, FileText, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/radar/")({
  head: () => ({ meta: [{ title: "Radar de Inteligência — CognIA" }] }),
  component: () => <AppShell><RadarList /></AppShell>,
});

const areas = ["Trabalhista", "Tributário", "Reforma Tributária", "Compliance", "Jurisprudência"];

function RadarList() {
  const radar = useStore((s) => s.radar);
  const [area, setArea] = useState("all");
  const [relevance, setRelevance] = useState("all");
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = useMemo(() => radar.filter((r) => {
    if (area !== "all" && r.area !== area) return false;
    if (relevance !== "all" && r.relevance !== relevance) return false;
    if (status !== "all" && r.status !== status) return false;
    if (company !== "all" && r.companyId !== company) return false;
    if (search && !`${r.title} ${r.summary}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [radar, area, relevance, status, company, search]);

  const critical = radar.filter((r) => r.relevance === "critico" || r.relevance === "alto").length;
  const processosImpactados = radar.reduce((s, r) => s + (r.impactedKind === "processos" ? r.impactedCount : 0), 0);
  const oportunidades = radar.filter((r) => r.area === "Tributário" || r.area === "Reforma Tributária").length;
  const pendentes = radar.filter((r) => r.status === "novo" || r.status === "em_revisao").length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
          <Radar className="h-3.5 w-3.5" /> CognIA Radar de Inteligência
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Atualizações externas, impactos internos e ações recomendadas</h1>
        <p className="text-sm text-muted-foreground">A CognIA interpreta atualizações e conecta com sua carteira: <i>atualização relevante → impacto na carteira → recomendação de ação.</i></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard icon={Radar} label="Atualizações monitoradas" value={String(radar.length)} />
        <KpiCard icon={BellRing} label="Alertas críticos" value={String(critical)} />
        <KpiCard icon={FileText} label="Processos impactados" value={String(processosImpactados)} />
        <KpiCard icon={Sparkles} label="Oportunidades" value={String(oportunidades)} />
        <KpiCard icon={CheckCircle2} label="Recomendações pendentes" value={String(pendentes)} />
      </div>

      <div className="glass-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar atualização…" className="pl-9 border-white/5 bg-white/5" />
        </div>
        <Select value={area} onValueChange={setArea}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas as áreas</SelectItem>{areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={relevance} onValueChange={setRelevance}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Relevância" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda relevância</SelectItem>
            <SelectItem value="baixo">Baixa</SelectItem>
            <SelectItem value="medio">Média</SelectItem>
            <SelectItem value="alto">Alta</SelectItem>
            <SelectItem value="critico">Crítica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="analisado">Analisado</SelectItem>
            <SelectItem value="em_revisao">Em revisão</SelectItem>
            <SelectItem value="acao_criada">Ação criada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={company} onValueChange={setCompany}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            <SelectItem value="co-1">Empresa 1</SelectItem>
            <SelectItem value="co-2">Empresa 2</SelectItem>
            <SelectItem value="co-3">Empresa 3</SelectItem>
            <SelectItem value="co-4">Empresa 4</SelectItem>
            <SelectItem value="co-5">Empresa 5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Área</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Fonte</th>
              <th className="px-4 py-3 text-center">Relevância</th>
              <th className="px-4 py-3 text-right">Impacto</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r) => (
              <tr key={r.id} className="cursor-pointer transition hover:bg-white/5" onClick={() => navigate({ to: "/radar/$id", params: { id: r.id } })}>
                <td className="px-4 py-3 text-muted-foreground">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3"><span className="rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan">{r.area}</span></td>
                <td className="px-4 py-3 max-w-[420px]"><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground line-clamp-1">{r.summary}</div></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.source}</td>
                <td className="px-4 py-3 text-center"><RiskBadge risk={r.relevance} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{r.impactedCount} {r.impactedKind}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{getCompany(r.companyId)?.name ?? "—"}</td>
                <td className="px-4 py-3 text-center"><StatusPill status={r.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma atualização encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-muted-foreground">Dados mockados. Atualizações simuladas para demonstração do MVP.</div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-cyan" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    novo: "bg-primary/15 text-primary border-primary/30",
    analisado: "bg-cyan/15 text-cyan border-cyan/30",
    em_revisao: "bg-warning/15 text-warning border-warning/30",
    acao_criada: "bg-success/15 text-success border-success/30",
  };
  const labels: Record<string, string> = { novo: "Novo", analisado: "Analisado", em_revisao: "Em revisão", acao_criada: "Ação criada" };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status]}`}>{labels[status]}</span>;
}
