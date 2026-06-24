import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/cognia/AppShell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompanies } from "@/lib/cognia/store";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — CognIA" }] }),
  component: () => <AppShell><Settings /></AppShell>,
});

function Settings() {
  const [company, setCompany] = useState("co-1");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="text-xs uppercase tracking-widest text-cyan">Configurações</div>
        <h1 className="text-3xl font-semibold tracking-tight">Preferências da plataforma</h1>
      </div>

      <Section title="Geral">
        <Field label="Empresa ativa">
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>{getCompanies().map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Idioma">
          <Select defaultValue="pt-BR">
            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português (BR)</SelectItem>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="es-ES">Español</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Tema">
          <Select defaultValue="dark">
            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Escuro (executivo)</SelectItem>
              <SelectItem value="auto">Automático</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Notificações">
        <Toggle label="Alertas críticos do Decision Engine" defaultChecked />
        <Toggle label="Análises de baixa confiança" defaultChecked />
        <Toggle label="Relatórios executivos semanais" />
        <Toggle label="Notificações por e-mail" defaultChecked />
      </Section>

      <Section title="Limites de uso">
        <Field label="Análises jurídicas / mês"><div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-sm">300</div></Field>
        <Field label="Diagnósticos tributários / mês"><div className="rounded border border-white/5 bg-white/5 px-3 py-2 text-sm">200</div></Field>
      </Section>

      <Section title="Segurança e sessão">
        <Toggle label="MFA obrigatório para administradores" defaultChecked />
        <Toggle label="Logout automático após 30min de inatividade" defaultChecked />
        <Field label="Política de retenção de logs"><div className="text-sm text-muted-foreground">12 meses (mock) · logs imutáveis</div></Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[260px_1fr]">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
