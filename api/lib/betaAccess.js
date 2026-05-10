/**
 * Verifica se un utente ha accesso beta attivo.
 * Restituisce { allowed: true } oppure { allowed: false, reason: string }
 */
export async function checkBetaAccess(supabase, userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, beta_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, reason: 'profilo non trovato' }
  if (profile.role === 'admin') return { allowed: true }

  if (profile.beta_expires_at) {
    const expires = new Date(profile.beta_expires_at)
    if (new Date() > expires) {
      return {
        allowed: false,
        reason: 'Hai raggiunto il limite beta, ci vediamo al lancio! 🚀'
      }
    }
  }

  return { allowed: true, role: profile.role }
}
