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
