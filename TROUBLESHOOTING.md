# Guia de Solução de Problemas - Destrava Cultura

## 🔍 Problema: "Análise Indisponível" no Dashboard

Se você vê a mensagem "Análise Indisponível" no painel de insights, siga estes passos:

### 1. Verificar se a API Key está configurada no Vercel

**Sintoma:** Mensagem "A chave de API não está configurada"

**Solução:**

1. Acesse o dashboard do projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Verifique se existe a variável `GEMINI_API_KEY`
4. Se não existir, adicione:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyCAKVEkHjiYtWogRdNBEa2qvC5gn3X7b2I`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
5. Clique em **Save**
6. **IMPORTANTE:** Faça um **Redeploy** do projeto:
   - Vá em **Deployments**
   - Clique nos 3 pontos (...) do último deployment
   - Selecione **Redeploy**

### 2. Verificar se o Redeploy foi feito

**Importante:** Adicionar ou modificar variáveis de ambiente não afeta deployments existentes automaticamente. Você **DEVE** fazer um redeploy manual para que as mudanças entrem em vigor.

### 3. Verificar os Logs no Vercel

Para ver mensagens de erro detalhadas:

1. Acesse o dashboard do Vercel
2. Vá em **Deployments** → Clique no deployment ativo
3. Vá em **Functions** → Selecione uma function
4. Procure por logs que começam com `[Gemini]`

Exemplos de logs:
- `[Gemini] API Key is missing or invalid` → Variável não configurada
- `[Gemini] Initializing GoogleGenAI with API key: AIzaSyCAKV...` → Inicialização bem-sucedida
- `[Gemini] Successfully generated 3 insights` → Tudo funcionando

### 4. Testar Localmente

Para testar em ambiente de desenvolvimento local:

1. Crie o arquivo `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` e adicione:
   ```
   GEMINI_API_KEY=AIzaSyCAKVEkHjiYtWogRdNBEa2qvC5gn3X7b2I
   ```

3. Execute o projeto:
   ```bash
   npm run dev
   ```

4. Abra o console do navegador (F12) e procure por mensagens `[Gemini]`

### 5. Verificar Quota da API

**Sintoma:** "Limite de uso da API atingido"

**Solução:**

1. Acesse https://aistudio.google.com/app/apikey
2. Verifique o uso da sua API key
3. Se estiver no limite gratuito, aguarde o reset ou configure billing

### 6. Problemas de Conexão

**Sintoma:** "Erro de conexão com a API Gemini"

**Possíveis causas:**
- Firewall bloqueando requisições
- Problemas temporários com a API do Google
- Região do Vercel com restrições

**Solução:**
- Aguarde alguns minutos e tente novamente
- Verifique o status da API: https://status.cloud.google.com/

## ✅ Checklist Rápido

- [ ] Variável `GEMINI_API_KEY` configurada no Vercel?
- [ ] Redeploy feito após adicionar a variável?
- [ ] Logs do Vercel mostram `[Gemini] Initializing...`?
- [ ] Console do navegador mostra erros relacionados ao Gemini?
- [ ] API key está válida no Google AI Studio?

## 🆘 Ainda com Problemas?

Se seguiu todos os passos e ainda vê "Análise Indisponível":

1. Abra o console do navegador (F12)
2. Vá na aba **Console**
3. Procure por mensagens de erro que começam com `[Gemini]`
4. Tire um screenshot e reporte o problema

## 📊 Como Saber se Está Funcionando

Quando tudo está correto, você verá:

1. **No Console do Navegador:**
   ```
   [Gemini] Initializing GoogleGenAI with API key: AIzaSyCAKV...
   [Gemini] GoogleGenAI initialized successfully
   [Gemini] Generating financial insights for X months
   [Gemini] Response received, parsing...
   [Gemini] Successfully generated 3 insights
   ```

2. **No Dashboard:**
   - Painel "Insights da IA" com 3 insights personalizados
   - Sem mensagem de "Análise Indisponível"
