import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompany, getCompanies, generateMockTax } from "@/lib/cognia/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge, StatusBadge, ConfidenceIndicator } from "@/components/cognia/Badges";
import { fmtBRL, fmtDate } from "@/lib/cognia/format";
import { Plus, Search, Receipt } from "lucide-react";
import { toast } from "sonner";
import { SummaryFooter } from "@/components/cognia/SummaryFooter";

export const Route = createFileRoute("/tax/")({
  head: () => ({ meta: [{ title: "Tax Engine — CognIA" }] }),
  component: () => <AppShell><TaxList /></AppShell>,
});

function TaxList() {
  const tax = useStore((s) => s.tax);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("all");
  const [status, setStatus] = useState("all");
  const [filetype, setFiletype] = useState("all");
  const navigate = useNavigate();

  const filtered = useMemo(() => tax.filter((a) => {
    if (risk !== "all" && a.risk !== risk) return false;
    if (status !== "all" && a.validationStatus !== status) return false;
    if (filetype !== "all" && a.fileType !== filetype) return false;
    if (search && !`${a.fileType} ${a.competence} ${getCompany(a.companyId)?.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tax, risk, status, filetype, search]);

  async function createMock() {
    const t = toast.loading("Gerando diagnóstico tributário…");
    try {
      const r = await generateMockTax("co-1");
      toast.success("Diagnóstico gerado", { id: t });
      navigate({ to: "/tax/$id", params: { id: r.analysisId } });
    } catch { toast.error("Falha ao gerar", { id: t }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
            <Receipt className="h-3.5 w-3.5" /> Tax Intelligence Engine
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Diagnósticos tributários</h1>
          <p className="text-sm text-muted-foreground">Análise simulada de SPED/XML com identificação de inconsistências e oportunidades.</p>
        </div>
        <Button onClick={createMock} className="bg-gradient-to-r from-primary to-purple text-white">
          <Plus className="mr-2 h-4 w-4" /> Novo diagnóstico tributário
        </Button>
      </div>

      <div className="glass-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 border-white/5 bg-white/5" />
        </div>
        <Select value={filetype} onValueChange={setFiletype}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Documento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="EFD ICMS/IPI">EFD ICMS/IPI</SelectItem>
            <SelectItem value="EFD Contribuições">EFD Contribuições</SelectItem>
            <SelectItem value="XML NF-e">XML NF-e</SelectItem>
            <SelectItem value="SPED ECF">SPED ECF</SelectItem>
            <SelectItem value="SPED ECD">SPED ECD</SelectItem>
          </SelectContent>
        </Select>
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
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Documento</th>
              <th className="px-4 py-3 text-left">Competência</th>
              <th className="px-4 py-3 text-right">Inconsistências</th>
              <th className="px-4 py-3 text-right">Oportunidades</th>
              <th className="px-4 py-3 text-center">Risco</th>
              <th className="px-4 py-3 text-left">Confiança</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((a) => (
              <tr key={a.id} className="cursor-pointer transition hover:bg-white/5" onClick={() => navigate({ to: "/tax/$id", params: { id: a.id } })}>
                <td className="px-4 py-3 font-medium">{getCompany(a.companyId)?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.fileType}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.competence}</td>
                <td className="px-4 py-3 text-right tabular-nums text-risk">{fmtBRL(a.inconsistenciesValue)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-success">{fmtBRL(a.opportunitiesValue)}</td>
                <td className="px-4 py-3 text-center"><RiskBadge risk={a.risk} /></td>
                <td className="px-4 py-3"><ConfidenceIndicator value={a.confidence} /></td>
                <td className="px-4 py-3 text-center"><StatusBadge status={a.validationStatus} /></td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(a.createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum diagnóstico encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
