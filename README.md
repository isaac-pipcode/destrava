<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Destrava Cultura

Sistema de gestão financeira para artistas e produtores culturais brasileiros, com análise inteligente via Gemini AI.

## 🚀 Deploy no Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/isaac-pipcode/destrava-cultura)

**Domínio:** [destrava-cultura.vercel.app](https://destrava-cultura.vercel.app)

### Configuração Rápida no Vercel

1. **Adicione a variável de ambiente:**
   - Vá em Settings → Environment Variables
   - Nome: `GEMINI_API_KEY`
   - Valor: `AIzaSyCAKVEkHjiYtWogRdNBEa2qvC5gn3X7b2I`

2. **Configure o domínio:**
   - Vá em Settings → Domains
   - Adicione: `destrava-cultura.vercel.app`

📖 **Guia completo:** [VERCEL_SETUP.md](VERCEL_SETUP.md)

## 💻 Executar Localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure a chave da API Gemini:
   ```bash
   cp .env.example .env.local
   ```
   Edite `.env.local` e adicione sua chave:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```

3. Execute o projeto:
   ```bash
   npm run dev
   ```

## 🔑 Obter Chave da API Gemini

Obtenha sua chave gratuita em: https://aistudio.google.com/app/apikey
