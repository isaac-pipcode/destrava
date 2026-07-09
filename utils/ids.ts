/**
 * IDs determinísticos para upsert.
 *
 * Entidades "endereçáveis" (meta de orçamento de uma categoria num mês, previsto
 * de uma regra num mês) recebem um id derivado da própria chave natural. Salvar
 * duas vezes sobrescreve em vez de duplicar — e a futura sincronização com o
 * Supabase pode usar upsert por id sem reconciliação.
 */

export const slugify = (s: string): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Id de meta de orçamento: bud_pj_2026-07_transporte-logistica */
export const budgetId = (entity: 'PF' | 'PJ', month: string, category: string): string =>
  `bud_${entity.toLowerCase()}_${month}_${slugify(category)}`;

/** Id de lançamento previsto (virtual) de uma regra num mês. */
export const plannedId = (ruleId: string, month: string): string =>
  `plan_${ruleId}_${month}`;
