import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { useStore, useIsClient } from "@/lib/cognia/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pedimos desculpas — a página que você buscou não existe ou foi movida.
          Verifique o endereço ou volte para o início.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao Dashboard
          </Link>
          <Link to="/login" className="text-xs text-cyan hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-risk/15 text-risk">!</div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pedimos desculpas pelo inconveniente. Ocorreu um erro inesperado ao carregar esta página.
          Tente novamente ou entre em contato com o suporte.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CognIA — Inteligência para decidir melhor" },
      { name: "description", content: "Plataforma de inteligência corporativa baseada em IA para apoio à tomada de decisão jurídica e tributária." },
      { name: "author", content: "CognIA" },
      { property: "og:title", content: "CognIA — Inteligência para decidir melhor" },
      { property: "og:description", content: "Transformando dados em decisões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const themeInit = `(function(){try{var t=localStorage.getItem('cognia.theme')||'dark';if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isClient = useIsClient();
  const session = useStore((s) => s.currentUserEmail);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    function syncTheme() {
      setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
    }
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Guard de autenticação: rotas públicas explicitamente listadas
  useEffect(() => {
    if (!isClient) return;
    const publicRoutes = ["/login", "/"];
    if (!session && !publicRoutes.includes(path)) {
      navigate({ to: "/login" });
    }
  }, [isClient, session, path, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme={theme} position="top-right" richColors />
    </QueryClientProvider>
  );
}
