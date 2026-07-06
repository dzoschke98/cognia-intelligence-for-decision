import type { RadarUpdate, RadarArea, RiskLevel } from "./types";

const gradientByArea: Record<RadarArea, string> = {
  Trabalhista: "from-primary/60 via-cyan/40 to-purple/60",
  Tributário: "from-cyan/60 via-primary/40 to-purple/40",
  "Reforma Tributária": "from-purple/60 via-primary/50 to-cyan/40",
  Compliance: "from-warning/50 via-primary/40 to-purple/40",
  Jurisprudência: "from-primary/60 via-purple/50 to-cyan/30",
  Regulatório: "from-risk/40 via-purple/50 to-primary/40",
};

const tagsByArea: Record<RadarArea, string[]> = {
  Trabalhista: ["CLT", "TST", "Jornada", "Passivo trabalhista"],
  Tributário: ["ICMS", "PIS/COFINS", "Crédito fiscal", "Compliance fiscal"],
  "Reforma Tributária": ["CBS", "IBS", "Transição", "Simulação"],
  Compliance: ["Governança", "Due diligence", "Risco reputacional"],
  Jurisprudência: ["Tese", "TRT", "Precedente"],
  Regulatório: ["Norma", "Portaria", "Órgão regulador"],
};

function riskFromScore(s: number): RiskLevel {
  if (s >= 81) return "critico";
  if (s >= 61) return "alto";
  if (s >= 31) return "medio";
  return "baixo";
}

function baseScore(rel: RiskLevel): number {
  return rel === "critico" ? 90 : rel === "alto" ? 78 : rel === "medio" ? 58 : 40;
}

/**
 * Enriquece uma RadarUpdate com campos editoriais derivados quando ausentes.
 * Mantém compatibilidade com o mock legado.
 */
export function enrichRadar(u: RadarUpdate): Required<Pick<RadarUpdate,
  "tags" | "content" | "author" | "readingMinutes" | "impactScore" |
  "potentialValue" | "confidence" | "urgency" | "recommendations" |
  "validationPoints" | "gradient"
>> & RadarUpdate {
  const impactScore = u.impactScore ?? baseScore(u.relevance) + (u.impactedCount > 20 ? 6 : 0);
  const urgency = u.urgency ?? riskFromScore(impactScore);
  const potentialValue = u.potentialValue ?? u.impactedCount * (u.impactedKind === "documentos" ? 42000 : u.impactedKind === "empresas" ? 380000 : 32000);
  const confidence = u.confidence ?? 78 + Math.min(15, Math.round(impactScore / 10));
  const tags = u.tags ?? tagsByArea[u.area];
  const gradient = u.gradient ?? gradientByArea[u.area];
  const readingMinutes = u.readingMinutes ?? Math.max(3, Math.round((u.summary.length + (u.content?.length ?? 400)) / 800));
  const author = u.author ?? "CognIA Radar";
  const recommendations = u.recommendations ?? [
    u.suggestedAction,
    "Solicitar validação do especialista responsável pela área.",
    "Registrar impacto na carteira e priorizar no Decision Engine.",
  ];
  const validationPoints = u.validationPoints ?? [
    "Confirmar aderência dos processos/documentos ao tema.",
    "Validar premissas de risco e exposição financeira.",
    "Aprovar plano de ação recomendado antes da execução.",
  ];
  const content = u.content ?? [
    `${u.summary}`,
    "",
    `**Contexto.** ${u.whyMatters}`,
    "",
    `**Por que isso importa?** A CognIA correlacionou esta atualização com ${u.impactedCount} ${u.impactedKind} da carteira ativa. O padrão observado sugere revisão preventiva antes que a exposição materialize prazos, custos ou perda de oportunidades.`,
    "",
    `**Possível impacto na carteira.** Exposição estimada aproximada de R$ ${(potentialValue / 1000).toFixed(0)}k. Nível de urgência sugerido: ${urgency}. Confiança do modelo: ${confidence}%.`,
    "",
    `**Recomendação da CognIA.** ${u.suggestedAction} — recomenda-se avaliar em conjunto com o responsável indicado e enviar para validação humana antes de qualquer decisão final.`,
  ].join("\n");
  return { ...u, tags, content, author, readingMinutes, impactScore, potentialValue, confidence, urgency, recommendations, validationPoints, gradient };
}

export function whatsAppShareUrl(u: RadarUpdate): string {
  const relLabel = u.relevance === "critico" ? "Crítica" : u.relevance === "alto" ? "Alta" : u.relevance === "medio" ? "Média" : "Baixa";
  const msg = `CognIA Radar de Inteligência: ${u.title}. Relevância: ${relLabel}. Impacto estimado: ${u.impactedCount} ${u.impactedKind}. Veja a análise no Radar de Inteligência. (MVP com dados mockados)`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}
