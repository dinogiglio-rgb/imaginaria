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
    const { data: tokenRows } = await supabase
      .from('share_tokens')
      .select('drawing_id')
      .eq('token', token)
      .limit(1)

    if (!tokenRows || tokenRows.length === 0) {
      return res.status(404).json({ error: 'Token non valido' })
    }

    const drawingId = tokenRows[0].drawing_id

    const drawingRes = await supabase
      .from('drawings')
      .select('id, ai_title, ai_description, original_url, processed_url')
      .eq('id', drawingId)
      .limit(1)

    const rendersRes = await supabase
      .from('renders')
      .select('style, result_url, created_at')
      .eq('drawing_id', drawingId)
      .order('created_at', { ascending: false })

    const storieRes = await supabase
      .from('stories')
      .select('testo, tipo, created_at')
      .eq('drawing_id', drawingId)
      .order('created_at', { ascending: false })
      .limit(1)

    const dr = drawingRes.data
    const drawing = dr && dr[0] ? dr[0] : null
    if (!drawing) return res.status(404).json({ error: 'Disegno non trovato' })

    const tuttiRenders = rendersRes.data || []
    const renders = Object.values(
      tuttiRenders.reduce((acc, r) => {
        if (!acc[r.style]) acc[r.style] = r
        return acc
      }, {})
    )
    const sr = storieRes.data

    if (rendersRes.error) console.error('Errore renders:', rendersRes.error)
    if (storieRes.error) console.error('Errore storie:', storieRes.error)

    return res.status(200).json({
      drawing: drawing,
      renders: renders,
      storia: sr && sr[0] ? sr[0] : null
    })

  } catch (err) {
    console.error('Errore sharedata:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
