import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // ATENÇÃO: este valor é embutido no bundle do navegador e fica visível a
      // qualquer visitante. Use apenas chaves de teste/desenvolvimento até as
      // chamadas Gemini serem movidas para um backend (Fase 2 do roadmap).
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  }
})