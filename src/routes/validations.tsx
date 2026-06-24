import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/cognia/AppShell";
import { useStore, setLegalStatus, setTaxStatus } from "@/lib/cognia/store";
import { RiskBadge, StatusBadge, ConfidenceIndicator } from "@/components/cognia/Badges";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/cognia/format";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/validations")({
  head: () => ({ meta: [{ title: "Validações — CognIA" }] }),
  component: () => <AppShell><Validations /></AppShell>,
});

function Validations() {
  const legal = useStore((s) => s.legal);
  const tax = useStore((s) => s.tax);
  const navigate = useNavigate();

  type Item = {
    id: string; kind: "Jurídica" | "Tributária"; title: string; engine: string;
    confidence: number; risk: any; status: any; owner: string; createdAt: string;
    route: "/legal/$id" | "/tax/$id";
  };

  const items: Item[] = [
    ...legal.map<Item>((a) => ({
      id: a.id, kind: "Jurídica", title: a.processNumber, engine: a.engineVersion,
      confidence: a.confidence, risk: a.risk, status: a.validationStatus,
      owner: a.responsible, createdAt: a.createdAt, route: "/legal/$id",
    })),
    ...tax.map<Item>((a) => ({
      id: a.id, kind: "Tributária", title: `${a.fileType} · ${a.competence}`, engine: a.engineVersion,
      confidence: a.confidence, risk: a.risk, status: a.validationStatus,
      owner: a.responsible, createdAt: a.createdAt, route: "/tax/$id",
    })),
  ];

  const counts = {
    pendente: items.filter((i) => i.status === "pendente").length,
    aprovado: items.filter((i) => i.status === "aprovado").length,
    corrigido: items.filter((i) => i.status === "corrigido").length,
    rejeitado: items.filter((i) => i.status === "rejeitado").length,
    lowConf: items.filter((i) => i.confidence < 75).length,
  };

  function approve(it: Item) {
    (it.kind === "Jurídica" ? setLegalStatus : setTaxStatus)(it.id, "aprovado");
    toast.success(`${it.kind} aprovada`);
  }
  function reject(it: Item) {
    (it.kind === "Jurídica" ? setLegalStatus : setTaxStatus)(it.id, "rejeitado", { reason: "Rejeitado pela fila de validação." });
    toast.success(`${it.kind} rejeitada`);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-cyan">Governança</div>
        <h1 className="text-3xl font-semibold tracking-tight">Validação humana</h1>
        <p className="text-sm text-muted-foreground">Fila de análises aguardando revisão pelo especialista responsável.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <Counter label="Pendentes" value={counts.pendente} tone="text-warning" />
        <Counter label="Aprovadas" value={counts.aprovado} tone="text-success" />
        <Counter label="Corrigidas" value={counts.corrigido} tone="text-cyan" />
        <Counter label="Rejeitadas" value={counts.rejeitado} tone="text-risk" />
        <Counter label="Baixa confiança" value={counts.lowConf} tone="text-purple" />
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Engine</th>
              <th className="px-4 py-3 text-left">Confiança</th>
              <th className="px-4 py-3 text-center">Risco</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Responsável</th>
              <th className="px-4 py-3 text-left">Aguardando</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((it) => (
              <tr key={`${it.kind}-${it.id}`} className="hover:bg-white/5">
                <td className="px-4 py-3"><span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs">{it.kind}</span></td>
                <td className="px-4 py-3 font-medium">{it.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{it.engine}</td>
                <td className="px-4 py-3"><ConfidenceIndicator value={it.confidence} /></td>
                <td className="px-4 py-3 text-center"><RiskBadge risk={it.risk} /></td>
                <td className="px-4 py-3 text-center"><StatusBadge status={it.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{it.owner}</td>
                <td className="px-4 py-3 text-muted-foreground">{relativeTime(it.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => navigate({ to: it.route, params: { id: it.id } })}><Eye className="h-3.5 w-3.5" /></Button>
                    {it.status === "pendente" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => approve(it)} className="text-success"><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => reject(it)} className="text-risk"><XCircle className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="glass-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}
