import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useStore, useIsClient } from "@/lib/cognia/store";

export function AppShell({ children }: { children: ReactNode }) {
  const email = useStore((s) => s.currentUserEmail);
  const isClient = useIsClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (isClient && !email) navigate({ to: "/login" });
  }, [isClient, email, navigate]);

  if (!isClient) return null;
  if (!email) return null;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div
        className="transition-[padding] duration-200 md:pl-[var(--cognia-sidebar-w,16rem)]"
      >
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
