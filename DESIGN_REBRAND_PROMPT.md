# Destrava — Análise de Design & Prompt para Claude Design

> Data: 2026-06-23 · Objetivo: rebrand completo + redesign de interface

---

## Parte 1 — Diagnóstico do design atual

### Inventário visual
- **Marca:** "Destrava" — gestão financeira/fiscal para trabalhadores da cultura brasileira.
- **Logo:** cadeado aberto, corpo dividido em verde/laranja na diagonal, seta branca apontando para cima. Conceito: destravar + crescer.
- **Paleta:** `govblue #1351b4`, `govgreen #009a44`, `govorange #f37021`, navy `#1d357d` (texto/ativo). É a paleta literal do gov.br.
- **Tipografia:** Inter (300–800), uso pesado de `font-black`, `tracking-tighter`, labels em CAIXA ALTA com tracking largo.
- **Componentes:** cards `rounded-xl/2xl/3xl`, KPIs com `border-l-4` colorido, ícones por emoji, hero com gradiente + blobs desfocados, badges glassmorphism.

### Problemas
| # | Problema | Impacto |
|---|----------|---------|
| 1 | Paleta e logotipo gov.br reproduzidos (inclui SVG do "gov.br") | Risco de marca/trademark; ausência de identidade própria |
| 2 | Visual institucional vs. público criativo | Desconexão emocional com o usuário-alvo |
| 3 | Emojis como ícones em KPIs, nav e status | Inconsistência multiplataforma, baixa percepção de qualidade |
| 4 | Sem design tokens; `#1d357d` hardcoded; raios inconsistentes | Manutenção difícil, incoerência visual |
| 5 | KPI cards `border-l-4`, hero genérico | Estética datada |
| 6 | Apenas Inter, sem fonte de display | Falta de personalidade |

### O que preservar
- Nome "Destrava" e a metáfora **cadeado aberto + movimento ascendente**.
- Suporte a dark mode.
- Densidade informacional de dashboard (KPIs, gráficos, fluxo de caixa).

---

## Parte 2 — Prompt para o Claude Design

> Cole o bloco abaixo no Claude Design. Ele é autossuficiente (não depende do código atual).

```
Você é um diretor de arte e designer de produto. Crie um PACOTE DE MARCA COMPLETO
e um REDESIGN DE INTERFACE para o "Destrava", um SaaS brasileiro de gestão
financeira e fiscal voltado a trabalhadores da cultura (artistas, produtores
culturais, coletivos, MEIs e pequenas produtoras que prestam contas de editais
como Lei Paulo Gustavo e Aldir Blanc).

POSICIONAMENTO
- Promessa: "destravar" a vida financeira e fiscal de quem vive de cultura —
  transformar a burocracia (notas fiscais, Simples Nacional, Fator R, prestação
  de contas) em algo simples, claro e até bonito.
- Personalidade da marca: confiável como um bom contador, mas com a alma quente
  e criativa da cultura brasileira. O oposto de um portal de governo cinza.
- Tom: profissional, encorajador, acessível, brasileiro contemporâneo.

RESTRIÇÕES IMPORTANTES
- NÃO usar a identidade visual do gov.br. Evitar a paleta azul/verde/laranja
  do Governo Federal e qualquer elemento que lembre marca oficial. A marca
  precisa ser DISTINTIVA e própria.
- Preservar e refinar o conceito do logo: um cadeado se abrindo combinado a um
  movimento ascendente (seta/broto/curva de crescimento). Modernize a execução;
  não copie a versão atual.
- Acessibilidade: contraste mínimo WCAG AA em texto e componentes; suporte a
  tema claro e escuro.

ENTREGÁVEIS — PACOTE DE MARCA
1. Logotipo: símbolo + logotipo (wordmark), versões horizontal e empilhada,
   versão monocromática e versão reduzida (favicon/app icon).
2. Paleta de cores com tokens nomeados (primária, secundária, acento, neutros,
   estados de sucesso/alerta/erro/info), com valores HEX e equivalentes para
   tema claro e escuro, todos aprovados em contraste AA.
3. Tipografia: uma fonte de display com personalidade para títulos e uma fonte
   sans neutra e legível para corpo/dados; escala tipográfica (display, h1–h4,
   body, caption, overline) e pesos. Preferir Google Fonts. Considerar uma fonte
   com caráter brasileiro/cultural sem perder legibilidade em números e tabelas.
4. Sistema de ícones: recomendar um conjunto consistente (ex.: Lucide ou
   Phosphor) para SUBSTITUIR todos os emojis usados hoje como ícones.
5. Linguagem visual: grid de espaçamento (escala 4/8px), escala única e coerente
   de raios de borda, estilo de sombras/elevação, e um motif gráfico de marca
   (ex.: padrão derivado do cadeado/seta ou de arte popular brasileira usado com
   sutileza) para heros e estados vazios.
6. Tom de voz: 4–6 diretrizes de microcopy em pt-BR (ex.: como nomear status
   financeiros, como falar de impostos sem assustar).

ENTREGÁVEIS — INTERFACE (telas-chave, claro e escuro, desktop e mobile)
1. Login: social + e-mail, com hero de marca (sem mimetizar gov.br).
2. Painel (Dashboard): hero/resumo, cards de saúde financeira para Pessoa Física
   e Pessoa Jurídica (saldo, runway/fôlego de caixa, status), e atalhos.
3. KPI cards: redesenhar o padrão atual de "borda lateral colorida" para algo
   moderno (ex.: cards com ícone, número grande, sparkline e variação vs.
   previsão), incluindo: Receita Realizada, Despesas, Resultado Líquido,
   Saúde Financeira.
4. Diário Financeiro: tabela/lista de transações com filtros PF/PJ, categorias,
   contas bancárias, e ações (editar/excluir/gerar nota).
5. Módulo Fiscal: simulador de impostos (MEI/Simples/Fator R), formulário de
   emissão de nota fiscal simulada e histórico de notas.
6. Prestação de Contas: execução orçamentária de projetos de edital (planejado
   vs. realizado por rubrica), com gráficos de barras e pizza.
7. Estados vazios, loading e erro com a nova linguagem visual.

FORMATO DA RESPOSTA
- Apresente primeiro o racional de marca (1 parágrafo), depois os tokens
  (cores, tipografia, espaçamento, raios) em formato pronto para virar config
  do Tailwind, depois os mockups das telas.
- Stack-alvo: React + Tailwind CSS, dark mode por classe. Entregue os tokens de
  forma que eu consiga colá-los em tailwind.config e em variáveis CSS.
```

---

## Parte 3 — Como aplicar depois

1. Rodar o prompt no Claude Design e revisar as propostas de marca.
2. Extrair os tokens (cores/tipografia/raios) para `tailwind.config` — substituindo
   os atuais `govblue/govgreen/govorange` e eliminando o `#1d357d` hardcoded.
3. Trocar emojis por um set de ícones (Lucide/Phosphor) componente a componente.
4. Migrar a fonte do CDN Tailwind para build local (alinhado à Fase 3 do roadmap
   técnico) e remover o SVG/botão que imita o gov.br do `Login.tsx`.
5. Aplicar o redesign tela a tela, começando por `Login`, `Header`, `DashboardHome`
   e `KPICards`, que definem a primeira impressão.
