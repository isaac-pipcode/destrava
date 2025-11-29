
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
  activity: string; // Ex: Desenvolvimento do projeto
  expenseItem: string; // Ex: Roteiro
  stage: ProjectStage; // Ex: Pré-Produção
  nature: ExpenseNature; // Ex: Cachê
  plannedAmount: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
  project?: string; 
  date: string; // ISO date string
  month: string; // e.g. "Julho"
  entity: 'PF' | 'PJ'; // Pessoa Física or Pessoa Jurídica
  supplierDoc?: string; // CPF or CNPJ of the supplier
  paymentDoc?: string; // Check number, Transaction ID
  isRecurring?: boolean; // If generated automatically
  relatedId?: string; // ID to link recurring series
  
  // New fields for LPG Accountability
  budgetLineId?: string; // Link to specific budget line
  projectStage?: ProjectStage;
  projectNature?: ExpenseNature;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  legislation: string;
  budget: number; // Valor Aprovado Total
  startDate: string;
  endDate?: string;
  origin: 'manual' | 'mapa_cultural';
  mapaCulturalId?: string;
  budgetLines?: BudgetLineItem[]; // Detailed budget
}
