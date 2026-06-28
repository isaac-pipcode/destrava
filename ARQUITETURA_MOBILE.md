# Destrava — Arquitetura (mobile-first, segura e escalável)

> Fase 2 do roadmap. Decisão de stack e guia de configuração.

## Objetivo
App distribuído via **Play Store** (e, opcionalmente, App Store + PWA), com
**segurança total dos dados** (LGPD), escala de centenas a **milhões** de
usuários e **soberania tecnológica**: sem serviços de Big Tech no produto — nem
Google, nem nuvens hyperscaler, nem labs de IA dos EUA. A IA é um LLM brasileiro.

## Decisões e justificativa

| Camada | Escolha | Por quê |
|--------|---------|---------|
| App nas lojas | **Capacitor** | Empacota a base React/Vite como app nativo reaproveitando ~todo o código; mantém web/PWA. Evita rewrite. |
| Auth + Banco | **Supabase** (OSS, **self-host em nuvem BR/EU**) | E-mail/senha **+ magic link** (sem OAuth de Big Tech); **PKCE + refresh tokens**; **Row-Level Security** isola dados por usuário; OSS e self-hostável. |
| IA | **Maritaca / Sabiá (BR)** via Edge Function `ai` | LLM brasileiro; chave no servidor; rate limiting; prompts blindados contra injection. |
| Estado de dados | Postgres com RLS (migração faseada do `localStorage`) | Dados financeiros/fiscais saem do dispositivo para um banco seguro e sincronizável. |

### Soberania — o que foi removido e por quê
- **Login Google OAuth** → **e-mail/senha + magic link** (Supabase OTP).
- **Google Gemini** → **Maritaca/Sabiá** (LLM brasileiro).
- **Google Fonts / aistudiocdn** → fontes de sistema (bundle de fonte libre como follow-up).
- **Geração de logo por IA** (era Gemini image) → **pausada**: não há modelo de
  imagem soberano fácil; opção futura é Stable Diffusion self-hosted.

### Tensões inerentes (assumidas)
- **Play Store é Google.** Mitigação: app **sem Google Play Services** (sem FCM,
  sem Play Integrity), então a única superfície Google é a distribuição — o que
  permite publicar também em F-Droid/Aptoide/Samsung, APK direto e **PWA**.
- **App Store é Apple.** Se a Apple também for evitada, a rota não-Apple é o PWA
  (limitado no iOS).
- **Push**: FCM/APNs são Big Tech. Alternativa: **UnifiedPush/ntfy** (alcance menor).
- **Runtimes open-source de origem Big Tech** (React/Meta, AOSP, WebView) são
  mantidos: são abertos e inevitáveis; o alvo é eliminar *serviços*, não runtimes.

### Por que não cookies HTTP-only?
Apps nativos não lidam bem com cookies cross-origin (ITP no WKWebView do iOS). O
padrão é **token bearer** (access JWT curto + refresh token). O Supabase já
implementa esse fluxo (incl. PKCE), então o app nunca manuseia segredos.

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
contexts/AuthContext.tsx        Sessão, e-mail/senha + magic link, signOut
services/supabaseClient.ts      Cliente único (PKCE, refresh automático)
services/aiClient.ts            Chama a Edge Function 'ai' (token anexado)
services/geminiService.ts       Compat: delega para aiClient
supabase/functions/ai/          Edge Function (proxy soberano — Maritaca/Sabiá)
supabase/migrations/0001_init.sql  Schema + RLS + rate limiting
capacitor.config.ts             Empacotamento para as lojas
```

## Setup (uma vez)
1. **Supabase** (idealmente self-hosted em nuvem BR/EU). Copiar URL e anon key
   para `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. **Migração**: `supabase db push` (ou colar `0001_init.sql` no SQL Editor).
3. **Edge Function**: `supabase functions deploy ai` e
   `supabase secrets set MARITACA_API_KEY=...`.
4. **Auth**: habilitar "Email" em Authentication → Providers; configurar template
   de magic link e **SMTP próprio**; cadastrar redirect URLs (web: origem;
   nativo: `br.com.destrava.app://auth-callback`).
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
- [ ] **Self-host do Supabase** em nuvem BR/EU (ex.: Magalu Cloud, Hetzner,
      Scaleway) para fechar a soberania de dados — hoje o Supabase Cloud roda em AWS.
- [ ] **Migrar o repositório** para fora do GitHub (Microsoft) se desejado:
      GitLab self-host ou Codeberg/Forgejo.
- [ ] Migrar leitura/escrita de dados do `localStorage` para as tabelas do
      Supabase (camada de repositório), mantendo cache offline.
- [ ] Validar a integração Maritaca/Sabiá ponta a ponta (URL/modelo/headers
      conforme doc vigente) e ajustar prompts para máxima fidelidade do JSON.
- [ ] Geração de imagem soberana (Stable Diffusion self-hosted) para reativar o
      logo por IA.
- [ ] Push via **UnifiedPush/ntfy** em vez de FCM/APNs.
- [ ] Adicionar deps do Capacitor e scaffolds nativos; bundle de fonte libre local.
