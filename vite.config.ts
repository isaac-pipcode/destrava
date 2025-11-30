import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Use empty string fallback to prevent 'undefined' injection which might break some parsers
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    }
  }
})