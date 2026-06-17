# Notas de Segurança

## Vulnerabilidades conhecidas e adiadas

### esbuild (transitivo via Vite 7.x) — dev-time only

`npm audit` reporta duas vulnerabilidades de severidade alta no pacote
`esbuild`, que entra de forma **transitiva** através do `vite@7.x`
(não é dependência direta deste projeto):

- **GHSA-gv7w-rqvm-qjhr** — verificação de integridade de binário ausente
  no módulo Deno; permite RCE via `NPM_CONFIG_REGISTRY`.
- **GHSA-g7r4-m6w7-qqqr** — leitura arbitrária de arquivos ao rodar o
  dev server no Windows.

**Avaliação:** ambas são **dev-time only** — afetam apenas o servidor de
desenvolvimento / cadeia de build, não o artefato gerado em produção.
Não há correção disponível dentro da linha `vite@7.x`.

**Decisão (consciente):** adiar a correção até a migração para o **Vite 8**,
que será feita por outros motivos. Até lá, o risco é aceito por ser
limitado ao ambiente de desenvolvimento.
