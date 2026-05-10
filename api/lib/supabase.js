import { createClient } from '@supabase/supabase-js'

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variabili Supabase mancanti nel .env (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
}

/**
 * Client Supabase singleton lato server con service role key.
 * Creato una volta sola al caricamento del modulo — non ricrearlo nei handler.
 */
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
