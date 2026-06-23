# Destrava — Arquitetura (mobile-first, segura e escalável)

> Fase 2 do roadmap. Decisão de stack e guia de configuração.

## Objetivo
App distribuído via **Play Store e App Store**, com **segurança total dos dados**
(LGPD) e escala de centenas a **milhões** de usuários — agentes culturais e, no
horizonte, pequenos empreendedores em geral.

## Decisões e justificativa

| Camada | Escolha | Por quê |
|--------|---------|---------|
| App nas lojas | **Capacitor** | Empacota a base React/Vite atual como app nativo iOS/Android reaproveitando ~todo o código; mantém web/PWA. Evita rewrite em React Native. |
| Auth + Banco | **Supabase** (Postgres gerenciado + Auth) | E-mail/senha **e** Google OAuth com **PKCE + refresh tokens** (padrão de apps nativos); **Row-Level Security** isola dados por usuário no banco; escala gerenciada. |
| Proxy de IA | **Supabase Edge Function** (`gemini`) | Mantém a `GEMINI_API_KEY` no servidor; exige usuário autenticado; rate limiting por usuário; prompts blindados contra injection. |
| Estado de dados | Postgres com RLS (migração faseada do `localStorage`) | Dados financeiros/fiscais saem do dispositivo para um banco seguro e sincronizável entre web e mobile. |

### Por que não cookies HTTP-only?
Apps nativos não lidam bem com cookies cross-origin (ITP no WKWebView do iOS). O
padrão é **token bearer** (access JWT curto + refresh token) guardado em storage
seguro do dispositivo. O Supabase já implementa esse fluxo (incl. PKCE), então o
app nunca manuseia a chave de IA nem segredos de OAuth.

## Modelo de segurança
- **RLS em todas as tabelas de domínio**: cada linha é acessível só pelo dono
  (`auth.uid() = user_id`). Mesmo com o app comprometido, dados de terceiros
  ficam inacessíveis.
- **Segredos só no servidor**: `GEMINI_API_KEY` e o Client Secret do Google
  vivem no Supabase, nunca no bundle.
- **Rate limiting**: `ai_usage` + função `increment_ai_usage` limitam chamadas
  de IA por usuário/dia (default 50, via `AI_DAILY_LIMIT`).
- **Prompt injection**: dados do usuário vão em bloco `<DADOS>...</DADOS>` com
  instrução de tratá-los como dados, não comandos.

## Escala
Supabase (Postgres + PgBouncer) e Edge Functions escalam horizontalmente para a
faixa de milhões; índices por `user_id` já criados. Próximos passos de escala:
connection pooling dedicado, leitura em réplicas e cache quando necessário.

## Estrutura adicionada
```
contexts/AuthContext.tsx        Sessão, login e-mail/senha + Google, signOut
services/supabaseClient.ts      Cliente único (PKCE, refresh automático)
services/aiClient.ts            Chama a Edge Function (token anexado)
services/geminiService.ts       Compat: delega para aiClient
supabase/functions/gemini/      Edge Function (proxy seguro do Gemini)
supabase/migrations/0001_init.sql  Schema + RLS + rate limiting
capacitor.config.ts             Empacotamento para as lojas
```

## Setup (uma vez)
1. **Criar projeto** no Supabase. Copiar URL e anon key para `.env.local`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. **Migração**: `supabase db push` (ou colar `0001_init.sql` no SQL Editor).
3. **Edge Function**: `supabase functions deploy gemini` e
   `supabase secrets set GEMINI_API_KEY=...`.
4. **Google OAuth**: criar credenciais no Google Cloud; em Authentication →
   Providers → Google, colar Client ID/Secret; cadastrar redirect URLs
   (web: origem do site; nativo: `br.com.destrava.app://auth-callback`).
5. **Rodar**: `npm install && npm run dev`.

## Caminho para as lojas (store-prep)
```
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/app @capacitor/browser
npx cap add ios && npx cap add android
npm run build && npx cap sync
npx cap open ios   # Xcode → assinar e publicar
npx cap open android  # Android Studio → assinar e publicar
```
No nativo, ajustar o `redirectTo` do `signInWithGoogle` para o deep link e
registrar o esquema `br.com.destrava.app` em iOS/Android.

## Pendências (próximos incrementos)
- [ ] Migrar leitura/escrita de dados do `localStorage` para as tabelas do
      Supabase (camada de repositório), mantendo cache offline.
- [ ] Adicionar deps do Capacitor e scaffolds nativos.
- [ ] Storage seguro nativo (Keychain/Keystore) para a sessão em vez do default.
- [ ] Tela de recuperação de senha e verificação de e-mail no fluxo.
