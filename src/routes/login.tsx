import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CogniaLogo } from "@/components/cognia/Sidebar";
import { login, useStore, useIsClient, getUsers } from "@/lib/cognia/store";
import { toast } from "sonner";
import { ArrowRight, Sparkles, ShieldCheck, Brain } from "lucide-react";
import loginBg from "@/assets/login-bg.jpg";

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

  const VALID_ROUTES = ["/dashboard", "/radar", "/legal", "/tax", "/decision", "/validations"] as const;
  type PostLogin = (typeof VALID_ROUTES)[number];
  function postLoginRoute(): PostLogin {
    try {
      const v = localStorage.getItem("cognia.postlogin.route");
      if (v && (VALID_ROUTES as readonly string[]).includes(v)) return v as PostLogin;
    } catch {}
    return "/dashboard";
  }

  useEffect(() => {
    if (isClient && session) navigate({ to: postLoginRoute() });
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
    navigate({ to: postLoginRoute() });
  }

  function loginDemo() {
    setEmail("admin@cognia.demo");
    login("admin@cognia.demo");
    toast.success("Entrando como Administrador (demo)");
    navigate({ to: postLoginRoute() });
  }

  return (
    <div
      className="relative grid min-h-screen md:grid-cols-2"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Global overlay to keep contrast over the illustration */}
      <div className="pointer-events-none absolute inset-0 bg-[#070B14]/70" />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "radial-gradient(circle at 20% 30%, oklch(0.58 0.22 264 / 0.35), transparent 55%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(circle at 85% 80%, oklch(0.55 0.24 295 / 0.35), transparent 55%)" }}
      />

      {/* Left brand panel */}
      <div className="relative z-10 hidden flex-col justify-between overflow-hidden border-r border-white/5 p-12 md:flex">


        <div className="relative flex flex-col items-start gap-1">
          <CogniaLogo className="h-16 w-auto" />
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Decision Intelligence</div>
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
      <div className="relative z-10 flex items-center justify-center p-6 sm:p-12">
        <div className="glass-card w-full max-w-md space-y-6 border-white/10 bg-[#0B0F1A]/70 p-8 backdrop-blur-xl">
          <div className="md:hidden">
            <CogniaLogo className="h-12 w-auto" />
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
