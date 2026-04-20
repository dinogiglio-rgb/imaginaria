// Gestione autenticazione Google OAuth con Supabase
import { supabase } from './supabase'

// Login con Google (reindirizza a Google)
export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`,
    },
  })
  if (error) throw error
}

// Logout
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Ascolta i cambiamenti di sessione (login/logout)
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user ?? null)
  })
}

// Verifica se l'utente è admin
export const isAdmin = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (error) return false
  return data?.role === 'admin'
}
