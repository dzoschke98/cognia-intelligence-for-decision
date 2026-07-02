/**
 * Mocked data for the "Matriz de Confrontos Fiscais" module.
 * All values are simulated for demo purposes only.
 */
export type TcmStatus =
  | "ok"
  | "divergencia"
  | "oportunidade"
  | "contingencia"
  | "baixa_confianca"
  | "pendente";

export const TCM_STATUS_LABEL: Record<TcmStatus, string> = {
  ok: "OK",
  divergencia: "Divergência",
  oportunidade: "Oportunidade",
  contingencia: "Contingência",
  baixa_confianca: "Baixa confiança",
  pendente: "Pendente",
};

export const TCM_STATUS_COLOR: Record<TcmStatus, string> = {
  ok: "bg-success/15 text-success border-success/30",
  divergencia: "bg-warning/15 text-warning border-warning/30",
  oportunidade: "bg-cyan/15 text-cyan border-cyan/30",
  contingencia: "bg-risk/15 text-risk border-risk/40",
  baixa_confianca: "bg-purple/15 text-purple border-purple/30",
  pendente: "bg-white/10 text-muted-foreground border-white/20",
};

export const tcmSources = [
  "EFD ICMS/IPI",
  "EFD Contribuições",
  "ECD",
  "ECF",
  "XML NF-e",
  "DCTF",
  "DARF",
  "PER/DCOMP",
  "Folha/INSS",
  "Parametrização Fiscal",
] as const;

export const tcmKpis = {
  grossRevenue: 793368822.06,
  purchases: 868929171.27,
  taxesApurados: 12395557.22,
  darfsRecolhidos: 8093384.77,
  opportunities: 36030000,
  exploration: 2010000,
  contingencies: 6010000,
  divergences: 27,
  pendingValidation: 184,
  quality: 91.8,
  effectiveRateCurrent: 1.5,
  effectiveRateAfter: 1.35,
};

export const tcmCompanies = [
  "Kapazi Industrial Ltda",
  "Varejo Nacional S.A.",
  "Indústria Sul Brasil",
  "Consultoria Tributária Alpha",
];

export interface TcmCross {
  id: string;
  row: string;
  col: string;
  status: TcmStatus;
  impact: number;
  description: string;
  competence: string;
  establishment: string;
  company: string;
  expected: number;
  found: number;
  confidence: number;
  recommendation: string;
  owner: string;
}

const mk = (
  id: string, row: string, col: string, status: TcmStatus, impact: number,
  description: string, extras?: Partial<TcmCross>,
): TcmCross => ({
  id, row, col, status, impact, description,
  competence: extras?.competence ?? "06/2026",
  establishment: extras?.establishment ?? "Matriz — SP",
  company: extras?.company ?? tcmCompanies[0],
  expected: extras?.expected ?? impact + Math.round(impact * 0.15),
  found: extras?.found ?? impact,
  confidence: extras?.confidence ?? 82 + Math.floor(Math.random() * 12),
  recommendation: extras?.recommendation ?? "Recomenda-se validar amostra fiscal e classificar a exceção.",
  owner: extras?.owner ?? "Nathan Endrigo",
});

export const tcmMatrix: TcmCross[] = [
  mk("cx-1",  "EFD ICMS/IPI", "XML NF-e", "divergencia", 412500, "CFOP divergente em operações interestaduais."),
  mk("cx-2",  "EFD Contribuições", "XML NF-e", "oportunidade", 610363, "Itens não considerados na apuração de créditos."),
  mk("cx-3",  "ECD", "ECF", "contingencia", 1280000, "Diferença entre saldos contábeis e fiscais."),
  mk("cx-4",  "DCTF", "DARF", "divergencia", 98430, "Valor declarado diferente do valor recolhido."),
  mk("cx-5",  "PER/DCOMP", "DARF", "oportunidade", 347353, "Compensação possível não aproveitada."),
  mk("cx-6",  "EFD ICMS/IPI", "ECD", "ok", 0, "Bases conferem dentro da tolerância."),
  mk("cx-7",  "EFD Contribuições", "DCTF", "divergencia", 214800, "PIS/COFINS declarado maior que apurado."),
  mk("cx-8",  "Folha/INSS", "DCTF", "contingencia", 108478, "Verbas indenizatórias tratadas como remuneração."),
  mk("cx-9",  "XML NF-e", "Parametrização Fiscal", "baixa_confianca", 54200, "NCM/CFOP com regras ambíguas."),
  mk("cx-10", "EFD ICMS/IPI", "Parametrização Fiscal", "oportunidade", 622304, "Insumos elegíveis a crédito não configurados."),
  mk("cx-11", "ECF", "DARF", "divergencia", 176500, "IRPJ apurado × valor pago."),
  mk("cx-12", "ECD", "DCTF", "pendente", 0, "Amostra em análise pelo Tax Engine."),
  mk("cx-13", "EFD Contribuições", "ECD", "oportunidade", 435990, "Exclusão de ST da base não reconhecida."),
  mk("cx-14", "EFD ICMS/IPI", "DARF", "divergencia", 89900, "ICMS-ST recolhido a maior."),
  mk("cx-15", "PER/DCOMP", "ECF", "oportunidade", 1272976, "Subvenção passível de exclusão."),
  mk("cx-16", "Folha/INSS", "PER/DCOMP", "oportunidade", 108478, "Limite de 20 salários mínimos — pedido não formalizado."),
  mk("cx-17", "XML NF-e", "EFD ICMS/IPI", "baixa_confianca", 41691, "Fretes com rateio inconsistente."),
  mk("cx-18", "Parametrização Fiscal", "ECF", "contingencia", 420500, "Crédito indevido de PIS/COFINS."),
  mk("cx-19", "DCTF", "PER/DCOMP", "ok", 0, "Compensações consistentes com declaração."),
  mk("cx-20", "EFD ICMS/IPI", "EFD Contribuições", "divergencia", 156700, "Valor de saídas divergente entre EFDs."),
  mk("cx-21", "ECD", "XML NF-e", "pendente", 0, "Cruzamento aguardando conciliação bancária."),
  mk("cx-22", "ECF", "Parametrização Fiscal", "oportunidade", 8245, "PAT — Programa de Alimentação do Trabalhador."),
  mk("cx-23", "DARF", "ECF", "divergencia", 34014, "IRRF recolhido sem lastro contábil."),
  mk("cx-24", "Folha/INSS", "ECD", "contingencia", 2309361, "Divergência CFOP em transferências internas."),
  mk("cx-25", "EFD Contribuições", "PER/DCOMP", "oportunidade", 33622926, "Insumos/revenda — créditos PIS/COFINS."),
  mk("cx-26", "XML NF-e", "DCTF", "baixa_confianca", 12938, "NF-e canceladas ainda constam em declaração."),
  mk("cx-27", "Parametrização Fiscal", "EFD Contribuições", "ok", 0, "Regras alinhadas com apuração."),
  mk("cx-28", "ECD", "PER/DCOMP", "contingencia", 468759, "Saldo credor não homologado."),
  mk("cx-29", "EFD ICMS/IPI", "DCTF", "divergencia", 74141, "ICMS a recolher declarado a menor."),
  mk("cx-30", "DARF", "Folha/INSS", "oportunidade", 3148171, "Revisão de contribuições patronais."),
];

export interface TcmOpportunity {
  id: string; tribute: string; kind: string; description: string;
  sources: string; competence: string; establishment: string;
  potential: number; validated: number; status:
    | "identificado" | "em_validacao" | "validado" | "rejeitado" | "em_execucao" | "aproveitado";
  confidence: number; owner: string;
}
const opp = (id: string, tribute: string, kind: string, description: string, potential: number, extras?: Partial<TcmOpportunity>): TcmOpportunity => ({
  id, tribute, kind, description,
  sources: extras?.sources ?? "EFD × XML",
  competence: extras?.competence ?? "2020-2026",
  establishment: extras?.establishment ?? "Consolidado",
  potential,
  validated: extras?.validated ?? 0,
  status: extras?.status ?? "identificado",
  confidence: extras?.confidence ?? 78 + Math.floor(Math.random() * 15),
  owner: extras?.owner ?? "Nathan Endrigo",
});
export const tcmOpportunities: TcmOpportunity[] = [
  opp("op-1", "ICMS", "Crédito de insumos", "Créditos identificados em aquisições produtivas.", 1203082.62, { validated: 622304, status: "em_validacao" }),
  opp("op-2", "PIS/COFINS", "Itens fora da EFD-C", "Itens sem crédito computado na apuração.", 610363.22, { status: "em_validacao" }),
  opp("op-3", "IRPJ/CSLL", "Subvenção", "Exclusão de subvenção da base do lucro real.", 1272976.37, { status: "identificado" }),
  opp("op-4", "Previdenciário", "Limite 20 salários", "Restituição de contribuição sobre limite.", 108478.35, { status: "em_validacao", validated: 40000 }),
  opp("op-5", "ICMS", "Fretes", "Créditos sobre fretes de aquisição.", 41691.28, { status: "identificado" }),
  opp("op-6", "ICMS", "CIAP", "Créditos sobre ativo imobilizado.", 7532.30, { status: "validado", validated: 7532.30 }),
  opp("op-7", "ICMS", "Débitos indevidos", "Operações com débitos aplicados indevidamente.", 462581.77, { status: "em_validacao" }),
  opp("op-8", "PIS/COFINS", "Energia elétrica", "Créditos sobre energia consumida na produção.", 694.10, { status: "identificado" }),
  opp("op-9", "PIS/COFINS", "Exclusão ST", "Exclusão do ICMS-ST da base de cálculo.", 435.99, { status: "identificado" }),
  opp("op-10", "PIS/COFINS", "Insumos/revenda", "Créditos sobre insumos e revenda.", 33622926.55, { status: "em_validacao" }),
  opp("op-11", "IPI", "Crédito presumido ZFM", "Créditos presumidos Zona Franca de Manaus.", 68972.74, { status: "identificado" }),
  opp("op-12", "IRPJ/CSLL", "PAT", "Programa de Alimentação do Trabalhador.", 8245.60, { status: "validado", validated: 8245.60 }),
  opp("op-13", "ICMS", "Importado", "Créditos sobre importação com benefícios.", 68972.74, { status: "identificado" }),
  opp("op-14", "PER/DCOMP", "Compensação", "Créditos passíveis de compensação futura.", 347353.58, { status: "em_execucao", validated: 200000 }),
  opp("op-15", "PIS/COFINS", "Fretes", "Fretes na venda de produtos.", 67354.78, { status: "identificado" }),
  opp("op-16", "ICMS", "Uso e consumo", "Análise de uso/consumo × combustíveis.", 1019680.00, { status: "identificado" }),
  opp("op-17", "IRPJ/CSLL", "Ajustes ECF", "Adições/exclusões não realizadas.", 468759.33, { status: "em_validacao" }),
  opp("op-18", "Previdenciário", "Verbas indenizatórias", "Verbas classificadas como remuneração.", 92000, { status: "identificado" }),
  opp("op-19", "IPI", "Bonificação", "Bonificações concedidas — impacto de IPI.", 12500, { status: "identificado" }),
  opp("op-20", "Reforma", "Ajuste de fornecedores", "Base de fornecedores com IBS/CBS.", 750000, { status: "identificado" }),
];

export interface TcmContingency {
  id: string; tribute: string; origin: string; description: string;
  sources: string; exposure: number;
  severity: "baixo" | "medio" | "alto" | "critico";
  probability: "baixa" | "media" | "alta";
  status: "identificada" | "em_analise" | "mitigada" | "aceita";
  recommendation: string; owner: string;
}
export const tcmContingencies: TcmContingency[] = [
  { id: "ct-1", tribute: "ICMS", origin: "EFD × XML", description: "Divergência CFOP em interestaduais.", sources: "EFD ICMS/IPI × XML", exposure: 2309361.88, severity: "alto", probability: "media", status: "em_analise", recommendation: "Revisar CFOP e reclassificar operações.", owner: "Nathan Endrigo" },
  { id: "ct-2", tribute: "ECD × ECF", origin: "Contábil × Fiscal", description: "Divergência de saldo entre bases.", sources: "ECD × ECF", exposure: 1280000, severity: "critico", probability: "alta", status: "identificada", recommendation: "Conciliar contas patrimoniais e resultado.", owner: "Mariana Costa" },
  { id: "ct-3", tribute: "DCTF × DARF", origin: "Declaração × Recolhimento", description: "Recolhimento inferior ao declarado.", sources: "DCTF × DARF", exposure: 98430, severity: "alto", probability: "alta", status: "em_analise", recommendation: "Regularizar recolhimento e retificar declaração.", owner: "Nathan Endrigo" },
  { id: "ct-4", tribute: "PIS/COFINS", origin: "EFD-C × Parametrização", description: "Crédito indevido em revenda isenta.", sources: "EFD-C × Regras", exposure: 420500, severity: "medio", probability: "media", status: "identificada", recommendation: "Estornar crédito e revisar regra.", owner: "Nathan Endrigo" },
  { id: "ct-5", tribute: "ICMS", origin: "Cadastro fiscal", description: "Alíquota interna aplicada em interestadual.", sources: "Parametrização × XML", exposure: 275000, severity: "medio", probability: "alta", status: "em_analise", recommendation: "Ajustar régua de alíquotas por UF.", owner: "Delmer Zoschke" },
  { id: "ct-6", tribute: "Previdenciário", origin: "Folha × DCTF", description: "Verbas indenizatórias sob risco.", sources: "Folha/INSS × DCTF", exposure: 320000, severity: "alto", probability: "media", status: "identificada", recommendation: "Consolidar tese e provisionar contingência.", owner: "Renata Almeida" },
  { id: "ct-7", tribute: "IPI", origin: "Escrituração", description: "Base de cálculo IPI × valor de venda.", sources: "EFD × XML", exposure: 41200, severity: "baixo", probability: "media", status: "aceita", recommendation: "Monitorar recorrência trimestral.", owner: "Nathan Endrigo" },
  { id: "ct-8", tribute: "IRPJ/CSLL", origin: "Adições/exclusões", description: "Adições contábeis não realizadas.", sources: "ECD × ECF", exposure: 890000, severity: "alto", probability: "alta", status: "em_analise", recommendation: "Refazer memória de cálculo do LALUR.", owner: "Mariana Costa" },
  { id: "ct-9", tribute: "ICMS", origin: "Transferência interna", description: "Debito indevido em transferências.", sources: "EFD × XML", exposure: 156000, severity: "medio", probability: "media", status: "identificada", recommendation: "Reclassificar CFOP de transferência.", owner: "Nathan Endrigo" },
  { id: "ct-10", tribute: "PIS/COFINS", origin: "EFD-C", description: "Serviços tributados sem crédito lastreado.", sources: "EFD-C", exposure: 210000, severity: "medio", probability: "alta", status: "em_analise", recommendation: "Documentar comprovação de crédito.", owner: "Nathan Endrigo" },
  { id: "ct-11", tribute: "Reforma", origin: "Simulação", description: "Aumento de carga tributária projetada.", sources: "Simulação IBS/CBS", exposure: 4200000, severity: "alto", probability: "alta", status: "identificada", recommendation: "Rever precificação e mix de fornecedores.", owner: "Mariana Costa" },
  { id: "ct-12", tribute: "ICMS", origin: "Cadastro", description: "NCM incorreto para produto acabado.", sources: "Parametrização × XML", exposure: 88500, severity: "baixo", probability: "media", status: "identificada", recommendation: "Atualizar NCM no cadastro.", owner: "Nathan Endrigo" },
  { id: "ct-13", tribute: "IRPJ/CSLL", origin: "ECF", description: "Subvenção sem controle em reserva de lucros.", sources: "ECD × ECF", exposure: 520000, severity: "alto", probability: "media", status: "em_analise", recommendation: "Criar reserva específica.", owner: "Mariana Costa" },
  { id: "ct-14", tribute: "Previdenciário", origin: "Folha", description: "Prêmios com natureza salarial.", sources: "Folha/INSS", exposure: 96000, severity: "medio", probability: "alta", status: "em_analise", recommendation: "Reclassificar e recolher diferenças.", owner: "Renata Almeida" },
  { id: "ct-15", tribute: "ICMS-ST", origin: "Recolhimento", description: "Base ST recolhida em duplicidade.", sources: "DARF × EFD", exposure: 62000, severity: "medio", probability: "media", status: "identificada", recommendation: "Pleitear restituição via PER/DCOMP.", owner: "Nathan Endrigo" },
];

export interface TcmValidation {
  id: string; kind: "oportunidade" | "contingencia" | "divergencia" | "simulacao";
  tribute: string; description: string; value: number; confidence: number;
  severity: "baixo" | "medio" | "alto" | "critico"; owner: string;
  status: "pendente" | "aprovado" | "corrigido" | "rejeitado" | "especialista";
}
const buildValidations = (): TcmValidation[] => {
  const list: TcmValidation[] = [];
  const kinds: TcmValidation["kind"][] = ["oportunidade", "contingencia", "divergencia", "simulacao"];
  const tribs = ["ICMS", "IPI", "PIS/COFINS", "IRPJ/CSLL", "Previdenciário", "Reforma"];
  const owners = ["Nathan Endrigo", "Mariana Costa", "Renata Almeida", "Delmer Zoschke"];
  const sevs: TcmValidation["severity"][] = ["baixo", "medio", "alto", "critico"];
  for (let i = 0; i < 25; i++) {
    list.push({
      id: `vl-${i + 1}`,
      kind: kinds[i % kinds.length],
      tribute: tribs[i % tribs.length],
      description: `Item ${i + 1} identificado pelo Tax Engine — exige validação humana.`,
      value: 15000 + Math.floor(Math.random() * 900000),
      confidence: 70 + Math.floor(Math.random() * 28),
      severity: sevs[i % sevs.length],
      owner: owners[i % owners.length],
      status: "pendente",
    });
  }
  return list;
};
export const tcmValidations: TcmValidation[] = buildValidations();

export const tcmHistory = [
  { year: "2020", receita: 43777000, compras: 56000000, tributos: 2100000 },
  { year: "2021", receita: 151642000, compras: 160000000, tributos: 3100000 },
  { year: "2022", receita: 154782000, compras: 156000000, tributos: 3300000 },
  { year: "2023", receita: 154133000, compras: 165000000, tributos: 3450000 },
  { year: "2024", receita: 189860000, compras: 190000000, tributos: 3900000 },
  { year: "2025", receita: 99175000, compras: 141000000, tributos: 2800000 },
  { year: "2026", receita: 210000000, compras: 205000000, tributos: 4200000 },
];

export const tcmTributeEvolution = [
  { year: "2020", ICMS: 74141, IPI: 12315, "PIS/COFINS": 5061904, "IRPJ/CSLL": 153176, INSS: 340000, Total: 5641536 },
  { year: "2021", ICMS: 10992, IPI: 4715, "PIS/COFINS": 14479378, "IRPJ/CSLL": 311084, INSS: 610000, Total: 15416169 },
  { year: "2022", ICMS: 12938, IPI: 6639, "PIS/COFINS": 13903401, "IRPJ/CSLL": 342613, INSS: 1040000, Total: 15305591 },
  { year: "2023", ICMS: 515759, IPI: 92079, "PIS/COFINS": 136082, "IRPJ/CSLL": 468759, INSS: 960000, Total: 2172679 },
  { year: "2024", ICMS: 572002, IPI: 246114, "PIS/COFINS": 110644, "IRPJ/CSLL": 0, INSS: 220000, Total: 1148760 },
  { year: "2025", ICMS: 18240, IPI: 0, "PIS/COFINS": 0, "IRPJ/CSLL": 0, INSS: 320000, Total: 338240 },
  { year: "2026", ICMS: 260000, IPI: 45000, "PIS/COFINS": 890000, "IRPJ/CSLL": 220000, INSS: 400000, Total: 1815000 },
];

export const tcmReformScenario = {
  current: { revenue: 793368822.06, purchases: 865833152.96, taxes: 3516954.94, load: 0.44 },
  reform:  { revenue: 800889001.91, purchases: 869085303.58, taxes: 11126943.85, load: 1.40 },
  defaults: { IS: 0, IBS: 18.0, CBS: 8.5, simpleExit: 0, default: 0 },
};

export const tcmRecommendations = [
  { id: "rec-1", tribute: "PIS/COFINS", impact: 33622926.55, urgency: "alto" as const, confidence: 88, action: "Validar oportunidade de PIS/COFINS em insumos.", owner: "Nathan Endrigo" },
  { id: "rec-2", tribute: "ICMS", impact: 412500, urgency: "alto" as const, confidence: 84, action: "Revisar divergência EFD ICMS/IPI × XML NF-e.", owner: "Nathan Endrigo" },
  { id: "rec-3", tribute: "Reforma", impact: 4200000, urgency: "critico" as const, confidence: 79, action: "Gerar simulação da Reforma Tributária para empresa industrial.", owner: "Mariana Costa" },
  { id: "rec-4", tribute: "IRPJ/CSLL", impact: 1280000, urgency: "alto" as const, confidence: 82, action: "Avaliar contingência ECD × ECF.", owner: "Mariana Costa" },
  { id: "rec-5", tribute: "Previdenciário", impact: 108478, urgency: "medio" as const, confidence: 86, action: "Enviar créditos identificados para validação tributária.", owner: "Renata Almeida" },
];

export const tcmByEstablishment = [
  { est: "PINFER MATRIZ — SP", uf: "SP", oport: 1183593.96, explorar: 1025197.47, conting: 3696141.50 },
  { est: "PINFER FILIAL — SC", uf: "SC", oport: 19382.57, explorar: 196.75, conting: 2309361.88 },
  { est: "VAREJO NACIONAL — RJ", uf: "RJ", oport: 640000, explorar: 210000, conting: 480000 },
  { est: "IND. SUL BRASIL — RS", uf: "RS", oport: 720000, explorar: 150000, conting: 320000 },
];
