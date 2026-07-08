import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useStore, currentUser } from "@/lib/cognia/store";
import { CogniaLogo } from "./CogniaLogo";
import { toast } from "sonner";
import {
  LayoutDashboard, FileText, Scale, ShieldCheck, Radar, BarChart3, Network,
  RefreshCw, FilePenLine, CalendarDays, ListTodo, BrainCircuit, Calculator,
  GitCompare, FileBarChart, ScrollText, Settings, Users, CreditCard,
  SlidersHorizontal, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

// Re-export para compatibilidade com imports antigos
export { CogniaLogo };

type Role = "Administrador" | "Jurídico" | "Tributário" | "CEO" | "CFO" | string;

interface MenuItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  disabledMsg?: string;
  roles?: Role[]; // se omitido, visível para todos os perfis logados
}
interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
  roles?: Role[]; // se omitido, visível a todos
}

const GROUPS: MenuGroup[] = [
  {
    id: "overview",
    label: "Visão Geral",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/radar", label: "Radar de Inteligência", icon: Radar },
      { to: "/decision", label: "Decision Engine", icon: BrainCircuit },
    ],
  },
  {
    id: "operation",
    label: "Operação",
    items: [
      { to: "/general-agenda", label: "Agenda Geral", icon: CalendarDays },
      { to: "/work-queue", label: "Central de Pendências", icon: ListTodo },
      { to: "/validations", label: "Validações Humanas", icon: ShieldCheck },
      { to: "/documents", label: "Documentos", icon: FileText },
      { to: "/legal-drafts", label: "Gera Minutas e Petições", icon: FilePenLine },
    ],
  },
  {
    id: "legal",
    label: "Inteligência Jurídica",
    roles: ["Administrador", "Jurídico", "CEO", "CFO"],
    items: [
      { to: "/legal", label: "Legal Engine", icon: Scale },
      { to: "/jurimetry", label: "Jurimetria Trabalhista", icon: BarChart3 },
    ],
  },
  {
    id: "tax",
    label: "Inteligência Tributária",
    roles: ["Administrador", "Tributário", "CEO", "CFO"],
    items: [
      { to: "/tax", label: "Tax Engine", icon: Calculator },
      { to: "/tax-confrontation-matrix", label: "Matriz de Confrontos Fiscais", icon: GitCompare },
    ],
  },
  {
    id: "knowledge",
    label: "Conhecimento e Relatórios",
    items: [
      { to: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
      { to: "/reports", label: "Relatórios", icon: FileBarChart },
      { to: "/audit-logs", label: "Logs e Auditoria", icon: ScrollText, roles: ["Administrador", "CEO", "CFO"] },
    ],
  },
  {
    id: "admin",
    label: "Administração",
    items: [
      { to: "/admin", label: "Admin", icon: Settings, roles: ["Administrador"] },
      { to: "/admin/process-update-engine", label: "Motor Atualizador de Processos", icon: RefreshCw, roles: ["Administrador"] },
      { to: "/admin", label: "Equipe e Acessos", icon: Users, roles: ["Administrador"] },
      { to: "#billing", label: "Gestão de Cobrança", icon: CreditCard, disabled: true, disabledMsg: "Módulo de Gestão de Cobrança previsto para próxima versão.", roles: ["Administrador", "CEO", "CFO"] },
      { to: "/settings", label: "Configurações", icon: SlidersHorizontal },
    ],
  },
];

const COLLAPSED_KEY = "cognia.sidebar.collapsed";
const GROUPS_KEY = "cognia.sidebar.groups.v2";
const SIDEBAR_WIDTH_KEY = "cognia.sidebar.width";

function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setV(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const update = (nv: T | ((p: T) => T)) => {
    setV((prev) => {
      const val = typeof nv === "function" ? (nv as (p: T) => T)(prev) : nv;
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
      return val;
    });
  };
  return [v, update];
}

function itemVisible(item: MenuItem, role: Role): boolean {
  if (!item.roles) return true;
  return item.roles.includes(role);
}
function groupVisible(group: MenuGroup, role: Role): boolean {
  if (group.roles && !group.roles.includes(role)) return false;
  return group.items.some((i) => itemVisible(i, role));
}

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const pendingCount = useStore((s) =>
    s.legal.filter((a) => a.validationStatus === "pendente").length +
    s.tax.filter((a) => a.validationStatus === "pendente").length,
  );
  const role = (currentUser()?.role ?? "CEO") as Role;

  const [collapsed, setCollapsed] = useLocalStorage<boolean>(COLLAPSED_KEY, false);
  const [openGroups, setOpenGroups] = useLocalStorage<Record<string, boolean>>(GROUPS_KEY, {
    overview: true, operation: true, legal: true, tax: true, knowledge: false, admin: false,
  });

  // Expor largura do sidebar via CSS var para o AppShell/layout se adaptar
  useEffect(() => {
    const w = collapsed ? "4.5rem" : "16rem";
    document.documentElement.style.setProperty("--cognia-sidebar-w", w);
    try { localStorage.setItem(SIDEBAR_WIDTH_KEY, w); } catch {}
  }, [collapsed]);

  // Melhor correspondência do item ativo (mais específico vence)
  const allItems = useMemo(() => GROUPS.flatMap((g) => g.items), []);
  const bestMatch = useMemo(() => {
    return allItems
      .filter((i) => !i.disabled && (path === i.to || path.startsWith(`${i.to}/`)))
      .sort((a, b) => b.to.length - a.to.length)[0];
  }, [allItems, path]);

  // Abrir automaticamente o grupo que contém a rota ativa
  useEffect(() => {
    if (!bestMatch) return;
    const g = GROUPS.find((gr) => gr.items.some((it) => it.to === bestMatch.to));
    if (g && !openGroups[g.id]) setOpenGroups({ ...openGroups, [g.id]: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestMatch?.to]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-[width] duration-200 md:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      {/* Cabeçalho / logo */}
      <div className={cn("flex items-center justify-center px-3 py-4", collapsed ? "px-2" : "px-4")}>
        <Link to="/dashboard" className="flex w-full items-center justify-center overflow-hidden">
          <CogniaLogo className={cn(collapsed ? "h-9 w-auto" : "h-14 w-auto max-w-full")} />
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-2 pb-4">
        {GROUPS.filter((g) => groupVisible(g, role)).map((group) => {
          const items = group.items.filter((i) => itemVisible(i, role));
          const isOpen = collapsed ? true : (openGroups[group.id] ?? true);
          return (
            <div key={group.id} className="space-y-0.5">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setOpenGroups({ ...openGroups, [group.id]: !isOpen })}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 transition hover:text-foreground"
                >
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span className="flex-1 text-left">{group.label}</span>
                </button>
              )}
              {collapsed && <div className="mx-2 my-1 border-t border-white/5" />}
              {isOpen && (
                <div className="space-y-0.5">
                  {items.map((it) => (
                    <NavItem
                      key={`${group.id}-${it.to}-${it.label}`}
                      item={it}
                      active={bestMatch?.to === it.to && bestMatch?.label === it.label}
                      collapsed={collapsed}
                      badge={it.to === "/validations" && pendingCount > 0 ? pendingCount : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Rodapé: recolher / expandir */}
      <div className="border-t border-border px-2 py-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Recolher menu</span>}
        </button>
        {!collapsed && (
          <div className="mt-2 px-2 text-[10px] text-muted-foreground">
            Ambiente MVP · dados mockados
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  badge,
}: {
  item: MenuItem;
  active: boolean;
  collapsed: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  const inner = (
    <>
      <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-cyan" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.disabled && (
        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">Em breve</span>
      )}
      {!collapsed && badge != null && (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-warning/20 text-[10px] font-semibold text-warning">
          {badge}
        </span>
      )}
    </>
  );
  const cls = cn(
    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
    collapsed && "justify-center px-2",
    active
      ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px] shadow-primary/30"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
    item.disabled && "opacity-60 hover:bg-transparent cursor-not-allowed",
  );

  if (item.disabled) {
    return (
      <button
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={() => toast(item.disabledMsg ?? "Em breve")}
        className={cn(cls, "w-full text-left")}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={cls}
    >
      {inner}
    </Link>
  );
}
