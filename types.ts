
export interface FinancialMonth {
  month: string;
  forecast: {
    inflow: number;
    outflow: number;
    balance: number;
  };
  realized: {
    inflow: number;
    outflow: number;
    balance: number;
  };
  details: {
    category: string;
    amount: number;
    type: 'inflow' | 'outflow';
  }[];
}

export interface FinancialInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
  actionItem?: string;
}

export interface AppState {
  data: FinancialMonth[] | null;
  insights: FinancialInsight[];
  isLoading: boolean;
  error: string | null;
}

export type ProjectStage = 'Pré-Produção' | 'Produção' | 'Pós-Produção' | 'Administrativo/Gestão' | 'Outros';
export type ExpenseNature = 'Cachê' | 'Serviço (PF/PJ)' | 'Material de Consumo' | 'Bens Duráveis/Equipamentos' | 'Logística/Transporte' | 'Impostos/Taxas';

export interface BudgetLineItem {
  id: string;
  activity: string; 
  expenseItem: string; 
  stage: ProjectStage; 
  nature: ExpenseNature; 
  plannedAmount: number;
}

export type BankName = 'Banco do Brasil' | 'Bradesco' | 'Caixa' | 'Itaú' | 'Nubank' | 'Santander' | 'Inter' | 'XP' | 'BTG' | 'Outros';

export interface BankAccount {
  id: string;
  name: string; 
  bank: BankName;
  entityType: 'PF' | 'PJ';
}

export interface Cnae {
  code: string;
  description: string;
}

export interface BusinessProfile {
  cnpj: string;
  companyName: string;
  regime: 'MEI' | 'ME';
  mainCnae?: Cnae;
  secondaryCnaes: Cnae[];
  lastPayrollTotal?: number; 
}

export interface SimulatedInvoice {
  id: string;
  date: string;
  customerName: string;
  customerDoc: string;
  serviceDescription: string;
  amount: number;
  taxTotal: number;
  netValue: number;
  cnae: string;
  status: 'draft' | 'issued';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
  project?: string;
  projectId?: string;
  date: string;
  month: string;
  entity: 'PF' | 'PJ';
  supplierDoc?: string;
  paymentDoc?: string;
  isRecurring?: boolean;
  relatedId?: string;
  budgetLineId?: string;
  projectStage?: ProjectStage;
  projectNature?: ExpenseNature;
  accountId?: string;
  status?: 'REALIZED' | 'PLANNED'; // ausência = REALIZED (retrocompatível)
  recurringId?: string;            // regra recorrente que originou o lançamento
}

/**
 * Regra de lançamento recorrente (ex.: aluguel, assinatura, pró-labore).
 * O motor de projeção expande a regra em lançamentos PLANNED virtuais —
 * nunca persistidos — para visualização e cálculo do saldo projetado.
 */
export interface RecurringRule {
  id: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
  entity: 'PF' | 'PJ';
  dayOfMonth: number;      // 1–31, ajustado ao fim do mês quando necessário
  startMonth?: string;     // 'YYYY-MM' — início da vigência (padrão: mês atual)
  monthsAhead?: number;    // horizonte da regra em meses (padrão 12)
  accountId?: string;
}

/** Meta de orçamento mensal por categoria (previsto × realizado). */
export interface MonthlyBudget {
  id: string;              // determinístico: bud_{pf|pj}_{YYYY-MM}_{categoria}
  month: string;           // 'YYYY-MM'
  category: string;
  plannedAmount: number;
  entity: 'PF' | 'PJ';
}

export interface ProjectMetadata {
  id: string;
  name: string;
  legislation: string;
  budget: number; 
  startDate: string;
  endDate?: string;
  origin: 'manual' | 'mapa_cultural';
  mapaCulturalId?: string;
  proponentDoc?: string; 
  budgetLines?: BudgetLineItem[]; 
}
