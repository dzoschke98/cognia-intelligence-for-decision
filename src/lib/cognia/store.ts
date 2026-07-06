/**
 * CognIA in-memory + localStorage store.
 * Future: replace with real APIs by swapping these functions.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  companies, users, initialDocuments, initialLegalAnalyses, initialTaxAnalyses,
  decisionRecommendations, initialAuditLogs,
} from "./mockData";
import {
  initialRadarUpdates, jurimetryPendings as seedPendings, initialRadarLogs, initialJurimetryLogs,
} from "./radarMock";
import {
  initialSyncSources, initialMovements, initialDrafts, initialAgenda, initialWorkQueue,
} from "./operationsMock";
import type {
  Company, User, DocumentItem, LegalAnalysis, TaxAnalysis,
  DecisionRecommendation, AuditLog, ValidationStatus, RiskLevel, EngineType, DocumentType,
  RadarUpdate, JurimetryPending,
  SyncSource, ProcessMovement, LegalDraft, AgendaEvent, WorkQueueItem,
  MovementAnalysisStatus, DraftStatus, AgendaStatus, WorkQueueStatus,
} from "./types";

const KEY = "cognia.state.v3";
const LEGACY_KEY = "cognia.state.v2";

interface State {
  documents: DocumentItem[];
  legal: LegalAnalysis[];
  tax: TaxAnalysis[];
  decisions: DecisionRecommendation[];
  logs: AuditLog[];
  radar: RadarUpdate[];
  pendings: JurimetryPending[];
  currentUserEmail: string | null;
  activeCompanyId: string;
  // Novos módulos
  sources: SyncSource[];
  movements: ProcessMovement[];
  drafts: LegalDraft[];
  agenda: AgendaEvent[];
  workQueue: WorkQueueItem[];
}

const initial: State = {
  documents: initialDocuments,
  legal: initialLegalAnalyses,
  tax: initialTaxAnalyses,
  decisions: decisionRecommendations,
  logs: [...initialRadarLogs, ...initialJurimetryLogs, ...initialAuditLogs],
  radar: initialRadarUpdates,
  pendings: seedPendings,
  currentUserEmail: null,
  activeCompanyId: "co-1",
  sources: initialSyncSources,
  movements: initialMovements,
  drafts: initialDrafts,
  agenda: initialAgenda,
  workQueue: initialWorkQueue,
};

export function setActiveCompany(id: string) {
  state = { ...state, activeCompanyId: id };
  emit();
}
export function addDocumentMock(input: { name: string; type: DocumentType; companyId: string; uploadedBy: string }) {
  return processDocumentMock(input);
}


let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
    // Migrate v2 → v3: preserve prior mutations, add new module defaults
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return { ...initial, ...JSON.parse(legacy) };
    return initial;
  } catch {
    return initial;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function emit() { persist(); listeners.forEach((l) => l()); }

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function getState() { return state; }

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export function riskFromScore(score: number): RiskLevel {
  if (score >= 81) return "critico";
  if (score >= 61) return "alto";
  if (score >= 31) return "medio";
  return "baixo";
}

export function getCompanies(): Company[] { return companies; }
export function getCompany(id: string) { return companies.find((c) => c.id === id); }
export function getUsers(): User[] { return users; }

export function login(email: string) {
  state = { ...state, currentUserEmail: email };
  addLog({ action: "user.login", resource: "auth", userEmail: email });
  emit();
}
export function logout() {
  state = { ...state, currentUserEmail: null };
  emit();
}
export function currentUser(): User | null {
  return users.find((u) => u.email === state.currentUserEmail) ?? null;
}

export function addLog(partial: Partial<AuditLog> & { action: string; resource: string; userEmail?: string }) {
  const user = users.find((u) => u.email === (partial.userEmail ?? state.currentUserEmail)) ?? users[3];
  const log: AuditLog = {
    id: uid("log"),
    timestamp: new Date().toISOString(),
    userEmail: user.email,
    userRole: user.role,
    action: partial.action,
    resource: partial.resource,
    companyId: partial.companyId ?? user.companyId,
    engine: partial.engine,
    engineVersion: partial.engineVersion,
    promptHash: partial.promptHash,
    ip: partial.ip ?? "200.158.42.10",
    result: partial.result ?? "success",
  };
  state = { ...state, logs: [log, ...state.logs] };
  emit();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function genHash(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

export async function processDocumentMock(input: {
  name: string; type: DocumentType; companyId: string; uploadedBy: string;
}): Promise<{ docId: string; analysisId: string; engine: EngineType }> {
  const docId = uid("doc");
  const newDoc: DocumentItem = {
    id: docId, name: input.name, type: input.type, companyId: input.companyId,
    uploadedBy: input.uploadedBy, uploadedAt: new Date().toISOString(),
    status: "processando", engine: input.type === "juridico" ? "legal" : "tax",
  };
  state = { ...state, documents: [newDoc, ...state.documents] };
  emit();
  addLog({ action: "document.upload", resource: "document", companyId: input.companyId });

  await delay(1800);

  let analysisId: string;
  const engine: EngineType = input.type === "juridico" ? "legal" : "tax";
  if (engine === "legal") {
    const score = 40 + Math.floor(Math.random() * 50);
    const a: LegalAnalysis = {
      id: uid("leg"),
      processNumber: `000${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(10 + Math.random() * 89)}.2026.5.09.0001`,
      companyId: input.companyId,
      processType: "Trabalhista",
      claimant: "Reclamante Mock",
      defendant: getCompany(input.companyId)?.name ?? "Empresa",
      lawyers: "Escritório Mock & Associados",
      court: "Vara do Trabalho Mock",
      uf: "SP",
      estimatedValue: 50000 + Math.floor(Math.random() * 150000),
      riskScore: score, risk: riskFromScore(score), confidence: 70 + Math.floor(Math.random() * 25),
      validationStatus: "pendente", responsible: "Renata Almeida",
      createdAt: new Date().toISOString(),
      summary: "Análise jurídica preliminar gerada automaticamente. Recomenda-se validação humana antes de qualquer ação.",
      parties: [{ role: "Reclamante", name: "Reclamante Mock" }, { role: "Reclamada", name: getCompany(input.companyId)?.name ?? "" }],
      claims: [
        { claim: "Horas extras", estimatedValue: 40000, category: "Jornada", risk: "alto", confidence: 80 },
        { claim: "Verbas rescisórias", estimatedValue: 22000, category: "Rescisórias", risk: "medio", confidence: 78 },
      ],
      recommendations: ["Revisar documentação de jornada", "Avaliar acordo", "Solicitar validação especialista"],
      sources: ["Documento processual enviado", "Histórico interno mockado", "Base trabalhista simulada"],
      riskJustification: ["Documentação parcial", "Valor potencial relevante", "Histórico em casos similares"],
      engineVersion: "legal-engine-v1.0.0",
      promptHash: genHash("legal-risk-2026-06"),
      estimatedCost: 0.39,
    };
    state = { ...state, legal: [a, ...state.legal] };
    analysisId = a.id;
    addLog({ action: "legal.analysis.generated", resource: "legal", engine: "legal", engineVersion: a.engineVersion, promptHash: a.promptHash, companyId: input.companyId });
  } else {
    const score = 35 + Math.floor(Math.random() * 55);
    const opp = 50000 + Math.floor(Math.random() * 250000);
    const a: TaxAnalysis = {
      id: uid("tax"),
      companyId: input.companyId,
      fileType: "EFD ICMS/IPI",
      competence: new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }),
      inconsistenciesValue: 20000 + Math.floor(Math.random() * 100000),
      opportunitiesValue: opp,
      fiscalScore: score, risk: riskFromScore(score), confidence: 70 + Math.floor(Math.random() * 22),
      validationStatus: "pendente", responsible: "Nathan Endrigo",
      createdAt: new Date().toISOString(),
      summary: "Diagnóstico tributário preliminar identificou inconsistências e oportunidades. Recomenda-se validação técnica.",
      inconsistencies: [
        { type: "CFOP", registry: "C170", description: "Divergência de CFOP", value: 38000, severity: "medio", confidence: 84 },
        { type: "ICMS", registry: "E110", description: "Crédito não aproveitado", value: 62000, severity: "alto", confidence: 87 },
      ],
      opportunities: [
        { title: "Crédito ICMS potencial", value: opp * 0.6, description: "Créditos sobre insumos." },
        { title: "Revisão PIS/COFINS", value: opp * 0.4, description: "Reclassificação." },
      ],
      recommendations: ["Validar amostra fiscal", "Revisar CFOP/CST", "Submeter ao especialista"],
      engineVersion: "tax-engine-v1.0.0",
      promptHash: genHash("tax-diag-2026-06"),
      estimatedCost: 0.47,
      financialImpact: opp,
    };
    state = { ...state, tax: [a, ...state.tax] };
    analysisId = a.id;
    addLog({ action: "tax.diagnosis.generated", resource: "tax", engine: "tax", engineVersion: a.engineVersion, promptHash: a.promptHash, companyId: input.companyId });
  }

  state = {
    ...state,
    documents: state.documents.map((d) =>
      d.id === docId ? { ...d, status: "concluido", analysisId } : d
    ),
  };
  addLog({ action: "document.processed", resource: "document", companyId: input.companyId });
  emit();

  return { docId, analysisId, engine };
}

export function setLegalStatus(id: string, status: ValidationStatus, extras?: { reason?: string; correction?: Partial<LegalAnalysis>; note?: string }) {
  state = {
    ...state,
    legal: state.legal.map((a) => a.id === id ? {
      ...a,
      ...(extras?.correction ?? {}),
      validationStatus: status,
      rejectionReason: status === "rejeitado" ? extras?.reason : a.rejectionReason,
      correctionNote: status === "corrigido" ? extras?.note : a.correctionNote,
    } : a),
  };
  const map: Record<ValidationStatus, string> = {
    aprovado: "analysis.approved", rejeitado: "analysis.rejected",
    corrigido: "analysis.corrected", pendente: "analysis.updated",
  };
  addLog({ action: map[status], resource: "legal", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
  emit();
}

export function setTaxStatus(id: string, status: ValidationStatus, extras?: { reason?: string; correction?: Partial<TaxAnalysis>; note?: string }) {
  state = {
    ...state,
    tax: state.tax.map((a) => a.id === id ? {
      ...a,
      ...(extras?.correction ?? {}),
      validationStatus: status,
      rejectionReason: status === "rejeitado" ? extras?.reason : a.rejectionReason,
      correctionNote: status === "corrigido" ? extras?.note : a.correctionNote,
    } : a),
  };
  const map: Record<ValidationStatus, string> = {
    aprovado: "analysis.approved", rejeitado: "analysis.rejected",
    corrigido: "analysis.corrected", pendente: "analysis.updated",
  };
  addLog({ action: map[status], resource: "tax", engine: "tax", engineVersion: "tax-engine-v1.0.0" });
  emit();
}

export function generateMockLegal(companyId: string) {
  return processDocumentMock({
    name: `Processo_mock_${Date.now()}.pdf`, type: "juridico", companyId, uploadedBy: currentUser()?.name ?? "Demo",
  });
}
export function generateMockTax(companyId: string) {
  return processDocumentMock({
    name: `Fiscal_mock_${Date.now()}.txt`, type: "tributario", companyId, uploadedBy: currentUser()?.name ?? "Demo",
  });
}

// Hook for client-only mount
export function useIsClient() {
  const [c, setC] = useState(false);
  useEffect(() => setC(true), []);
  return c;
}

// ===== Radar =====
export function setRadarStatus(id: string, status: import("./types").RadarStatus) {
  state = { ...state, radar: state.radar.map((r) => r.id === id ? { ...r, status } : r) };
  addLog({ action: status === "acao_criada" ? "radar.action.created" : "radar.update.viewed", resource: "radar", engine: "radar", engineVersion: "radar-engine-v0.9.0" });
  emit();
}
export function createRadarAction(updateId: string, suggestionTitle: string) {
  const u = state.radar.find((r) => r.id === updateId);
  setRadarStatus(updateId, "acao_criada");
  if (u) {
    const dec: DecisionRecommendation = {
      id: uid("dec"),
      title: `[Radar] ${suggestionTitle}`,
      origin: "Cross",
      financialImpact: u.impactedCount * 18000,
      urgency: u.relevance,
      priorityScore: u.relevance === "critico" ? 95 : u.relevance === "alto" ? 82 : 65,
      suggestedOwner: u.suggestions[0]?.owner ?? "Comitê CognIA",
      status: "pendente",
      recommendedAction: u.suggestedAction,
    };
    state = { ...state, decisions: [dec, ...state.decisions] };
    addLog({ action: "radar.action.sent_to_validation", resource: "radar", engine: "radar", engineVersion: "radar-engine-v0.9.0", companyId: u.companyId });
    emit();
  }
}
export function dismissRadarSuggestion(_updateId: string) {
  addLog({ action: "radar.recommendation.dismissed", resource: "radar", engine: "radar", engineVersion: "radar-engine-v0.9.0" });
}
export function logRadarImpact(_updateId: string) {
  addLog({ action: "radar.impact.generated", resource: "radar", engine: "radar", engineVersion: "radar-engine-v0.9.0" });
}
export function toggleRadarFavorite(id: string) {
  const item = state.radar.find((r) => r.id === id);
  const willFav = !item?.favorite;
  state = { ...state, radar: state.radar.map((r) => r.id === id ? { ...r, favorite: willFav } : r) };
  addLog({ action: willFav ? "radar.news.favorited" : "radar.news.unfavorited", resource: "radar", engine: "radar", engineVersion: "radar-engine-v0.9.0" });
  emit();
  return willFav;
}
export function logRadarShareWhatsApp(id: string) {
  const item = state.radar.find((r) => r.id === id);
  addLog({ action: "radar.news.shared_whatsapp", resource: `radar:${item?.title ?? id}`, engine: "radar", engineVersion: "radar-engine-v0.9.0", companyId: item?.companyId });
}
export function sendRadarToWorkQueue(id: string, kind: import("./types").WorkQueueKind = "sugestao_ia") {
  const u = state.radar.find((r) => r.id === id);
  if (!u) return;
  const item: import("./types").WorkQueueItem = {
    id: uid("wq"),
    title: `[Radar] ${u.title}`,
    kind,
    area: u.area === "Tributário" || u.area === "Reforma Tributária" ? "tributario" : "juridico",
    priority: u.relevance,
    responsible: u.suggestions[0]?.owner ?? null,
    origin: "decision_engine",
    status: "aberta",
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    companyId: u.companyId,
    detail: u.suggestedAction,
  };
  state = { ...state, workQueue: [item, ...state.workQueue] };
  addLog({ action: "radar.sent_to_work_queue", resource: "work_queue", engine: "radar", engineVersion: "radar-engine-v0.9.0", companyId: u.companyId });
  addLog({ action: "radar.pending_item.created", resource: "work_queue", engine: "radar", engineVersion: "radar-engine-v0.9.0", companyId: u.companyId });
  emit();
  return item;
}
export function createRadarAgendaEvent(id: string, input: { title: string; date: string; responsible: string; priority: import("./types").RiskLevel; note?: string }) {
  const u = state.radar.find((r) => r.id === id);
  if (!u) return;
  const ev: import("./types").AgendaEvent = {
    id: uid("ev"),
    title: input.title,
    area: u.area === "Tributário" || u.area === "Reforma Tributária" ? "tributario" : "juridico",
    type: "revisao_minuta",
    relatedRef: u.title,
    clientName: getCompany(u.companyId)?.name ?? "—",
    companyId: u.companyId,
    date: input.date,
    time: "09:00",
    responsible: input.responsible,
    priority: input.priority,
    status: "pendente",
    origin: "decision_engine",
    atRisk: false,
    suggestedAction: input.note ?? u.suggestedAction,
  };
  state = { ...state, agenda: [ev, ...state.agenda] };
  addLog({ action: "radar.agenda_event.created", resource: "agenda_event", engine: "radar", engineVersion: "radar-engine-v0.9.0", companyId: u.companyId });
  emit();
  return ev;
}
export function generateRadarExecutiveSummary(id: string) {
  const u = state.radar.find((r) => r.id === id);
  addLog({ action: "radar.executive_summary.generated", resource: `radar:${u?.title ?? id}`, engine: "radar", engineVersion: "radar-engine-v0.9.0", companyId: u?.companyId });
}

// ===== Jurimetria =====
export function setPendingStatus(id: string, status: import("./types").JurimetryFieldStatus) {
  state = { ...state, pendings: state.pendings.map((p) => p.id === id ? { ...p, status } : p) };
  const map: Record<import("./types").JurimetryFieldStatus, string> = {
    aprovado: "jurimetry.field.approved",
    corrigido: "jurimetry.field.corrected",
    rejeitado: "jurimetry.field.rejected",
    especialista: "jurimetry.suggestion.sent_to_validation",
    pendente: "jurimetry.dashboard.viewed",
  };
  addLog({ action: map[status], resource: "jurimetry", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
  emit();
}
export function logJurimetry(action: string) {
  addLog({ action, resource: "jurimetry", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
}

// ===== Motor Atualizador de Processos =====
export function runSourceSyncMock(sourceId: string) {
  const src = state.sources.find((s) => s.id === sourceId);
  if (!src) return;
  const now = new Date().toISOString();
  const added = 3 + Math.floor(Math.random() * 6);
  const newMovs: ProcessMovement[] = Array.from({ length: added }, (_, i) => {
    const rBefore = 40 + Math.floor(Math.random() * 40);
    const rAfter = Math.max(5, Math.min(98, rBefore + Math.floor(Math.random() * 25) - 8));
    const vBefore = 40000 + Math.floor(Math.random() * 300000);
    return {
      id: uid("mov"),
      processNumber: `${String(9000 + Math.floor(Math.random() * 999)).padStart(7, "0")}-${String(10 + i).padStart(2, "0")}.2026.5.09.0001`,
      companyId: state.activeCompanyId,
      sourceId: src.id,
      sourceName: src.name,
      date: now,
      type: "Prazo aberto",
      summary: `Nova movimentação importada de ${src.name}. Requer análise.`,
      impact: "Recalcular risco",
      status: "novo",
      riskBefore: rBefore,
      riskAfter: rAfter,
      valueBefore: vBefore,
      valueAfter: Math.round(vBefore * (1 + (rAfter - rBefore) / 100)),
      confidence: 75 + Math.floor(Math.random() * 20),
      reason: `Sincronização mockada de ${src.name}. Impacto sugerido: recalcular risco.`,
      responsible: "Renata Almeida",
    };
  });
  state = {
    ...state,
    sources: state.sources.map((s) => s.id === sourceId ? { ...s, lastRunAt: now, importedMovements: s.importedMovements + added } : s),
    movements: [...newMovs, ...state.movements],
  };
  addLog({ action: "process_update_engine.source.executed", resource: `source:${src.name}`, engine: "legal", engineVersion: "legal-engine-v1.0.0" });
  newMovs.forEach(() => addLog({ action: "process_update_engine.movement.imported", resource: "movement", engine: "legal", engineVersion: "legal-engine-v1.0.0" }));
  emit();
  return added;
}
export function setMovementStatus(id: string, status: MovementAnalysisStatus) {
  state = { ...state, movements: state.movements.map((m) => m.id === id ? { ...m, status } : m) };
  const actionMap: Record<MovementAnalysisStatus, string> = {
    novo: "process_update_engine.movement.imported",
    reprocessado: "process_update_engine.analysis.recalculated",
    validado: "process_update_engine.validation.requested",
    ignorado: "process_update_engine.movement.imported",
  };
  addLog({ action: actionMap[status], resource: "movement", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
  emit();
}
export function logProcessEngine(action: string) {
  addLog({ action, resource: "process_update_engine", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
}

// ===== Gera Minutas e Petições =====
export function createDraft(input: Partial<LegalDraft> & { type: string; area: LegalDraft["area"]; pole: LegalDraft["pole"]; clientName: string }) {
  const now = new Date().toISOString();
  const d: LegalDraft = {
    id: uid("dr"),
    type: input.type,
    area: input.area,
    pole: input.pole,
    clientName: input.clientName,
    counterparty: input.counterparty ?? "—",
    processNumber: input.processNumber,
    court: input.court ?? "—",
    uf: input.uf ?? "SP",
    summary: input.summary ?? "",
    objective: input.objective ?? "",
    urgency: input.urgency ?? "medio",
    responsible: input.responsible ?? (currentUser()?.name ?? "Especialista"),
    status: "rascunho",
    createdAt: now,
    updatedAt: now,
    content: input.content ?? "",
    totalValue: input.totalValue ?? 0,
    linkedProcessId: input.linkedProcessId,
    companyId: input.companyId ?? state.activeCompanyId,
  };
  state = { ...state, drafts: [d, ...state.drafts] };
  addLog({ action: "legal_draft.created", resource: "legal_draft", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
  addLog({ action: "legal_draft.generated", resource: "legal_draft", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
  emit();
  return d;
}
export function updateDraft(id: string, patch: Partial<LegalDraft>) {
  state = {
    ...state,
    drafts: state.drafts.map((d) => d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d),
  };
  addLog({ action: "legal_draft.edited", resource: "legal_draft", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
  emit();
}
export function setDraftStatus(id: string, status: DraftStatus) {
  state = {
    ...state,
    drafts: state.drafts.map((d) => d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d),
  };
  const map: Record<DraftStatus, string> = {
    rascunho: "legal_draft.edited",
    em_revisao: "legal_draft.sent_to_review",
    aprovada: "legal_draft.approved",
    rejeitada: "legal_draft.rejected",
    vinculada: "legal_draft.linked_to_process",
    arquivada: "legal_draft.edited",
  };
  addLog({ action: map[status], resource: "legal_draft", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
  emit();
}
export function logDraft(action: string) {
  addLog({ action, resource: "legal_draft", engine: "legal", engineVersion: "legal-engine-v1.0.0" });
}

// ===== Agenda Geral =====
export function setAgendaStatus(id: string, status: AgendaStatus) {
  state = { ...state, agenda: state.agenda.map((e) => e.id === id ? { ...e, status } : e) };
  const map: Record<AgendaStatus, string> = {
    pendente: "general_agenda.event.created",
    em_andamento: "general_agenda.event.created",
    concluido: "general_agenda.event.completed",
    atrasado: "general_agenda.event.created",
    reagendado: "general_agenda.event.rescheduled",
  };
  addLog({ action: map[status], resource: "agenda_event", engine: "decision", engineVersion: "decision-engine-v1.0.0" });
  emit();
}
export function createAgendaEvent(input: Omit<AgendaEvent, "id">) {
  const ev: AgendaEvent = { ...input, id: uid("ev") };
  state = { ...state, agenda: [ev, ...state.agenda] };
  addLog({ action: "general_agenda.event.created", resource: "agenda_event", engine: "decision", engineVersion: "decision-engine-v1.0.0" });
  emit();
  return ev;
}
export function logAgenda(action: string) {
  addLog({ action, resource: "general_agenda", engine: "decision", engineVersion: "decision-engine-v1.0.0" });
}

// ===== Central de Pendências =====
export function setWorkQueueStatus(id: string, status: WorkQueueStatus) {
  state = { ...state, workQueue: state.workQueue.map((w) => w.id === id ? { ...w, status } : w) };
  addLog({ action: `work_queue.item.${status}`, resource: "work_queue", engine: "decision", engineVersion: "decision-engine-v1.0.0" });
  emit();
}
export function delegateWorkQueue(id: string, to: string) {
  state = { ...state, workQueue: state.workQueue.map((w) => w.id === id ? { ...w, responsible: to, status: "delegada" } : w) };
  addLog({ action: "work_queue.item.delegated", resource: "work_queue", engine: "decision", engineVersion: "decision-engine-v1.0.0" });
  emit();
}
export function logWorkQueue(action: string) {
  addLog({ action, resource: "work_queue", engine: "decision", engineVersion: "decision-engine-v1.0.0" });
}

