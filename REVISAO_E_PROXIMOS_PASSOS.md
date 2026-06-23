# Destrava Cultura — Revisão de Código, Segurança e Próximos Passos

> Data: 2026-06-12 · Escopo: revisão completa do codebase (React 19 + TypeScript + Vite + Google Gemini)

## 1. Visão geral

O Destrava Cultura é um SPA de gestão financeira/fiscal para produtores culturais, com importação de extratos via IA (Gemini), simulação de impostos (Simples Nacional / Fator R), notas fiscais simuladas, prestação de contas e relatórios. Hoje é 100% frontend: sem backend, autenticação simulada e persistência em `localStorage`.

**Diagnóstico geral:** o produto tem escopo funcional rico e bem pensado, mas a arquitetura atual (chave de API no bundle, login fake, dados sensíveis no navegador) é adequada apenas para protótipo/demo. Antes de qualquer uso com dados reais de clientes, é necessário introduzir um backend mínimo.

---

## 2. Revisão de segurança

| # | Severidade | Achado | Local |
|---|------------|--------|-------|
| 1 | **Crítica** | Chave da API Gemini injetada no bundle JS (`process.env.API_KEY` via `define`) — extraível por qualquer visitante | `vite.config.ts:11` |
| 2 | **Alta** | Componentes instanciam `GoogleGenAI` diretamente no cliente com a chave | `TaxManager.tsx:89`, `BrandingTool.tsx:53` |
| 3 | **Alta** | Prompt injection: CSV e textos do usuário interpolados direto nos prompts do LLM, sem delimitação/sanitização | `services/geminiService.ts:39-50, 119-123` |
| 4 | **Média** | Dados sensíveis (transações, CNPJ/CPF, dados bancários, notas fiscais) em `localStorage` sem criptografia | `App.tsx:37-84` |
| 5 | **Média** | Autenticação simulada — qualquer clique faz login; senha digitada é ignorada | `Login.tsx:16-24` |
| 6 | **Média** | `console.error` com objetos de erro brutos pode vazar dados/prompt em produção | `geminiService.ts:102,150`, `TaxManager.tsx:99`, `BrandingTool.tsx:71` |
| 7 | **Baixa** | Ausência de Content Security Policy e demais security headers | `index.html` |
| 8 | **Baixa** | Dependências carregadas via CDN (importmap) sem hash de integridade — risco de supply chain/MITM | `index.html:72-84` |
| 9 | **Baixa** | `.env.example` vazio, sem documentar variáveis necessárias | `.env.example` |
| 10 | **Baixa** | Inputs de formulário sem validação de formato/tamanho (CNPJ, valores etc.) | `TaxManager.tsx:137-146`, `ManualManager.tsx` |

**Ação emergencial:** mover as chamadas ao Gemini para um backend (função serverless basta) e revogar/rotacionar a chave atual, que deve ser considerada comprometida se já houve deploy público.

---

## 3. Revisão de qualidade e correção

### Bugs de runtime (prioritários)
- **`App.tsx:115-116`** — `onDeleteTransaction` não é passado ao `ManualManager`; excluir transação falha.
- **`BrandingTool.tsx:64`** — acesso a `response.candidates[0]` sem verificar se o array existe; resposta vazia da API causa crash.
- **`geminiService.ts:85-104`** — `response.text` pode ser `null`/`undefined`; `.trim()` quebra ("Cannot read property 'trim' of null").
- **`TaxManager.tsx:54`** — `find()` sobre `transactions` pode retornar `undefined` e deixar o estado inconsistente.
- **`Accountability.tsx:47`** — `activeProjectData` usado sem null-guard.

### Lógica de negócio
- **`DashboardHome.tsx:21`** — cálculo de runway conta meses de todas as entidades, sem filtrar PF/PJ.
- **`TaxManager.tsx:63-69`** — Fator R calcula receita anual sem filtrar por ano; com dados de múltiplos anos a alíquota sai errada.
- **`Accountability.tsx:67`** — orçamento total ignora rubricas realizadas.

### Arquitetura e estado
- **Prop drilling severo** em `App.tsx` (15+ props descendo a árvore). Candidato a Context API ou Zustand.
- **6 `useEffect` de sincronização com localStorage** em `App.tsx:79-84` — consolidar num hook `usePersistedState`, com versionamento de esquema e validação no parse.
- **Tema duplicado** (`themeColor`/`themeText`/etc.) entre `ManualManager.tsx` e `DashboardHome.tsx` — extrair para helper/hook.
- **`ManualManager.tsx:87-91`** — ao alternar contexto PF↔PJ, `selectedAccountId` pode apontar para conta do contexto anterior ou ficar órfão se as contas forem excluídas.

### Build e configuração
- **`package.json`** — `@vitejs/plugin-react` e `vite` declarados duas vezes com versões conflitantes (deps vs devDeps). Manter apenas em `devDependencies` com uma versão única.
- **`vite.config.ts:6`** — cast `(process as any)` desnecessário; usar `process.cwd()` com `@types/node`.

---

## 4. Insights de produto

1. **O diferencial é a camada de IA** (importação de extratos, insights de mentor, expansão de descrição fiscal) — mas é justamente ela que hoje expõe a chave. Levar para o backend protege o diferencial e habilita cache/limites de custo.
2. **Dados fiscais brasileiros são sensíveis (LGPD).** CNPJ, movimentações e notas fiscais no `localStorage` criam responsabilidade legal assim que houver usuário real. Persistência no servidor com autenticação é pré-requisito de lançamento.
3. **A lógica tributária (Fator R, Simples Nacional)** é o coração do valor e está sem testes. Erros aqui geram prejuízo direto ao usuário — é o primeiro lugar para cobertura de testes unitários.
4. **A nota fiscal é "simulada".** Integração futura com emissores reais (e-NotasGO, FocusNFe, prefeituras) é a evolução natural e exigirá o backend de qualquer forma.

---

## 5. Próximos passos sugeridos

### Fase 1 — Correções imediatas (1–2 dias) ✅ aplicada
- [ ] Rotacionar a chave Gemini (ação manual do mantenedor — a chave atual deve ser considerada exposta). O `define` foi mantido com aviso explícito até existir backend (Fase 2).
- [x] Corrigir duplicações no `package.json` (`vite`, `@vitejs/plugin-react`).
- [x] Adicionar null-check em `BrandingTool.tsx` (resposta da IA sem candidates). Obs.: `geminiService.ts`, `Accountability.tsx` e `TaxManager.tsx` já possuíam guards — achados eram falsos positivos.
- [x] Implementar `onDeleteTransaction` em `App.tsx` (passado a `ManualManager` PF/PJ e `Accountability`).
- [x] Documentar `.env.example`.
- [x] Remover cast `(process as any)` em `vite.config.ts`.

### Fase 2 — Backend, auth e IA segura ✅ fundação aplicada
Stack escolhida (mobile-first, ver `ARQUITETURA_MOBILE.md`): **Capacitor** (lojas) + **Supabase** (Postgres/Auth/RLS) + **Edge Function** (proxy Gemini). Auth por token (PKCE/refresh), não cookies, por ser app nativo.
- [x] Proxy de IA centralizando os 3 pontos de uso (`geminiService`, `TaxManager`, `BrandingTool`) na Edge Function `gemini`; chave fora do bundle.
- [x] Rate limiting por usuário/dia e delimitação anti-injection dos dados nos prompts.
- [x] Autenticação real e-mail/senha + Google OAuth (Supabase Auth); login falso removido.
- [x] Isolamento de dados por usuário via RLS (schema `0001_init.sql`).
- [ ] **Provisionamento (ação do mantenedor):** criar projeto Supabase, rodar migração, deploy da função + secrets, configurar Google OAuth.
- [ ] Migrar dados do `localStorage` para as tabelas do Supabase (próximo incremento).

### Fase 3 — Robustez (2–4 semanas)
- [ ] Migrar persistência de `localStorage` para banco no servidor (manter localStorage só como cache/offline).
- [ ] Hook `usePersistedState` com versionamento de esquema enquanto a migração não acontece.
- [ ] Refatorar estado global (Context/Zustand) para eliminar prop drilling.
- [ ] Testes unitários da lógica tributária (Fator R, anexos do Simples) e dos cálculos de runway/orçamento — corrigindo os filtros por entidade e por ano.
- [ ] Sair do importmap/CDN: bundlar dependências via npm no build.
- [ ] CSP e security headers no hosting.

### Fase 4 — Produto (médio prazo)
- [ ] Integração com emissor de NFS-e real.
- [ ] Exportação contábil (relatórios para contador, OFX/CSV).
- [ ] Telemetria de erros (Sentry) com sanitização, substituindo `console.error`.
