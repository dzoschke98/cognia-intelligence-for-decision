import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompany, getCompanies, generateMockLegal } from "@/lib/cognia/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge, StatusBadge, ConfidenceIndicator } from "@/components/cognia/Badges";
import { fmtBRL, fmtDate } from "@/lib/cognia/format";
import { Plus, Search, Scale, LineChart } from "lucide-react";
import { toast } from "sonner";
import { SummaryFooter } from "@/components/cognia/SummaryFooter";

export const Route = createFileRoute("/legal/")({
  head: () => ({ meta: [{ title: "Legal Engine — CognIA" }] }),
  component: () => <AppShell><LegalList /></AppShell>,
});

function LegalList() {
  const legal = useStore((s) => s.legal);
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("all");
  const [status, setStatus] = useState("all");
  const [company, setCompany] = useState<string>(activeCompanyId);
  const navigate = useNavigate();

  const filtered = useMemo(() => legal.filter((a) => {
    if (company !== "all" && a.companyId !== company) return false;
    if (risk !== "all" && a.risk !== risk) return false;
    if (status !== "all" && a.validationStatus !== status) return false;
    if (search && !`${a.processNumber} ${a.claimant} ${a.defendant}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [legal, risk, status, search, company]);

  async function createMock() {
    const t = toast.loading("Gerando análise jurídica…");
    try {
      const r = await generateMockLegal("co-1");
      toast.success("Análise gerada", { id: t });
      navigate({ to: "/legal/$id", params: { id: r.analysisId } });
    } catch { toast.error("Falha ao gerar", { id: t }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
            <Scale className="h-3.5 w-3.5" /> Legal Intelligence Engine
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Análises jurídicas</h1>
          <p className="text-sm text-muted-foreground">Processamento, extração e score de risco com validação humana.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-white/10">
            <Link to="/jurimetry"><LineChart className="mr-2 h-4 w-4" /> Jurimetria Trabalhista</Link>
          </Button>
          <Button onClick={createMock} className="bg-gradient-to-r from-primary to-purple text-white">
            <Plus className="mr-2 h-4 w-4" /> Nova análise jurídica
          </Button>
        </div>
      </div>

      <div className="glass-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar processo, parte..." className="pl-9 border-white/5 bg-white/5" />
        </div>
        <Select value={risk} onValueChange={setRisk}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Risco" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os riscos</SelectItem>
            <SelectItem value="baixo">Baixo</SelectItem>
            <SelectItem value="medio">Médio</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="corrigido">Corrigido</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={company} onValueChange={setCompany}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {getCompanies().map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Processo</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Reclamante</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-center">Risco</th>
              <th className="px-4 py-3 text-left">Confiança</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((a) => (
              <tr key={a.id} className="cursor-pointer transition hover:bg-white/5" onClick={() => navigate({ to: "/legal/$id", params: { id: a.id } })}>
                <td className="px-4 py-3 font-mono text-xs">{a.processNumber}</td>
                <td className="px-4 py-3">{getCompany(a.companyId)?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.claimant}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(a.estimatedValue)}</td>
                <td className="px-4 py-3 text-center"><RiskBadge risk={a.risk} /></td>
                <td className="px-4 py-3"><ConfidenceIndicator value={a.confidence} /></td>
                <td className="px-4 py-3 text-center"><StatusBadge status={a.validationStatus} /></td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(a.createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma análise encontrada com os filtros aplicados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <SummaryFooter
        recordCount={filtered.length}
        recordLabel="processos"
        items={[
          { label: "Valor total estimado", value: fmtBRL(filtered.reduce((s, a) => s + a.estimatedValue, 0)), color: "cyan" },
          { label: "Pendentes de validação", value: String(filtered.filter((a) => a.validationStatus === "pendente").length), color: "warning" },
          { label: "Alto ou crítico risco", value: String(filtered.filter((a) => a.risk === "alto" || a.risk === "critico").length), color: "risk" },
        ]}
      />
    </div>
  );
}
