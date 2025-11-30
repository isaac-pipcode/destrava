# Guia de Configuração do Vercel - Destrava Cultura

## 🚀 Deploy no Vercel

### 1. Configurar Variável de Ambiente

A chave da API Gemini precisa ser configurada no Vercel:

**Via Dashboard:**
1. Acesse o painel do projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione a variável:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyCAKVEkHjiYtWogRdNBEa2qvC5gn3X7b2I`
   - **Environments:** Marque `Production`, `Preview` e `Development`
4. Clique em **Save**
5. **⚠️ IMPORTANTE:** Faça um **Redeploy** do projeto:
   - Vá em **Deployments**
   - Clique nos 3 pontos (...) do último deployment
   - Selecione **Redeploy**
   - **Nota:** Variáveis de ambiente só entram em vigor após o redeploy!

**Via Vercel CLI:**
```bash
vercel env add GEMINI_API_KEY
# Quando solicitado, cole: AIzaSyCAKVEkHjiYtWogRdNBEa2qvC5gn3X7b2I
# Selecione os ambientes: Production, Preview, Development
```

### 2. Configurar Domínio

Para usar o domínio `destrava-cultura.vercel.app`:

**Via Dashboard:**
1. Acesse o painel do projeto no Vercel
2. Vá em **Settings** → **Domains**
3. Em **Edit** ou **Add**, adicione: `destrava-cultura`
4. O Vercel automaticamente criará: `destrava-cultura.vercel.app`

**Via Vercel CLI:**
```bash
vercel alias set <deployment-url> destrava-cultura.vercel.app
```

### 3. Fazer Deploy

Após configurar as variáveis de ambiente:

**Via Git (Recomendado):**
- Faça push para a branch `main` ou crie um Pull Request
- O Vercel fará deploy automaticamente

**Via CLI:**
```bash
vercel --prod
```

### 4. Verificação

Após o deploy:
1. Acesse `https://destrava-cultura.vercel.app`
2. Teste a funcionalidade de importação de extrato (que usa a API Gemini)
3. Teste a geração de insights (que também usa a API Gemini)

## 🔧 Solução de Problemas

### A API Gemini não está funcionando

1. ⚠️ **PRIMEIRO:** Certifique-se de fazer **Redeploy** após adicionar a variável
2. Verifique se a variável `GEMINI_API_KEY` está configurada corretamente
3. Verifique nos logs do Vercel se há erros relacionados à API
4. Abra o console do navegador (F12) e procure por mensagens `[Gemini]`
5. Teste a chave da API em: https://aistudio.google.com/app/apikey

📖 **Guia completo de troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### O domínio não está funcionando

1. Aguarde alguns minutos para propagação DNS
2. Verifique em Settings → Domains se o domínio está ativo
3. Limpe o cache do navegador e tente novamente

## 📚 Documentação Oficial

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Domains](https://vercel.com/docs/concepts/projects/domains)
- [Vercel CLI](https://vercel.com/docs/cli)
