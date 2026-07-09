<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Destrava — Gestão Cultural Inteligente

App de gestão financeira e fiscal para trabalhadores da cultura: fluxo de caixa
preditivo (recorrências, projeção de fôlego/runway e orçamento por metas),
importação de extratos CSV com leitura local + refino por IA, simulação de
impostos (Simples/Fator R), notas fiscais e prestação de contas de editais.
React + Vite, com backend, auth e IA no Supabase.

## Rodar localmente

**Pré-requisitos:** Node.js e um projeto no Supabase.

1. Instale as dependências:
   `npm install`
2. Crie `.env.local` a partir de `.env.example` e preencha `VITE_SUPABASE_URL`
   e `VITE_SUPABASE_ANON_KEY`.
3. Configure o backend (migração, Edge Function e Google OAuth) seguindo
   **[ARQUITETURA_MOBILE.md](./ARQUITETURA_MOBILE.md)**.
4. Rode o app:
   `npm run dev`
5. Testes e typecheck:
   `npm test` · `npm run typecheck`

## Arquitetura

Mobile-first (iOS/Android via Capacitor) + web/PWA, com autenticação real
(e-mail/senha e Google OAuth), dados isolados por usuário via Row-Level Security
e chamadas de IA atrás de uma Edge Function que guarda a chave do Gemini.
Detalhes e passos de publicação nas lojas em
**[ARQUITETURA_MOBILE.md](./ARQUITETURA_MOBILE.md)**.

## Documentos
- [REVISAO_E_PROXIMOS_PASSOS.md](./REVISAO_E_PROXIMOS_PASSOS.md) — revisão e roadmap
- [DESIGN_REBRAND_PROMPT.md](./DESIGN_REBRAND_PROMPT.md) — análise de design e rebrand
- [ARQUITETURA_MOBILE.md](./ARQUITETURA_MOBILE.md) — arquitetura e setup
