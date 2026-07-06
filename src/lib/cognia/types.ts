export type UUID = string;

export type EngineType = "legal" | "tax" | "decision";
export type RiskLevel = "baixo" | "medio" | "alto" | "critico";
export type ValidationStatus = "pendente" | "aprovado" | "corrigido" | "rejeitado";
export type DocumentStatus = "pendente" | "processando" | "concluido" | "falhou";
export type DocumentType = "juridico" | "tributario" | "outro";
export type UserRole = "CEO" | "CFO" | "Diretor Jurídico" | "Diretor Tributário" | "Administrador";

// ===== Novos tipos para módulos operacionais =====
export type ClientPole = "polo_ativo" | "polo_passivo" | "terceiro" | "consultivo";
export type LegalStrategy =
  | "ajuizar" | "defender" | "negociar" | "produzir_prova"
  | "reduzir_risco" | "recuperar_valor" | "encerrar" | "monitorar";

export type SyncSourceStatus = "ativo" | "pausado" | "falha" | "mockado";
export interface SyncSource {
  id: UUID;
  name: string;
  status: SyncSourceStatus;
  lastRunAt: string;
  linkedProcesses: number;
  importedMovements: number;
  successRate: number; // 0-100
}

export type MovementType =
  | "Audiência designada" | "Sentença publicada" | "Prazo aberto" | "Contestação juntada"
  | "Réplica apresentada" | "Perícia designada" | "Decisão interlocutória" | "Recurso interposto"
  | "Acordo homologado" | "Arquivamento" | "Cumprimento de sentença";
export type MovementImpact =
  | "Recalcular risco" | "Atualizar probabilidade de acordo" | "Atualizar valor projetado"
  | "Criar prazo na Agenda Geral" | "Solicitar validação humana" | "Gerar sugestão de peça"
  | "Sem impacto relevante";
export type MovementAnalysisStatus = "novo" | "reprocessado" | "validado" | "ignorado";

export interface ProcessMovement {
  id: UUID;
  processNumber: string;
  companyId: UUID;
  sourceId: UUID;
  sourceName: string;
  date: string;
  type: MovementType;
  summary: string;
  impact: MovementImpact;
  status: MovementAnalysisStatus;
  riskBefore: number;
  riskAfter: number;
  valueBefore: number;
  valueAfter: number;
  confidence: number;
  reason: string;
  responsible: string;
}

export type DraftPole = ClientPole;
export type DraftArea = "Trabalhista" | "Cível" | "Tributário" | "Administrativo";
export type DraftStatus = "rascunho" | "em_revisao" | "aprovada" | "rejeitada" | "vinculada" | "arquivada";
export interface LegalDraft {
  id: UUID;
  type: string;              // ex: "Petição inicial trabalhista"
  area: DraftArea;
  pole: DraftPole;
  clientName: string;
  counterparty: string;
  processNumber?: string;
  court: string;
  uf: string;
  summary: string;
  objective: string;
  urgency: RiskLevel;
  responsible: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  content: string;
  totalValue: number;
  linkedProcessId?: UUID;
  companyId: UUID;
}

export type AgendaArea = "juridico" | "tributario" | "executivo" | "operacional";
export type AgendaEventType =
  | "audiencia" | "prazo_contestacao" | "prazo_replica" | "prazo_recurso"
  | "prazo_manifestacao" | "prazo_documentos" | "pericia" | "reuniao"
  | "revisao_minuta" | "validacao_ia" | "vencimento_tributario"
  | "validacao_oportunidade" | "revisar_contingencia" | "validar_cruzamento" | "gerar_relatorio";
export type AgendaStatus = "pendente" | "em_andamento" | "concluido" | "atrasado" | "reagendado";
export type AgendaOrigin =
  | "motor_atualizador" | "manual" | "sugestao_ia" | "gera_minutas"
  | "malha_fiscal" | "validacao_humana" | "decision_engine";
export interface AgendaEvent {
  id: UUID;
  title: string;
  area: AgendaArea;
  type: AgendaEventType;
  relatedRef: string;
  clientName: string;
  companyId: UUID;
  date: string;
  time: string;
  responsible: string;
  priority: RiskLevel;
  status: AgendaStatus;
  origin: AgendaOrigin;
  atRisk: boolean;
  suggestedAction: string;
}

export type WorkQueueKind =
  | "validacao_humana" | "sugestao_ia" | "prazo_critico" | "movimentacao_nova"
  | "minuta_revisao" | "cruzamento_pendente" | "oportunidade_tributaria"
  | "contingencia_sem_acao" | "dados_incompletos" | "baixa_confianca"
  | "relatorio_pendente" | "tarefa_decision";
export type WorkQueueStatus = "aberta" | "em_andamento" | "concluida" | "delegada";
export interface WorkQueueItem {
  id: UUID;
  title: string;
  kind: WorkQueueKind;
  area: "juridico" | "tributario" | "executivo";
  priority: RiskLevel;
  responsible: string | null;
  origin: AgendaOrigin;
  status: WorkQueueStatus;
  createdAt: string;
  dueDate: string;
  companyId: UUID;
  detail: string;
}


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
export type RadarArea = "Trabalhista" | "Tributário" | "Reforma Tributária" | "Compliance" | "Jurisprudência" | "Regulatório";
export type RadarStatus = "novo" | "lido" | "analisado" | "em_revisao" | "acao_criada" | "enviado_validacao";

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
  // Novos campos editoriais (opcionais)
  tags?: string[];
  content?: string;
  author?: string;
  readingMinutes?: number;
  impactScore?: number;
  potentialValue?: number;
  confidence?: number;
  urgency?: RiskLevel;
  recommendations?: string[];
  validationPoints?: string[];
  gradient?: string;
  favorite?: boolean;
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
