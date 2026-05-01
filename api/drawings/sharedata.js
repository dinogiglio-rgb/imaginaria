import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' })

  const { token } = req.query
  if (!token) return res.status(400).json({ error: 'token richiesto' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // 1. Trova il drawing_id dal token
    const { data: tokenRows } = await supabase
      .from('share_tokens')
      .select('drawing_id')
      .eq('token', token)
      .limit(1)

    if (!tokenRows?.length) return res.status(404).json({ error: 'Token non valido' })

    const drawingId = tokenRows[0].drawing_id

    // 2-4. Carica disegno, render e storia in parallelo
    const [drawingRes, rendersRes, storieRes] = await Promise.all([
      supabase
        .from('drawings')
        .select('id, ai_title, ai_description, original_url, processed_url')
        .eq('id', drawingId)
        .limit(1),
      supabase
        .from('renders')
        .select('style, result_url, video_url')
        .eq('drawing_id', drawingId)
        .eq('status', 'completed'),
      supabase
        .from('stories')
        .select('testo, tipo, created_at')
        .eq('drawing_id', drawingId)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    const drawing = drawingRes.data?.[0] ?? null
    if (!drawing) return res.status(404).json({ error: 'Disegno non trovato' })

    if (rendersRes.error) {
      console.error('Errore renders:', rendersRes.error)
    }

    return res.status(200).json({
      drawing,
      renders: rendersRes.data || [],
      storia: storieRes.data?.[0] || null,
    })

  } catch (err) {
    console.error('Errore sharedata:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
