import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// A chave do Gemini NÃO é mais embutida no bundle: as chamadas passam pela Edge
// Function do Supabase. O frontend só usa variáveis públicas VITE_SUPABASE_*,
// expostas automaticamente pelo Vite (prefixo VITE_).
export default defineConfig({
  plugins: [react()],
})