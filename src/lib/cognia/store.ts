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
import type {
  Company, User, DocumentItem, LegalAnalysis, TaxAnalysis,
  DecisionRecommendation, AuditLog, ValidationStatus, RiskLevel, EngineType, DocumentType,
  RadarUpdate, RadarStatus, JurimetryPending, JurimetryFieldStatus,
} from "./types";

const KEY = "cognia.state.v2";

interface State {
  documents: DocumentItem[];
  legal: LegalAnalysis[];
  tax: TaxAnalysis[];
  decisions: DecisionRecommendation[];
  logs: AuditLog[];
  radar: RadarUpdate[];
  pendings: JurimetryPending[];
  currentUserEmail: string | null;
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
};


let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
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
