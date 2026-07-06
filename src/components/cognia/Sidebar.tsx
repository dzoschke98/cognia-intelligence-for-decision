import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useStore, currentUser } from "@/lib/cognia/store";
import cogniaLogo from "@/assets/cognia-logo.png";
import {
  LayoutDashboard, FileText, Scale, Receipt, Brain, CheckCircle2,
  Network, BarChart3, ShieldCheck, Settings, Users2, Radar, LineChart, Grid3x3,
  RefreshCw, PenSquare, CalendarDays, ListTodo,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/radar", label: "Radar de Inteligência", icon: Radar },
  { to: "/general-agenda", label: "Agenda Geral", icon: CalendarDays },
  { to: "/work-queue", label: "Central de Pendências", icon: ListTodo },
  { to: "/documents", label: "Documentos", icon: FileText },
  { to: "/legal", label: "Legal Engine", icon: Scale },
  { to: "/jurimetry", label: "Jurimetria Trabalhista", icon: LineChart },
  { to: "/legal-drafts", label: "Gera Minutas e Petições", icon: PenSquare },
  { to: "/tax", label: "Tax Engine", icon: Receipt },
  { to: "/tax-confrontation-matrix", label: "Matriz de Confrontos Fiscais", icon: Grid3x3 },
  { to: "/decision", label: "Decision Engine", icon: Brain },
  { to: "/validations", label: "Validações", icon: CheckCircle2 },
  { to: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { to: "/reports", label: "Relatórios", icon: BarChart3 },
  { to: "/audit-logs", label: "Logs e Auditoria", icon: ShieldCheck },
  { to: "/admin", label: "Administração", icon: Users2, adminOnly: true },
  { to: "/admin/process-update-engine", label: "Motor Atualizador de Processos", icon: RefreshCw, adminOnly: true },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const pendingCount = useStore((s) =>
    s.legal.filter((a) => a.validationStatus === "pendente").length +
    s.tax.filter((a) => a.validationStatus === "pendente").length,
  );

  const visible = items.filter((it) => !("adminOnly" in it && it.adminOnly) || currentUser()?.role === "Administrador");
  const bestMatch = visible
    .filter((i) => path === i.to || path.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/80 backdrop-blur-xl md:flex">
      <Link to="/dashboard" className="flex flex-col items-start gap-1 px-5 py-5">
        <img src={cogniaLogo} alt="CognIA" className="h-10 w-auto object-contain" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Decision Intelligence</span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
        {visible.map(({ to, label, icon: Icon }) => {
          const active = bestMatch?.to === to;
          const isValidations = to === "/validations";
          return (
            <Link key={to} to={to as string}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active
                  ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px] shadow-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", active ? "text-cyan" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="flex-1 truncate">{label}</span>
              {isValidations && pendingCount > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-warning/20 text-[10px] font-semibold text-warning">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-5 py-3 text-[10px] text-muted-foreground">
        Ambiente MVP · dados mockados
      </div>
    </aside>
  );
}

export function CogniaLogo({ className }: { className?: string }) {
  return <img src={cogniaLogo} alt="CognIA" className={cn("object-contain", className)} />;
}

