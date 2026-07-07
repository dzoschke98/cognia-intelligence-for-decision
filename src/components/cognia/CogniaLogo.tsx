import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/cognia-logo-light.png";
import logoDark from "@/assets/cognia-logo-dark.png";

/**
 * Logo da CognIA que troca automaticamente entre a versão para fundos
 * claros (texto escuro) e a versão para fundos escuros (texto claro).
 *
 * `variant` força uma versão específica (útil no login sobre overlay escuro).
 */
export function CogniaLogo({
  className,
  variant,
}: {
  className?: string;
  variant?: "auto" | "light" | "dark";
}) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (variant && variant !== "auto") return;
    if (typeof document === "undefined") return;
    const sync = () => setIsDark(!document.documentElement.classList.contains("light"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [variant]);

  const useDark = variant === "dark" || (variant !== "light" && isDark);
  const src = useDark ? logoDark : logoLight;

  return <img src={src} alt="CognIA" className={cn("object-contain", className)} draggable={false} />;
}
