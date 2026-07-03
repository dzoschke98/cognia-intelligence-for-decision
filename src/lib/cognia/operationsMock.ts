import type {
  SyncSource, ProcessMovement, LegalDraft, AgendaEvent, WorkQueueItem,
  MovementType, MovementImpact, AgendaEventType, WorkQueueKind, AgendaOrigin,
} from "./types";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysAhead(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ===== 8 Fontes externas simuladas =====
export const initialSyncSources: SyncSource[] = [
  { id: "src-jusbrasil", name: "Jusbrasil", status: "mockado", lastRunAt: daysAgo(0), linkedProcesses: 8420, importedMovements: 1284, successRate: 96 },
  { id: "src-pje", name: "PJe", status: "ativo", lastRunAt: daysAgo(0), linkedProcesses: 6210, importedMovements: 842, successRate: 94 },
  { id: "src-projudi", name: "Projudi", status: "ativo", lastRunAt: daysAgo(0), linkedProcesses: 2140, importedMovements: 310, successRate: 91 },
  { id: "src-esaj", name: "e-SAJ", status: "ativo", lastRunAt: daysAgo(1), linkedProcesses: 3820, importedMovements: 512, successRate: 93 },
  { id: "src-trt", name: "TRT", status: "ativo", lastRunAt: daysAgo(0), linkedProcesses: 4120, importedMovements: 680, successRate: 95 },
  { id: "src-tst", name: "TST", status: "pausado", lastRunAt: daysAgo(3), linkedProcesses: 890, importedMovements: 84, successRate: 88 },
  { id: "src-diarios", name: "Diários Oficiais", status: "ativo", lastRunAt: daysAgo(0), linkedProcesses: 12400, importedMovements: 2110, successRate: 90 },
  { id: "src-csv", name: "Cadastro manual/CSV", status: "mockado", lastRunAt: daysAgo(5), linkedProcesses: 320, importedMovements: 62, successRate: 100 },
];

// ===== 50 movimentações mockadas =====
const MOV_TYPES: MovementType[] = [
  "Audiência designada", "Sentença publicada", "Prazo aberto", "Contestação juntada",
  "Réplica apresentada", "Perícia designada", "Decisão interlocutória", "Recurso interposto",
  "Acordo homologado", "Arquivamento", "Cumprimento de sentença",
];
const IMPACTS: MovementImpact[] = [
  "Recalcular risco", "Atualizar probabilidade de acordo", "Atualizar valor projetado",
  "Criar prazo na Agenda Geral", "Solicitar validação humana", "Gerar sugestão de peça",
  "Sem impacto relevante",
];
const RESPS = ["Renata Almeida", "Marcos Vieira", "Camila Souza", "João Ribeiro", "Nathan Endrigo"];
const COMPANIES = ["co-1", "co-2", "co-3", "co-4"];

export const initialMovements: ProcessMovement[] = Array.from({ length: 50 }, (_, i) => {
  const type = MOV_TYPES[i % MOV_TYPES.length];
  const impact = IMPACTS[i % IMPACTS.length];
  const rBefore = 30 + Math.floor(Math.random() * 50);
  const delta = type === "Sentença publicada" || type === "Decisão interlocutória" ? Math.floor(Math.random() * 25) - 5 : Math.floor(Math.random() * 15) - 5;
  const rAfter = Math.max(5, Math.min(98, rBefore + delta));
  const vBefore = 40000 + Math.floor(Math.random() * 400000);
  const vAfter = Math.max(0, Math.round(vBefore * (1 + (rAfter - rBefore) / 100)));
  const source = initialSyncSources[i % initialSyncSources.length];
  return {
    id: uid("mov"),
    processNumber: `${String(1000 + i).padStart(7, "0")}-${String(10 + (i % 89)).padStart(2, "0")}.2026.5.09.${String(i % 30).padStart(4, "0")}`,
    companyId: COMPANIES[i % COMPANIES.length],
    sourceId: source.id,
    sourceName: source.name,
    date: daysAgo(i % 12),
    type,
    summary: `${type}: ${type === "Sentença publicada" ? "procedência parcial" : type === "Prazo aberto" ? "prazo de 15 dias" : "movimentação registrada"} referente a pedidos de horas extras e verbas rescisórias.`,
    impact,
    status: i < 30 ? "novo" : i < 42 ? "reprocessado" : i < 47 ? "validado" : "ignorado",
    riskBefore: rBefore,
    riskAfter: rAfter,
    valueBefore: vBefore,
    valueAfter: vAfter,
    confidence: 72 + Math.floor(Math.random() * 24),
    reason: `Movimentação identificada como ${type.toLowerCase()}. Impacto sugerido: ${impact.toLowerCase()}.`,
    responsible: RESPS[i % RESPS.length],
  };
});

// ===== 20 minutas =====
const DRAFT_TYPES = [
  "Petição inicial trabalhista", "Contestação trabalhista", "Réplica",
  "Manifestação sobre documentos", "Recurso ordinário", "Agravo",
  "Embargos de declaração", "Acordo", "Notificação extrajudicial",
  "Parecer preliminar", "Defesa administrativa tributária", "Impugnação",
  "Requerimento de compensação/restituição",
];
export const initialDrafts: LegalDraft[] = Array.from({ length: 20 }, (_, i) => {
  const type = DRAFT_TYPES[i % DRAFT_TYPES.length];
  const area = type.includes("tributária") || type.includes("compensação") || type.includes("Impugnação")
    ? "Tributário" : "Trabalhista";
  const pole = type.startsWith("Petição") || type === "Acordo" || type === "Notificação extrajudicial" || type.startsWith("Requerimento") ? "polo_ativo" : "polo_passivo";
  const status = (["rascunho", "em_revisao", "aprovada", "vinculada", "rejeitada"] as const)[i % 5];
  return {
    id: uid("dr"),
    type,
    area: area as LegalDraft["area"],
    pole: pole as LegalDraft["pole"],
    clientName: ["Grupo Contoso", "Indústria Alfa", "Norte Logística", "MedCare"][i % 4],
    counterparty: pole === "polo_ativo" ? "Requerido Mock" : "Reclamante Mock",
    processNumber: i % 3 === 0 ? undefined : `${String(2000 + i).padStart(7, "0")}-11.2026.5.09.0001`,
    court: area === "Trabalhista" ? "Vara do Trabalho de São Paulo" : "Delegacia Regional Tributária",
    uf: "SP",
    summary: "Resumo dos fatos gerado pelo Legal Engine com base nas informações cadastradas.",
    objective: pole === "polo_ativo" ? "Pleitear valores devidos e reconhecimento do direito." : "Reduzir exposição e demonstrar cumprimento das obrigações.",
    urgency: (["baixo", "medio", "alto", "critico"] as const)[i % 4],
    responsible: RESPS[i % RESPS.length],
    status,
    createdAt: daysAgo(i),
    updatedAt: daysAgo(Math.max(0, i - 2)),
    content: draftTemplate(type, pole),
    totalValue: 25000 + Math.floor(Math.random() * 500000),
    companyId: COMPANIES[i % COMPANIES.length],
  };
});

function draftTemplate(type: string, pole: string) {
  return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A)

Referência: ${type}

I — DA QUALIFICAÇÃO
[Qualificação resumida das partes gerada automaticamente pela CognIA]

II — DOS FATOS
Trata-se de ${pole === "polo_ativo" ? "pretensão ajuizada" : "defesa apresentada"} com base nos elementos fornecidos e cruzados pela CognIA.

III — DOS FUNDAMENTOS
${pole === "polo_ativo" ? "A tese inicial encontra amparo em jurisprudência dominante." : "A tese defensiva sustenta-se nos documentos anexos e no princípio da eventualidade."}

IV — DOS PEDIDOS
${pole === "polo_ativo" ? "Requer-se a procedência dos pedidos com condenação da parte contrária." : "Requer-se a improcedência dos pedidos formulados."}

V — DAS PROVAS
Documentos anexos, prova testemunhal e pericial, se necessário.

VI — DO VALOR
Atribui-se à causa o valor de R$ [valor total].

Termos em que pede deferimento.
[Cidade], [data]

[ADVOGADO(A) RESPONSÁVEL — OAB/UF]

------------------------------------------------------------
⚠ MINUTA GERADA POR IA — revisão humana obrigatória antes de qualquer protocolo.`;
}

// ===== 40 eventos de agenda =====
const EVT_TYPES: AgendaEventType[] = [
  "audiencia", "prazo_contestacao", "prazo_replica", "prazo_recurso", "prazo_manifestacao",
  "prazo_documentos", "pericia", "reuniao", "revisao_minuta", "validacao_ia",
  "vencimento_tributario", "validacao_oportunidade", "revisar_contingencia",
  "validar_cruzamento", "gerar_relatorio",
];
const ORIGINS: AgendaOrigin[] = [
  "motor_atualizador", "manual", "sugestao_ia", "gera_minutas",
  "malha_fiscal", "validacao_humana", "decision_engine",
];

export const initialAgenda: AgendaEvent[] = Array.from({ length: 40 }, (_, i) => {
  const type = EVT_TYPES[i % EVT_TYPES.length];
  const isTax = ["vencimento_tributario", "validacao_oportunidade", "revisar_contingencia", "validar_cruzamento"].includes(type);
  const days = (i % 14) - 3; // some past, some today, some future
  return {
    id: uid("ev"),
    title: labelForEventType(type),
    area: isTax ? "tributario" : type === "gerar_relatorio" ? "executivo" : "juridico",
    type,
    relatedRef: isTax ? `EFD 03/2026 #${i}` : `Processo 000${1200 + i}-11.2026.5.09.0001`,
    clientName: ["Grupo Contoso", "Indústria Alfa", "Norte Logística", "MedCare"][i % 4],
    companyId: COMPANIES[i % COMPANIES.length],
    date: days < 0 ? daysAgo(-days) : daysAhead(days),
    time: `${String(8 + (i % 10)).padStart(2, "0")}:${["00", "15", "30", "45"][i % 4]}`,
    responsible: RESPS[i % RESPS.length],
    priority: (["baixo", "medio", "alto", "critico"] as const)[i % 4],
    status: days < -1 ? "atrasado" : days < 0 ? "concluido" : (["pendente", "em_andamento", "pendente", "reagendado"] as const)[i % 4],
    origin: ORIGINS[i % ORIGINS.length],
    atRisk: (i % 5 === 0),
    suggestedAction: isTax ? "Abrir Malha Fiscal" : "Gerar minuta ou petição",
  };
});

function labelForEventType(t: AgendaEventType) {
  const map: Record<AgendaEventType, string> = {
    audiencia: "Audiência trabalhista",
    prazo_contestacao: "Prazo para contestação",
    prazo_replica: "Prazo para réplica",
    prazo_recurso: "Prazo para recurso",
    prazo_manifestacao: "Prazo para manifestação",
    prazo_documentos: "Prazo para juntar documentos",
    pericia: "Perícia técnica",
    reuniao: "Reunião com cliente",
    revisao_minuta: "Revisão de minuta",
    validacao_ia: "Validação de sugestão da IA",
    vencimento_tributario: "Vencimento de ação tributária",
    validacao_oportunidade: "Validação de oportunidade fiscal",
    revisar_contingencia: "Revisar contingência tributária",
    validar_cruzamento: "Validar cruzamento fiscal",
    gerar_relatorio: "Gerar relatório executivo",
  };
  return map[t];
}

// ===== 30 pendências =====
const KINDS: WorkQueueKind[] = [
  "validacao_humana", "sugestao_ia", "prazo_critico", "movimentacao_nova",
  "minuta_revisao", "cruzamento_pendente", "oportunidade_tributaria",
  "contingencia_sem_acao", "dados_incompletos", "baixa_confianca",
  "relatorio_pendente", "tarefa_decision",
];
export const initialWorkQueue: WorkQueueItem[] = Array.from({ length: 30 }, (_, i) => {
  const kind = KINDS[i % KINDS.length];
  const isTax = ["cruzamento_pendente", "oportunidade_tributaria", "contingencia_sem_acao"].includes(kind);
  return {
    id: uid("wq"),
    title: labelForWorkQueueKind(kind),
    kind,
    area: isTax ? "tributario" : kind === "tarefa_decision" || kind === "relatorio_pendente" ? "executivo" : "juridico",
    priority: (["baixo", "medio", "alto", "critico"] as const)[i % 4],
    responsible: i % 6 === 0 ? null : RESPS[i % RESPS.length],
    origin: ORIGINS[i % ORIGINS.length],
    status: (["aberta", "em_andamento", "aberta", "delegada"] as const)[i % 4],
    createdAt: daysAgo(i % 20),
    dueDate: daysAhead((i % 10) - 2),
    companyId: COMPANIES[i % COMPANIES.length],
    detail: `Pendência do tipo ${labelForWorkQueueKind(kind)} originada por ${ORIGINS[i % ORIGINS.length].replace(/_/g, " ")}.`,
  };
});

export function labelForWorkQueueKind(k: WorkQueueKind) {
  const map: Record<WorkQueueKind, string> = {
    validacao_humana: "Validação humana pendente",
    sugestao_ia: "Sugestão da IA para revisar",
    prazo_critico: "Prazo crítico próximo",
    movimentacao_nova: "Movimentação nova para analisar",
    minuta_revisao: "Minuta aguardando revisão",
    cruzamento_pendente: "Cruzamento fiscal pendente",
    oportunidade_tributaria: "Oportunidade tributária em validação",
    contingencia_sem_acao: "Contingência sem ação definida",
    dados_incompletos: "Dados cadastrais incompletos",
    baixa_confianca: "Campo com baixa confiança da IA",
    relatorio_pendente: "Relatório pendente de geração",
    tarefa_decision: "Tarefa criada pelo Decision Engine",
  };
  return map[k];
}

export function labelForAgendaOrigin(o: AgendaOrigin) {
  const map: Record<AgendaOrigin, string> = {
    motor_atualizador: "Motor Atualizador",
    manual: "Manual",
    sugestao_ia: "Sugestão da IA",
    gera_minutas: "Gera Minutas",
    malha_fiscal: "Malha Fiscal",
    validacao_humana: "Validação Humana",
    decision_engine: "Decision Engine",
  };
  return map[o];
}
