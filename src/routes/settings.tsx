import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/cognia/AppShell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompanies, setActiveCompany, useStore } from "@/lib/cognia/store";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — CognIA" }] }),
  component: () => <AppShell><Settings /></AppShell>,
});

const POSTLOGIN_KEY = "cognia.postlogin.route";
const THEME_KEY = "cognia.theme";

function Settings() {
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const [postLogin, setPostLogin] = useState<string>("/dashboard");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    try {
      setPostLogin(localStorage.getItem(POSTLOGIN_KEY) ?? "/dashboard");
      setDarkMode((localStorage.getItem(THEME_KEY) ?? "dark") === "dark");
    } catch {}
  }, []);

  function handlePostLoginChange(v: string) {
    setPostLogin(v);
    try { localStorage.setItem(POSTLOGIN_KEY, v); } catch {}
    toast.success("Tela inicial atualizada");
  }
  function handleThemeChange(dark: boolean) {
    setDarkMode(dark);
    if (dark) {
      document.documentElement.classList.remove("light");
      try { localStorage.setItem(THEME_KEY, "dark"); } catch {}
    } else {
      document.documentElement.classList.add("light");
      try { localStorage.setItem(THEME_KEY, "light"); } catch {}
    }
    toast.success(dark ? "Modo escuro ativado" : "Modo claro ativado");
  }
  function handleCompanyChange(v: string) {
    setActiveCompany(v);
    toast.success("Empresa ativa atualizada");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="text-xs uppercase tracking-widest text-cyan">Configurações</div>
        <h1 className="text-3xl font-semibold tracking-tight">Preferências da plataforma</h1>
      </div>

      <Section title="Geral">
        <Field label="Empresa ativa">
          <Select value={activeCompanyId} onValueChange={handleCompanyChange}>
            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>{getCompanies().map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Tela inicial após login">
          <Select value={postLogin} onValueChange={handlePostLoginChange}>
            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="/dashboard">Dashboard Executivo (padrão)</SelectItem>
              <SelectItem value="/radar">Radar de Inteligência</SelectItem>
              <SelectItem value="/legal">Legal Engine</SelectItem>
              <SelectItem value="/tax">Tax Engine</SelectItem>
              <SelectItem value="/decision">Decision Engine</SelectItem>
              <SelectItem value="/validations">Fila de Validações</SelectItem>
            </SelectContent>
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
          <div className="flex items-center gap-3">
            <Switch checked={darkMode} onCheckedChange={handleThemeChange} />
            <span className="text-sm text-muted-foreground">Modo escuro (executivo)</span>
          </div>
        </Field>
      </Section>

      <Section title="Notificações">
        <Toggle label="Alertas críticos do Decision Engine" defaultChecked />
        <Toggle label="Análises de baixa confiança" defaultChecked />
        <Toggle label="Relatórios executivos semanais" />
        <Toggle label="Notificações por e-mail" defaultChecked />
      </Section>

      <Section title="Limites de uso">
        <Field label="Análises jurídicas / mês"><div className="rounded border border-border bg-accent/40 px-3 py-2 text-sm">300</div></Field>
        <Field label="Diagnósticos tributários / mês"><div className="rounded border border-border bg-accent/40 px-3 py-2 text-sm">200</div></Field>
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
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
