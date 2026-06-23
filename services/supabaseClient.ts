import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Misconfiguração comum em dev: torna o erro óbvio em vez de falhar silenciosamente.
  console.warn(
    '[Destrava] Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.'
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
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
