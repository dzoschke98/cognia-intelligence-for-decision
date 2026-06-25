import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Scale, Receipt, Brain, CheckCircle2,
  Network, BarChart3, ShieldCheck, Settings, Users2, Hexagon, Radar, LineChart,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/radar", label: "Radar de Inteligência", icon: Radar },
  { to: "/documents", label: "Documentos", icon: FileText },
  { to: "/legal", label: "Legal Engine", icon: Scale },
  { to: "/jurimetry", label: "Jurimetria Trabalhista", icon: LineChart },
  { to: "/tax", label: "Tax Engine", icon: Receipt },
  { to: "/decision", label: "Decision Engine", icon: Brain },
  { to: "/validations", label: "Validações", icon: CheckCircle2 },
  { to: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { to: "/reports", label: "Relatórios", icon: BarChart3 },
  { to: "/audit-logs", label: "Logs e Auditoria", icon: ShieldCheck },
  { to: "/admin", label: "Administração", icon: Users2 },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-[#0B0F1A]/80 backdrop-blur-xl md:flex">
      <Link to="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
        <CogniaLogo className="h-8 w-8" />
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tracking-tight">Cogn<span className="gradient-text">IA</span></span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Decision Intelligence</span>
        </div>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to || (to !== "/dashboard" && path.startsWith(to));
          return (
            <Link key={to} to={to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active
                  ? "bg-primary/15 text-white shadow-[inset_0_0_0_1px] shadow-primary/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", active ? "text-cyan" : "text-muted-foreground group-hover:text-white")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/5 px-5 py-3 text-[10px] text-muted-foreground">
        Ambiente MVP · dados mockados
      </div>
    </aside>
  );
}

export function CogniaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid place-items-center rounded-xl bg-gradient-to-br from-primary to-purple text-white glow-primary", className)}>
      <Hexagon className="absolute h-full w-full opacity-30" strokeWidth={1.2} />
      <span className="text-sm font-bold">C</span>
    </div>
  );
}
