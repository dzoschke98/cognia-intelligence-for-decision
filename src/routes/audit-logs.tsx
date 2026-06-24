import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, getCompany } from "@/lib/cognia/store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDateTime } from "@/lib/cognia/format";
import { ShieldCheck, Search, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Logs e Auditoria — CognIA" }] }),
  component: () => <AppShell><Logs /></AppShell>,
});

function Logs() {
  const logs = useStore((s) => s.logs);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))).sort(), [logs]);
  const filtered = logs.filter((l) => {
    if (action !== "all" && l.action !== action) return false;
    if (search && !`${l.userEmail} ${l.action} ${l.resource}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan">
          <ShieldCheck className="h-3.5 w-3.5" /> Governança
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Logs e auditoria</h1>
        <p className="text-sm text-muted-foreground">Logs imutáveis são parte da confiança da CognIA.</p>
      </div>

      <div className="glass-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuário, ação..." className="pl-9 border-white/5 bg-white/5" />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/5 uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left">Data/hora</th>
              <th className="px-3 py-2.5 text-left">Usuário</th>
              <th className="px-3 py-2.5 text-left">Perfil</th>
              <th className="px-3 py-2.5 text-left">Ação</th>
              <th className="px-3 py-2.5 text-left">Recurso</th>
              <th className="px-3 py-2.5 text-left">Empresa</th>
              <th className="px-3 py-2.5 text-left">Engine</th>
              <th className="px-3 py-2.5 text-left">Prompt</th>
              <th className="px-3 py-2.5 text-left">IP</th>
              <th className="px-3 py-2.5 text-center">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-white/5">
                <td className="px-3 py-2 font-mono text-muted-foreground">{fmtDateTime(l.timestamp)}</td>
                <td className="px-3 py-2">{l.userEmail}</td>
                <td className="px-3 py-2 text-muted-foreground">{l.userRole}</td>
                <td className="px-3 py-2 font-mono text-cyan">{l.action}</td>
                <td className="px-3 py-2 text-muted-foreground">{l.resource}</td>
                <td className="px-3 py-2 text-muted-foreground">{getCompany(l.companyId ?? "")?.name ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{l.engineVersion ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{l.promptHash ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{l.ip}</td>
                <td className="px-3 py-2 text-center">
                  {l.result === "success"
                    ? <CheckCircle2 className="mx-auto h-4 w-4 text-success" />
                    : <XCircle className="mx-auto h-4 w-4 text-risk" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
