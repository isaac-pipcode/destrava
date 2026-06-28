import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True só quando as duas variáveis públicas estão presentes no build. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Sem env, NÃO deixamos o createClient lançar (isso deixava a tela em branco).
  // Usamos um placeholder válido e sinalizamos via isSupabaseConfigured; o App
  // mostra uma tela de "configuração ausente" em vez de quebrar.
  console.warn(
    '[Destrava] Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente de build.'
  );
}

/**
 * Cliente único do Supabase para todo o app.
 *
 * - flowType 'pkce': fluxo seguro de OAuth exigido por apps nativos (Capacitor)
 *   e recomendado também na web.
 * - persistSession + autoRefreshToken: mantém o usuário logado e renova o token
 *   de acesso automaticamente usando o refresh token.
 *
 * A anon key é pública por design; a segurança dos dados vem das políticas de
 * Row-Level Security definidas no banco (ver supabase/migrations).
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  },
);
