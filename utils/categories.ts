/** Categorias padrão do Diário, compartilhadas entre telas e pelo categorizador local. */

export const PJ_CATEGORIES_IN = ['Cachê Artístico/Serviço', 'Edital/Lei de Incentivo', 'Venda de Obras/Ingressos', 'Aporte de Sócio', 'Outros'];
export const PJ_CATEGORIES_OUT = ['Produção/Material', 'Equipamentos/Software', 'Impostos (MEI/Simples)', 'Contabilidade/Jurídico', 'Aluguel de Espaço/Sede', 'Marketing/Divulgação', 'Pró-labore/Distribuição Lucro', 'Transporte/Logística', 'Taxas Bancárias', 'Outros'];
export const PF_CATEGORIES_IN = ['Pró-labore/Retirada da PJ', 'Cachê (Pessoa Física)', 'Salário/Emprego CLT', 'Rendimentos/Investimentos', 'Presentes/Doações Recebidas', 'Reembolsos', 'Outros'];
export const PF_CATEGORIES_OUT = ['Habitação (Aluguel/Condomínio)', 'Alimentação/Mercado', 'Saúde/Farmácia', 'Transporte/Combustível', 'Educação/Cursos', 'Lazer/Cultura', 'Família/Filhos', 'Assinaturas/Serviços (Net/Luz)', 'Vestuário/Cuidados Pessoais', 'Doações/Apoios', 'Investimentos/Poupança', 'Outros'];

export const categoriesFor = (entity: 'PF' | 'PJ', type: 'inflow' | 'outflow'): string[] =>
  entity === 'PF'
    ? (type === 'inflow' ? PF_CATEGORIES_IN : PF_CATEGORIES_OUT)
    : (type === 'inflow' ? PJ_CATEGORIES_IN : PJ_CATEGORIES_OUT);

/**
 * Categorização local determinística por palavras-chave (fallback da IA).
 * Cobre os padrões mais comuns de extratos brasileiros; o que não casar cai
 * em "Outros" e pode ser refinado pela IA ou manualmente.
 */
const KEYWORD_RULES: Array<{ match: RegExp; pf: string; pj: string; type?: 'inflow' | 'outflow' }> = [
  { match: /uber|99 ?(app|pop)|taxi|combust|posto|estacionamento|pedagio|metro|onibus|passagem/i, pf: 'Transporte/Combustível', pj: 'Transporte/Logística' },
  { match: /ifood|restaurante|lanche|padaria|mercado|supermerc|acougue|hortifruti/i, pf: 'Alimentação/Mercado', pj: 'Produção/Material' },
  { match: /aluguel|condominio|imobiliaria/i, pf: 'Habitação (Aluguel/Condomínio)', pj: 'Aluguel de Espaço/Sede' },
  { match: /farmacia|drogaria|hospital|clinica|plano de saude|unimed|hapvida/i, pf: 'Saúde/Farmácia', pj: 'Outros' },
  { match: /netflix|spotify|prime|disney|hbo|max|globoplay|deezer|youtube|claro|vivo|tim |oi |internet|energia|enel|cemig|copel|light|sabesp|saneamento/i, pf: 'Assinaturas/Serviços (Net/Luz)', pj: 'Equipamentos/Software' },
  { match: /adobe|canva|figma|google (one|workspace)|microsoft|dominio|hospedagem|software|licenca/i, pf: 'Assinaturas/Serviços (Net/Luz)', pj: 'Equipamentos/Software' },
  { match: /das\b|dasn|simples nacional|darf|inss|iss\b|imposto|tributo|receita federal/i, pf: 'Outros', pj: 'Impostos (MEI/Simples)' },
  { match: /contab|contador|advogad|juridic|cartorio/i, pf: 'Outros', pj: 'Contabilidade/Jurídico' },
  { match: /tarifa|iof\b|anuidade|juros|encargos|cesta de servicos|manutencao de conta/i, pf: 'Outros', pj: 'Taxas Bancárias' },
  { match: /trafego pago|meta ads|google ads|impulsion|marketing|divulga|grafica|panfleto/i, pf: 'Outros', pj: 'Marketing/Divulgação' },
  { match: /curso|faculdade|mensalidade escolar|udemy|alura|workshop|oficina/i, pf: 'Educação/Cursos', pj: 'Outros' },
  { match: /cinema|teatro|show|ingresso|sympla|eventim/i, pf: 'Lazer/Cultura', pj: 'Produção/Material' },
  { match: /cache|cachê|apresentacao|show|espetaculo/i, pf: 'Cachê (Pessoa Física)', pj: 'Cachê Artístico/Serviço', type: 'inflow' },
  { match: /edital|lei paulo gustavo|aldir blanc|proac|funarte|lei de incentivo|premio|fomento/i, pf: 'Outros', pj: 'Edital/Lei de Incentivo', type: 'inflow' },
  { match: /pro-?labore|prolabore|retirada/i, pf: 'Pró-labore/Retirada da PJ', pj: 'Pró-labore/Distribuição Lucro' },
  { match: /salario|folha de pagamento|remuneracao/i, pf: 'Salário/Emprego CLT', pj: 'Outros', type: 'inflow' },
  { match: /rendimento|dividendo|cdb|tesouro|poupanca|resgate rdb/i, pf: 'Rendimentos/Investimentos', pj: 'Outros', type: 'inflow' },
  { match: /aplicacao|invest/i, pf: 'Investimentos/Poupança', pj: 'Outros', type: 'outflow' },
];

const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function guessCategory(
  description: string,
  type: 'inflow' | 'outflow',
  entity: 'PF' | 'PJ'
): string {
  const text = stripAccents(description || '');
  for (const rule of KEYWORD_RULES) {
    if (rule.type && rule.type !== type) continue;
    if (rule.match.test(text)) return entity === 'PF' ? rule.pf : rule.pj;
  }
  return 'Outros';
}
