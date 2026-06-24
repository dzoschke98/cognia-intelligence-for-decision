import { useNavigate } from "@tanstack/react-router";
import { currentUser, logout, useStore } from "@/lib/cognia/store";
import { getCompany } from "@/lib/cognia/store";
import { Bell, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const email = useStore((s) => s.currentUserEmail);
  const navigate = useNavigate();
  const user = currentUser();
  const company = getCompany(user?.companyId ?? "co-1");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-[#0B0F1A]/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-tight">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Empresa ativa</span>
          <span className="text-sm font-medium">{company?.name ?? "—"}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/5 bg-white/5 text-muted-foreground transition hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-left transition hover:bg-white/10">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-purple text-xs font-bold">
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
