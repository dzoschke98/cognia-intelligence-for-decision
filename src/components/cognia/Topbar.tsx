import { useNavigate, useRouterState } from "@tanstack/react-router";
import { currentUser, logout, useStore, getCompany } from "@/lib/cognia/store";
import { Bell, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { relativeTime } from "@/lib/cognia/format";

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/radar": "Radar de Inteligência",
  "/documents": "Documentos",
  "/legal": "Legal Engine",
  "/jurimetry": "Jurimetria",
  "/tax": "Tax Engine",
  "/tax-confrontation-matrix": "Matriz de Confrontos Fiscais",
  "/decision": "Decision Engine",
  "/validations": "Validações",
  "/knowledge-graph": "Knowledge Graph",
  "/reports": "Relatórios",
  "/audit-logs": "Logs e Auditoria",
  "/admin": "Administração",
  "/settings": "Configurações",
};

export function Topbar() {
  const email = useStore((s) => s.currentUserEmail);
  const navigate = useNavigate();
  const user = currentUser();
  const activeCompanyId = useStore((s) => s.activeCompanyId);
  const company = getCompany(activeCompanyId);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const legal = useStore((s) => s.legal);
  const tax = useStore((s) => s.tax);

  const sectionKey = "/" + (path.split("/")[1] ?? "");
  const sectionLabel = routeLabels[sectionKey] ?? "—";

  const pendingLegal = legal
    .filter((a) => a.validationStatus === "pendente")
    .map((a) => ({ id: a.id, kind: "Jurídica" as const, title: a.processNumber, owner: a.responsible, createdAt: a.createdAt }));
  const pendingTax = tax
    .filter((a) => a.validationStatus === "pendente")
    .map((a) => ({ id: a.id, kind: "Tributária" as const, title: `${a.fileType} · ${a.competence}`, owner: a.responsible, createdAt: a.createdAt }));
  const pending = [...pendingLegal, ...pendingTax].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const pendingCount = pending.length;
  const latest = pending.slice(0, 6);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>CognIA</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-cyan">{sectionLabel}</span>
          </div>
          <span className="text-sm font-medium">{company?.name ?? "—"}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-accent/40 text-muted-foreground transition hover:text-foreground">
              <Bell className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-warning px-1 text-[9px] font-bold text-black">
                  {pendingCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="border-b border-border p-3">
              <div className="text-sm font-semibold">Pendentes de validação</div>
              <div className="text-xs text-muted-foreground">{pendingCount} análises aguardando revisão</div>
            </div>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {latest.length === 0 && (
                <li className="p-4 text-center text-xs text-muted-foreground">Nada pendente 🎉</li>
              )}
              {latest.map((it) => (
                <li key={`${it.kind}-${it.id}`} className="flex items-center justify-between gap-2 p-3 hover:bg-accent/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-border bg-accent/40 px-1.5 py-0.5 text-[9px]">{it.kind}</span>
                      <span className="truncate text-xs font-medium">{it.title}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{it.owner} · {relativeTime(it.createdAt)}</div>
                  </div>
                  <button
                    onClick={() => navigate({ to: it.kind === "Jurídica" ? "/legal/$id" : "/tax/$id", params: { id: it.id } })}
                    className="text-xs text-cyan hover:underline"
                  >
                    Ver
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-2 text-center">
              <button onClick={() => navigate({ to: "/validations" })} className="text-xs text-cyan hover:underline">
                Ver todas as validações →
              </button>
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border border-border bg-accent/40 px-3 py-1.5 text-left transition hover:bg-accent">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-purple text-xs font-bold text-white">
              {user?.name?.[0] ?? "?"}
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-xs font-medium">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground">{user?.role}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>Configurações</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); }} className="text-risk">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
