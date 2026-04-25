import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const { request_id, drawing_id, style } = req.body
  if (!request_id) return res.status(400).json({ error: 'request_id mancante' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    fal.config({ credentials: process.env.FAL_KEY })

    const status = await fal.queue.status(
      'fal-ai/kling-video/v1.6/standard/image-to-video',
      { requestId: request_id }
    )

    if (status.status === 'COMPLETED') {
      const result = await fal.queue.result(
        'fal-ai/kling-video/v1.6/standard/image-to-video',
        { requestId: request_id }
      )

      const videoUrl = result.data.video.url

      if (drawing_id && style) {
        await supabase
          .from('renders')
          .update({ video_url: videoUrl })
          .eq('drawing_id', drawing_id)
          .eq('style', style)
      }

      return res.status(200).json({
        status: 'completed',
        video_url: videoUrl
      })
    }

    if (status.status === 'FAILED') {
      return res.status(200).json({ status: 'failed', error: 'Generazione fallita su fal.ai' })
    }

    return res.status(200).json({ status: 'processing' })

  } catch (err) {
    console.error('ERRORE DETTAGLIATO:', {
      message: err.message,
      stack: err.stack,
      cause: err.cause
    })
    return res.status(500).json({
      error: err.message,
      detail: err.stack?.split('\n')[0]
    })
  }
}
