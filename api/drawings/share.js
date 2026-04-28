import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Non autorizzato' })

    const { drawing_id } = req.body
    if (!drawing_id) return res.status(400).json({ error: 'drawing_id richiesto' })

    // Verifica che il disegno esista (senza filtrare per author_id)
    const { data: drawing, error: drawingError } = await supabase
      .from('drawings')
      .select('id')
      .eq('id', drawing_id)
      .single()

    if (drawingError || !drawing) return res.status(404).json({ error: 'Disegno non trovato' })

    // Controlla se esiste già un token per questo disegno
    const { data: rows } = await supabase
      .from('share_tokens')
      .select('token')
      .eq('drawing_id', drawing_id)
      .limit(1)

    if (rows?.length > 0) {
      const existing = rows[0].token
      return res.status(200).json({
        token: existing,
        url: `https://imaginaria-beryl.vercel.app/share/${existing}`,
      })
    }

    // Genera nuovo token e salva
    const shareToken = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('share_tokens')
      .insert({ token: shareToken, drawing_id, created_by: user.id })

    if (insertError) throw insertError

    return res.status(200).json({
      token: shareToken,
      url: `https://imaginaria-beryl.vercel.app/share/${shareToken}`,
    })

  } catch (err) {
    console.error('Errore share:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
