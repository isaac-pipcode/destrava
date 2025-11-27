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

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
  project?: string; 
  date: string; // ISO date string
  month: string; // e.g. "Julho"
  entity: 'PF' | 'PJ'; // New field: Pessoa Física or Pessoa Jurídica
  supplierDoc?: string; // CPF or CNPJ of the supplier (Mandatory for gov grants)
  paymentDoc?: string; // Check number, Transaction ID, Pix ID
}