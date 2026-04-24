import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const { render_url, story_text, drawing_title } = req.body
  if (!render_url || !story_text) {
    return res.status(400).json({ error: 'render_url e story_text sono obbligatori' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    fal.config({ credentials: process.env.FAL_KEY })

    const promptWords = story_text.split(' ').slice(0, 40).join(' ')
    const videoPrompt = `Animated children's illustration, magical and colorful, bring to life this scene: ${promptWords}. Soft gentle animation, dreamy atmosphere, warm colors, children's book style, smooth motion.`

    const result = await fal.subscribe('fal-ai/kling-video/v1.6/standard/image-to-video', {
      input: {
        image_url: render_url,
        prompt: videoPrompt,
        duration: '10',
        aspect_ratio: '1:1',
      },
      pollInterval: 4000,
      timeout: 120000,
    })

    return res.status(200).json({
      video_url: result.data.video.url,
    })

  } catch (err) {
    console.error('Errore video:', err)
    return res.status(500).json({ error: err.message })
  }
}
