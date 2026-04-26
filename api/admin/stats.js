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
  } catch (err) {
    console.error('Errore admin/stats:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
