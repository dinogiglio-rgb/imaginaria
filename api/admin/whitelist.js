import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
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

    // Crea la tabella se non esiste
    await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS allowed_emails (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        email text UNIQUE NOT NULL,
        created_at timestamptz DEFAULT now()
      )`
    }).catch(() => {}) // ignora se rpc non disponibile, la tabella probabilmente esiste già

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const { email } = req.body
      if (!email) return res.status(400).json({ error: 'Email richiesta' })

      const { data, error } = await supabase
        .from('allowed_emails')
        .insert({ email: email.toLowerCase().trim() })
        .select()
        .single()

      if (error) throw error
      return res.status(201).json(data)
    }

    if (req.method === 'DELETE') {
      const { email } = req.body
      if (!email) return res.status(400).json({ error: 'Email richiesta' })

      const { error } = await supabase
        .from('allowed_emails')
        .delete()
        .eq('email', email.toLowerCase().trim())

      if (error) throw error
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Metodo non consentito' })
  } catch (err) {
    console.error('Errore admin/whitelist:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
