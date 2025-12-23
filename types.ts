
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
  lastPayrollTotal?: number; // Para cálculo de Fator R (ME)
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
