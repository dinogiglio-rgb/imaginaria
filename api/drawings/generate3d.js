import * as fal from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end()

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autorizzato' })

    const { render_url, drawing_id } = req.body
    if (!render_url) return res.status(400).json({ error: 'render_url mancante' })

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    fal.config({ credentials: process.env.FAL_KEY })

    const result = await fal.subscribe('fal-ai/triposr', {
      input: {
        image_url: render_url,
        do_remove_background: true,
        foreground_ratio: 0.85,
      },
      pollInterval: 3000,
      timeout: 120000,
    })

    const modelUrl = result.data.model_mesh.url
    if (!modelUrl) throw new Error('Nessun modello 3D generato')

    return res.status(200).json({ model_url: modelUrl, drawing_id })

  } catch (err) {
    console.error('ERRORE API:', err.message, err.stack)
    return res.status(500).json({ error: err.message })
  }
}
