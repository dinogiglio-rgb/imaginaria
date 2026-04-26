import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' })

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

    const [drawingsRes, rendersRes, storiesRes, videosRes] = await Promise.all([
      supabase.from('drawings').select('id', { count: 'exact', head: true }),
      supabase.from('renders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('stories').select('id', { count: 'exact', head: true }),
      supabase.from('renders').select('id', { count: 'exact', head: true }).not('video_url', 'is', null),
    ])

    return res.status(200).json({
      drawings: drawingsRes.count ?? 0,
      renders: rendersRes.count ?? 0,
      stories: storiesRes.count ?? 0,
      videos: videosRes.count ?? 0,
    })
  } catch (err) {
    console.error('Errore admin/stats:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
