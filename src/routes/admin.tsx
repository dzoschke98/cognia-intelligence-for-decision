import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/cognia/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { adminUsers } from "@/lib/cognia/mockData";
import { getCompanies, useStore } from "@/lib/cognia/store";
import { Building2, Users, Shield, Cpu, Gauge, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administração — CognIA" }] }),
  component: () => <AppShell><Admin /></AppShell>,
});

const engines = [
  { name: "Legal Engine V1", version: "legal-engine-v1.0.0", minConfidence: 70, cost: 0.42, mandatory: true },
  { name: "Tax Engine V1", version: "tax-engine-v1.0.0", minConfidence: 70, cost: 0.51, mandatory: true },
  { name: "Decision Engine V0", version: "decision-engine-v0.3.0", minConfidence: 65, cost: 0.18, mandatory: true },
  { name: "Knowledge Graph Basic", version: "kg-basic-v0.1.0", minConfidence: 60, cost: 0.08, mandatory: false },
];

function Admin() {
  const legal = useStore((s) => s.legal);
  const tax = useStore((s) => s.tax);
  const engineStats = (arr: Array<{ validationStatus: string; confidence: number; estimatedCost: number }>) => {
    const total = arr.length;
    const approved = arr.filter((a) => a.validationStatus === "aprovado").length;
    const rejected = arr.filter((a) => a.validationStatus === "rejeitado").length;
    const conf = total ? arr.reduce((s, a) => s + a.confidence, 0) / total : 0;
    const cost = arr.reduce((s, a) => s + a.estimatedCost, 0);
    return {
      total, approved, rejected,
      approvalRate: total ? (approved / total) * 100 : 0,
      rejectionRate: total ? (rejected / total) * 100 : 0,
      avgConfidence: conf,
      totalCost: cost,
      avgCost: total ? cost / total : 0,
    };
  };
  const legalStats = engineStats(legal);
  const taxStats = engineStats(tax);
  const engineCompare = [
    { name: "Legal Engine", approval: +legalStats.approvalRate.toFixed(1), color: "hsl(var(--primary))" },
    { name: "Tax Engine", approval: +taxStats.approvalRate.toFixed(1) },
  ];
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-cyan">Administração</div>
        <h1 className="text-3xl font-semibold tracking-tight">Configuração do tenant</h1>
        <p className="text-sm text-muted-foreground">Empresas, usuários, permissões e engines da CognIA.</p>
      </div>

      <Tabs defaultValue="empresas" className="w-full">
        <TabsList className="bg-white/5">
          <TabsTrigger value="empresas"><Building2 className="mr-1.5 h-3.5 w-3.5" /> Empresas</TabsTrigger>
          <TabsTrigger value="usuarios"><Users className="mr-1.5 h-3.5 w-3.5" /> Usuários</TabsTrigger>
          <TabsTrigger value="perfis"><Shield className="mr-1.5 h-3.5 w-3.5" /> Perfis e permissões</TabsTrigger>
          <TabsTrigger value="engines"><Cpu className="mr-1.5 h-3.5 w-3.5" /> Engines</TabsTrigger>
          <TabsTrigger value="limites"><Gauge className="mr-1.5 h-3.5 w-3.5" /> Limites de uso</TabsTrigger>
          <TabsTrigger value="metricas"><BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Métricas de IA</TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="mt-4">
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3 text-left">Empresa</th><th className="px-4 py-3 text-left">Setor</th><th className="px-4 py-3 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {getCompanies().map((c) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.sector}</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-xs text-success">Ativa</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-left">Papel</th><th className="px-4 py-3 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {adminUsers.map((u, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-purple text-xs font-bold">{u.name[0]}</div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-xs text-success">Ativo</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="perfis" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["Administrador", "CEO", "CFO", "Diretor Jurídico", "Diretor Tributário", "Analista"].map((p) => (
              <div key={p} className="glass-card p-4">
                <div className="text-xs uppercase tracking-wider text-cyan">Perfil</div>
                <h4 className="mt-1 text-base font-semibold">{p}</h4>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <li>• Acesso ao dashboard executivo</li>
                  <li>• Visualização de análises</li>
                  <li>• {p === "Administrador" ? "Gestão completa" : "Operação restrita por escopo"}</li>
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="engines" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {engines.map((e) => (
              <div key={e.name} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold">{e.name}</h4>
                    <div className="font-mono text-xs text-cyan">{e.version}</div>
                  </div>
                  <span className="rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-xs text-success">Ativo</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div><dt className="text-muted-foreground">Confiança mínima</dt><dd className="font-medium">{e.minConfidence}%</dd></div>
                  <div><dt className="text-muted-foreground">Custo médio/análise</dt><dd className="font-medium">US$ {e.cost.toFixed(2)}</dd></div>
                  <div><dt className="text-muted-foreground">Validação humana</dt><dd className="font-medium">{e.mandatory ? "Obrigatória" : "Opcional"}</dd></div>
                  <div><dt className="text-muted-foreground">Fallback</dt><dd className="font-medium">Mock interno</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="limites" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { k: "Análises jurídicas/mês", v: "300", used: 84 },
              { k: "Diagnósticos tributários/mês", v: "200", used: 88 },
              { k: "Custo de IA/mês", v: "US$ 2.500", used: 38 },
            ].map((l) => (
              <div key={l.k} className="glass-card p-4">
                <div className="text-xs text-muted-foreground">{l.k}</div>
                <div className="text-2xl font-semibold">{l.v}</div>
                <div className="mt-2 h-2 rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan" style={{ width: `${l.used}%` }} /></div>
                <div className="mt-1 text-xs text-muted-foreground">{l.used}% utilizado</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metricas" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <EngineMetrics title="Legal Engine" tone="text-primary" s={legalStats} />
            <EngineMetrics title="Tax Engine" tone="text-cyan" s={taxStats} />
          </div>
          <div className="glass-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Taxa de aprovação humana por engine</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engineCompare}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                  <XAxis dataKey="name" stroke="oklch(0.68 0.02 260)" fontSize={12} />
                  <YAxis stroke="oklch(0.68 0.02 260)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="approval" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EngineMetrics({ title, tone, s }: { title: string; tone: string; s: { total: number; approved: number; approvalRate: number; rejectionRate: number; avgConfidence: number; totalCost: number; avgCost: number } }) {
  const cards = [
    { k: "Total análises", v: String(s.total) },
    { k: "Aprovadas", v: String(s.approved) },
    { k: "Taxa aprovação", v: `${s.approvalRate.toFixed(1)}%` },
    { k: "Taxa rejeição", v: `${s.rejectionRate.toFixed(1)}%` },
    { k: "Confiança média", v: `${s.avgConfidence.toFixed(1)}%` },
    { k: "Custo total", v: `US$ ${s.totalCost.toFixed(2)}` },
    { k: "Custo médio/análise", v: `US$ ${s.avgCost.toFixed(2)}` },
  ];
  return (
    <div className="glass-card p-5">
      <h3 className={`mb-3 text-sm font-semibold ${tone}`}>{title}</h3>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.k} className="rounded-md border border-border bg-accent/40 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.k}</div>
            <div className="text-sm font-semibold">{c.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
