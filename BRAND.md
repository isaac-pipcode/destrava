# Destrava — Identidade da Marca (rebrand 2026)

Sistema de design aplicado ao app. Tokens em `styles/theme.css`, mapeados para
utilitários Tailwind em `tailwind.config.js`. Fontes empacotadas localmente (sem
CDN), coerente com a soberania tecnológica.

## Símbolo
Cadeado se abrindo com o arco em **âmbar** saltando para cima e um **cifrão ($)**
no corpo em **teal** — "destravar o dinheiro e prosperar". Componente: `components/Logo.tsx`.

## Tipografia
- **Bricolage Grotesque** — display/títulos (`font-display`)
- **IBM Plex Sans** — corpo e dados (`font-sans`)
- **IBM Plex Mono** — numerais tabulares de valores R$ (`font-mono tabular-nums`)

Fontes via `@fontsource` (npm), importadas em `index.tsx`.

## Paleta (tokens) — claro / escuro
| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `primary` | `#0E6E6A` | `#3FB3AD` | teal/petrol — confiança de contador |
| `secondary` | `#B14A2C` | `#E08158` | terracota — alma cultural |
| `accent` | `#E2864D` | `#ECA46A` | âmbar — destaque |
| `success` | `#1F7A5C` | `#46B98C` | positivo |
| `warning` | `#B9750F` | `#E0A33A` | atenção |
| `error` | `#C0392B` | `#E5705D` | erro |
| `info` | `#2E6F9E` | `#6FA8CE` | informação |
| `bg` / `surface` | `#FAF7F1` / `#FFFFFF` | `#0E1716` / `#16201F` | fundo / cartões |
| `ink` / `muted` / `subtle` | `#222829` / `#5D6566` / `#949A99` | claros equivalentes | texto |

Cada token tem variante `-soft` para fundos translúcidos e `-on`/`-hover` onde
aplicável. Deliberadamente fora do azul/verde/laranja do gov.br.

## Como usar
- Cores: `bg-primary`, `text-ink`, `border-line`, `bg-success-soft`, etc. — já
  trocam com o tema (classe `.dark` no `<html>`).
- Sombras: `shadow-brand-sm`, `shadow-brand-md`.
- Raios: `rounded-xl` (14px), `rounded-2xl` (20px), `rounded-3xl` (24px).
- Para alterar uma cor em todo o app, edite o token em `styles/theme.css`.

## Aplicado nesta etapa
Logo, tokens (claro/escuro), tipografia, e redesign de Login, Header,
DashboardHome (hero) e KPICards. Classes legadas `govblue/govgreen/govorange`
foram remapeadas para a nova paleta, então os demais componentes já adotam a
marca; o polimento fino de cada tela é incremental.

## Pacote-fonte
O pacote completo do Claude Design (guia de marca + telas, claro/escuro) foi
entregue à parte (HTML autossuficiente). Não versionado no repo por peso (~14 MB);
guardar no drive do projeto.
