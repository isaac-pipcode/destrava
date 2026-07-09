/**
 * Parser determinístico de extratos bancários em CSV (sem IA).
 *
 * Caminho primário de importação: rápido, offline, sem custo de IA e sem risco
 * de alucinação de valores. Detecta separador e colunas automaticamente e cobre
 * os formatos dos bancos mais comuns (Nubank, Itaú, Bradesco, BB, Inter etc.).
 * A IA entra depois, opcionalmente, só para refinar categorias.
 * Portado do núcleo financeiro do Ouver Manager Pro.
 */

export interface ParsedStatementLine {
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // sempre positivo
  type: 'inflow' | 'outflow';
}

export interface StatementParseResult {
  success: boolean;
  transactions: ParsedStatementLine[];
  errors: string[];
}

const MONTH_MAP: Record<string, string> = {
  'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
  'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
};

/** Divide uma linha CSV respeitando valores entre aspas (ex.: "1.250,00"). */
const splitCsvLine = (line: string, separator: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
};

const parseDateResilient = (dateStr: string, fallbackMonth?: string): string | null => {
  if (!dateStr) return null;
  const cleaned = dateStr.trim().toUpperCase().replace(/[./]/g, '/');

  // DD/MM/YYYY ou DD/MM/YY
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    let year = slashMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD (exportações recentes do Nubank, Inter)
  const dashMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dashMatch) return `${dashMatch[1]}-${dashMatch[2].padStart(2, '0')}-${dashMatch[3].padStart(2, '0')}`;

  // DD MMM YYYY (ex.: 21 DEZ 2025)
  for (const [name, num] of Object.entries(MONTH_MAP)) {
    if (cleaned.includes(name)) {
      const dayMatch = cleaned.match(/(\d{1,2})/);
      const yearMatch = cleaned.match(/(\d{4})/) || cleaned.match(/(\d{2})$/);
      if (dayMatch && yearMatch) {
        const day = dayMatch[1].padStart(2, '0');
        let year = yearMatch[1];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${num}-${day}`;
      }
    }
  }

  return fallbackMonth ? `${fallbackMonth}-01` : null;
};

const parseAmountResilient = (val: string): { amount: number; type: 'inflow' | 'outflow' } | null => {
  if (!val) return null;

  let cleaned = val.trim();
  // Convenção brasileira: "-" (ou parênteses) para saídas, sem sinal para entradas
  const isNegative = cleaned.startsWith('-') || cleaned.includes('(');

  cleaned = cleaned
    .replace(/R\$\s*/gi, '')
    .replace(/[()]/g, '')
    .replace(/[^-0-9,.]/g, '');

  if (cleaned.includes(',')) {
    if (cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  }

  const num = Math.abs(parseFloat(cleaned));
  if (isNaN(num) || num === 0) return null;

  return { amount: num, type: isNegative ? 'outflow' : 'inflow' };
};

export const parseBankStatement = (
  csvContent: string,
  fallbackMonth: string = new Date().toISOString().slice(0, 7)
): StatementParseResult => {
  const sanitizedContent = csvContent.replace(/^\uFEFF/, '');
  const lines = sanitizedContent.split(/\r\n|\r|\n/).map(l => l.trim()).filter(l => l.length > 2);

  if (lines.length < 2) {
    return { success: false, transactions: [], errors: ['O arquivo está vazio ou o formato não foi reconhecido.'] };
  }

  const header = lines[0];
  const separator = (header.match(/;/g) || []).length > (header.match(/,/g) || []).length ? ';' : ',';

  const headerCols = splitCsvLine(header, separator).map(c => c.toUpperCase());

  // Detecção de colunas: Nubank usa Data,Valor,Identificador,Descrição
  let dateIdx = headerCols.findIndex(c => c.includes('DATA') || c.includes('DATE'));
  let amountIdx = headerCols.findIndex(c => c.includes('VALOR') || c.includes('VALUE') || c.includes('MONTANTE'));

  // Prioriza DESCRIÇÃO sobre IDENTIFICADOR para evitar códigos no nome
  let descIdx = headerCols.findIndex(c => c.includes('DESC') || c.includes('HIST') || c.includes('LANÇAMENTO') || c.includes('LANCAMENTO'));
  if (descIdx === -1) descIdx = headerCols.findIndex(c => c.includes('IDENTIFICADOR') || c.includes('ID'));

  // Fallbacks seguros
  if (dateIdx === -1) dateIdx = 0;
  if (amountIdx === -1) amountIdx = 1;
  if (descIdx === -1) descIdx = Math.max(2, headerCols.length - 1);

  const transactions: ParsedStatementLine[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], separator);
    if (cols.length <= Math.max(dateIdx, amountIdx)) continue;

    const date = parseDateResilient(cols[dateIdx], fallbackMonth);
    const amountInfo = parseAmountResilient(cols[amountIdx]);

    if (date && amountInfo) {
      transactions.push({
        date,
        amount: amountInfo.amount,
        type: amountInfo.type,
        description: cols[descIdx] || 'Transação importada'
      });
    }
  }

  return {
    success: transactions.length > 0,
    transactions,
    errors: transactions.length === 0
      ? ['Não foi possível extrair dados. Verifique se as colunas Data e Valor estão presentes.']
      : []
  };
};
