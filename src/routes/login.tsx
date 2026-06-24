import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CogniaLogo } from "@/components/cognia/Sidebar";
import { login, useStore, useIsClient, getUsers } from "@/lib/cognia/store";
import { toast } from "sonner";
import { ArrowRight, Sparkles, ShieldCheck, Brain } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — CognIA" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("admin@cognia.demo");
  const [password, setPassword] = useState("demo123");
  const navigate = useNavigate();
  const isClient = useIsClient();
  const session = useStore((s) => s.currentUserEmail);

  useEffect(() => {
    if (isClient && session) navigate({ to: "/dashboard" });
  }, [isClient, session, navigate]);

  function doLogin(e?: React.FormEvent) {
    e?.preventDefault();
    const user = getUsers().find((u) => u.email === email.trim());
    if (!user || password !== "demo123") {
      toast.error("Credenciais inválidas", { description: "Use senha demo123 e um e-mail mockado." });
      return;
    }
    login(user.email);
    toast.success(`Bem-vindo, ${user.name}`);
    navigate({ to: "/dashboard" });
  }

  function loginDemo() {
    setEmail("admin@cognia.demo");
    login("admin@cognia.demo");
    toast.success("Entrando como Administrador (demo)");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 bg-gradient-to-br from-[#0B0F1A] via-[#0d1326] to-[#0B0F1A] p-12 md:flex">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 20%, oklch(0.58 0.22 264 / 0.5), transparent 50%)" }} />
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 80%, oklch(0.55 0.24 295 / 0.5), transparent 50%)" }} />

        <div className="relative flex items-center gap-3">
          <CogniaLogo className="h-12 w-12" />
          <div>
            <div className="text-2xl font-bold tracking-tight">Cogn<span className="gradient-text">IA</span></div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Decision Intelligence</div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Inteligência para <span className="gradient-text">decidir melhor</span>.
          </h1>
          <p className="max-w-md text-muted-foreground">
            Transformando dados, documentos, sistemas e conhecimento especializado em análises, recomendações,
            alertas e decisões corporativas mais precisas.
          </p>
          <div className="grid gap-3 pt-4">
            <Feature icon={Brain} title="Engines de Inteligência" desc="Legal, Tributário e Decisão integrados." />
            <Feature icon={ShieldCheck} title="Validação humana" desc="Toda análise revisada pelo especialista." />
            <Feature icon={Sparkles} title="Knowledge Graph" desc="Conexões entre dados, riscos e oportunidades." />
          </div>
        </div>

        <div className="relative text-xs text-muted-foreground">
          Transformando dados em decisões.
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="md:hidden">
            <CogniaLogo className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Acesso à plataforma</h2>
            <p className="text-sm text-muted-foreground">Entre com sua conta executiva CognIA.</p>
          </div>

          <form onSubmit={doLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple text-white hover:opacity-90">
              Entrar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10" onClick={loginDemo}>
              Entrar como demo
            </Button>
          </form>

          <div className="rounded-lg border border-white/5 bg-white/5 p-4 text-xs">
            <div className="mb-2 font-medium text-foreground">Contas de demonstração</div>
            <div className="grid gap-1 text-muted-foreground">
              <code>ceo@cognia.demo</code>
              <code>juridico@cognia.demo</code>
              <code>tributario@cognia.demo</code>
              <code>admin@cognia.demo</code>
              <code>cfo@cognia.demo</code>
              <div className="pt-1">Senha: <span className="text-cyan">demo123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="glass-card flex items-start gap-3 p-3">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-primary/20 to-purple/20 text-cyan">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
