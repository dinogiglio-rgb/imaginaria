import { createClient } from '@supabase/supabase-js'

function makeSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function checkAdmin(supabase, token) {
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (pErr || profile?.role !== 'admin') return null
  return user
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const supabase = makeSupabase()
  const user = await checkAdmin(supabase, token)
  if (!user) return res.status(403).json({ error: 'Accesso negato' })

  const action = req.query.action || req.body?.action

  try {
    if (action === 'users') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' })
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json(data)
    }

    if (action === 'setrole') {
      if (req.method !== 'PUT') return res.status(405).json({ error: 'Metodo non consentito' })
      const { userId, newRole } = req.body
      if (!userId || !newRole) return res.status(400).json({ error: 'userId e newRole richiesti' })
      if (!['admin', 'user'].includes(newRole)) return res.status(400).json({ error: 'Ruolo non valido' })
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      if (error) throw error
      return res.status(200).json({ success: true })
    }

    if (action === 'whitelist-list') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' })
      await supabase.rpc('exec_sql', {
        sql: `CREATE TABLE IF NOT EXISTS allowed_emails (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          email text UNIQUE NOT NULL,
          created_at timestamptz DEFAULT now()
        )`
      }).catch(() => {})
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json(data)
    }

    if (action === 'whitelist-add') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })
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

    if (action === 'whitelist-delete') {
      if (req.method !== 'DELETE') return res.status(405).json({ error: 'Metodo non consentito' })
      const { email } = req.body
      if (!email) return res.status(400).json({ error: 'Email richiesta' })
      const { error } = await supabase
        .from('allowed_emails')
        .delete()
        .eq('email', email.toLowerCase().trim())
      if (error) throw error
      return res.status(200).json({ success: true })
    }

    if (action === 'stats') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' })
      const [drawingsRes, rendersRes, storiesRes, videosRes, profilesRes] = await Promise.all([
        supabase.from('drawings').select('id', { count: 'exact', head: true }),
        supabase.from('renders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('stories').select('id', { count: 'exact', head: true }),
        supabase.from('renders').select('id', { count: 'exact', head: true }).not('video_url', 'is', null),
        supabase.from('profiles').select('id, display_name, email').order('created_at', { ascending: false }),
      ])

      const profiles = profilesRes.data || []

      const perUser = await Promise.all(profiles.map(async (p) => {
        const { data: userDrawings } = await supabase
          .from('drawings')
          .select('id')
          .eq('author_id', p.id)

        const drawingIds = (userDrawings || []).map(d => d.id)

        if (drawingIds.length === 0) {
          const { count: storiesCount } = await supabase
            .from('stories')
            .select('id', { count: 'exact', head: true })
            .eq('author_id', p.id)
          return { userId: p.id, displayName: p.display_name, email: p.email, drawings: 0, renders: 0, stories: storiesCount ?? 0, videos: 0 }
        }

        const [rendersPerUser, storiesPerUser, videosPerUser] = await Promise.all([
          supabase.from('renders').select('id', { count: 'exact', head: true }).in('drawing_id', drawingIds).eq('status', 'completed'),
          supabase.from('stories').select('id', { count: 'exact', head: true }).eq('author_id', p.id),
          supabase.from('renders').select('id', { count: 'exact', head: true }).in('drawing_id', drawingIds).not('video_url', 'is', null),
        ])

        return {
          userId: p.id,
          displayName: p.display_name,
          email: p.email,
          drawings: drawingIds.length,
          renders: rendersPerUser.count ?? 0,
          stories: storiesPerUser.count ?? 0,
          videos: videosPerUser.count ?? 0,
        }
      }))

      return res.status(200).json({
        drawings: drawingsRes.count ?? 0,
        renders: rendersRes.count ?? 0,
        stories: storiesRes.count ?? 0,
        videos: videosRes.count ?? 0,
        perUser,
      })
    }

    return res.status(400).json({ error: 'Action non valida' })
  } catch (err) {
    console.error('Errore admin:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
