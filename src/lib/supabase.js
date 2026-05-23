import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  // Aviso visível no console se faltar configuração.
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase não configurado. Crie um arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(url || 'http://localhost', key || 'anon-placeholder')

export const isSupabaseConfigured = Boolean(url && key)
