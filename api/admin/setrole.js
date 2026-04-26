import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Metodo non consentito' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') return res.status(403).json({ error: 'Accesso negato' })

    const { userId, newRole } = req.body
    if (!userId || !newRole) return res.status(400).json({ error: 'userId e newRole richiesti' })
    if (!['admin', 'user'].includes(newRole)) return res.status(400).json({ error: 'Ruolo non valido' })

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (updateError) throw updateError

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Errore admin/setrole:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
