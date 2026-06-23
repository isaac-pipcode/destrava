import type { CapacitorConfig } from '@capacitor/cli';

// Empacotamento do app web (Vite) como app nativo iOS/Android.
// Passos de store-prep (ver ARQUITETURA_MOBILE.md):
//   npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/app @capacitor/browser
//   npx cap add ios && npx cap add android
//   npm run build && npx cap sync
const config: CapacitorConfig = {
  appId: 'br.com.destrava.app',
  appName: 'Destrava',
  webDir: 'dist',
  ios: { contentInset: 'always' },
  // Deep link usado no retorno do OAuth do Google em ambiente nativo.
  // Cadastre 'br.com.destrava.app://auth-callback' nas redirect URLs do Supabase.
};

export default config;
