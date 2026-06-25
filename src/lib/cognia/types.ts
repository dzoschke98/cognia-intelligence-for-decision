export type UUID = string;

export type EngineType = "legal" | "tax" | "decision";
export type RiskLevel = "baixo" | "medio" | "alto" | "critico";
export type ValidationStatus = "pendente" | "aprovado" | "corrigido" | "rejeitado";
export type DocumentStatus = "pendente" | "processando" | "concluido" | "falhou";
export type DocumentType = "juridico" | "tributario" | "outro";
export type UserRole = "CEO" | "CFO" | "Diretor Jurídico" | "Diretor Tributário" | "Administrador";

export interface Company {
  id: UUID;
  name: string;
  sector: string;
}

export interface User {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
  companyId?: UUID;
}

export interface DocumentItem {
  id: UUID;
  name: string;
  type: DocumentType;
  companyId: UUID;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentStatus;
  engine: EngineType | null;
  analysisId?: UUID;
}

export interface LegalParty {
  role: string;
  name: string;
}

export interface LegalClaim {
  claim: string;
  estimatedValue: number;
  category: string;
  risk: RiskLevel;
  confidence: number;
}

export interface LegalAnalysis {
  id: UUID;
  processNumber: string;
  companyId: UUID;
  processType: string;
  claimant: string;
  defendant: string;
  lawyers: string;
  court: string;
  uf: string;
  estimatedValue: number;
  riskScore: number; // 0-100
  risk: RiskLevel;
  confidence: number; // 0-100
  validationStatus: ValidationStatus;
  responsible: string;
  createdAt: string;
  summary: string;
  parties: LegalParty[];
  claims: LegalClaim[];
  recommendations: string[];
  sources: string[];
  riskJustification: string[];
  engineVersion: string;
  promptHash: string;
  estimatedCost: number;
  correctionNote?: string;
  rejectionReason?: string;
}

export interface TaxInconsistency {
  type: string;
  registry: string;
  description: string;
  value: number;
  severity: RiskLevel;
  confidence: number;
}

export interface TaxOpportunity {
  title: string;
  value: number;
  description: string;
}

export interface TaxAnalysis {
  id: UUID;
  companyId: UUID;
  fileType: string;
  competence: string;
  inconsistenciesValue: number;
  opportunitiesValue: number;
  fiscalScore: number;
  risk: RiskLevel;
  confidence: number;
  validationStatus: ValidationStatus;
  responsible: string;
  createdAt: string;
  summary: string;
  inconsistencies: TaxInconsistency[];
  opportunities: TaxOpportunity[];
  recommendations: string[];
  engineVersion: string;
  promptHash: string;
  estimatedCost: number;
  financialImpact: number;
  correctionNote?: string;
  rejectionReason?: string;
}

export interface DecisionRecommendation {
  id: UUID;
  title: string;
  origin: "Legal" | "Tax" | "Cross";
  originId?: UUID;
  financialImpact: number;
  urgency: RiskLevel;
  priorityScore: number;
  suggestedOwner: string;
  status: "pendente" | "em_revisao" | "concluido";
  recommendedAction: string;
}

export interface AuditLog {
  id: UUID;
  timestamp: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  resource: string;
  companyId?: UUID;
  engine?: string;
  engineVersion?: string;
  promptHash?: string;
  ip: string;
  result: "success" | "error";
}

export interface GraphNode {
  id: string;
  label: string;
  type: "Empresa" | "Processo" | "Pedido" | "Tese" | "Risco" | "Tributo" | "Crédito" | "Oportunidade" | "Recomendação" | "Validação" | "Especialista";
  description: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

// ===== Radar de Inteligência =====
export type RadarArea = "Trabalhista" | "Tributário" | "Reforma Tributária" | "Compliance" | "Jurisprudência";
export type RadarStatus = "novo" | "analisado" | "em_revisao" | "acao_criada";

export interface RadarImpactItem {
  kind: "processo" | "documento" | "diagnostico";
  ref: string;
  detail: string;
  risk?: RiskLevel;
}

export interface RadarSuggestion {
  id: UUID;
  title: string;
  priority: RiskLevel;
  owner: string;
  deadline: string;
  reason: string;
}

export interface RadarUpdate {
  id: UUID;
  title: string;
  area: RadarArea;
  source: string;
  date: string;
  relevance: RiskLevel;
  impactedCount: number;
  impactedKind: "processos" | "documentos" | "empresas";
  summary: string;
  whyMatters: string;
  suggestedAction: string;
  companyId: UUID;
  status: RadarStatus;
  impacts: RadarImpactItem[];
  suggestions: RadarSuggestion[];
}

// ===== Jurimetria Trabalhista =====
export type JurimetryFieldStatus = "pendente" | "aprovado" | "corrigido" | "rejeitado" | "especialista";

export interface JurimetryClaim {
  claim: string;
  count: number;
  successPct: number;
  agreementPct: number;
  convictionPct: number;
  closedPct: number;
  extinctPct: number;
  avgAgreement: number;
  avgConviction: number;
  avgRisk: number;
  confidence: number;
  validation: ValidationStatus;
}

export interface JurimetryPending {
  id: UUID;
  processNumber: string;
  field: string;
  suggested: string;
  confidence: number;
  status: JurimetryFieldStatus;
  responsible: string;
}

export interface JurimetrySuggestion {
  id: UUID;
  title: string;
  reason: string;
  impactedProcesses: number;
  financialImpact: number;
  priority: RiskLevel;
  confidence: number;
  owner: string;
  action: string;
}
