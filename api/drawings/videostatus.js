import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const { request_id, drawing_id, style, type, render_id } = req.body
  if (!request_id) return res.status(400).json({ error: 'request_id mancante' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    fal.config({ credentials: process.env.FAL_KEY })

    if (type === '3d') {
      console.log('3D STATUS CHECK - requestId:', request_id)

      const statusResult = await fal.queue.status('fal-ai/triposr', { requestId: request_id })

      console.log('3D STATUS RESPONSE:', JSON.stringify(statusResult))
      console.log('3D STATUS VALUE:', statusResult?.status)

      const isCompleted = ['completed', 'COMPLETED', 'OK'].includes(statusResult?.status)
      const isFailed = ['failed', 'FAILED', 'ERROR'].includes(statusResult?.status)

      if (isCompleted) {
        const result = await fal.queue.result('fal-ai/triposr', { requestId: request_id })

        console.log('3D COMPLETATO - result completo:', JSON.stringify(result))

        const modelUrl =
          result?.data?.model_mesh?.url ||
          result?.model_mesh?.url ||
          result?.data?.model?.url ||
          result?.model?.url ||
          result?.data?.outputs?.[0]?.url ||
          result?.outputs?.[0]?.url

        console.log('3D MODEL URL estratto:', modelUrl)

        if (!modelUrl) {
          if (render_id) {
            await supabase.from('renders').update({ status: 'failed' }).eq('id', render_id)
          }
          return res.status(200).json({ status: 'failed', error: 'Nessun modello 3D nel risultato' })
        }

        if (render_id) {
          const { error: updateError } = await supabase
            .from('renders')
            .update({
              status: 'completed',
              result_url: modelUrl,
              completed_at: new Date().toISOString()
            })
            .eq('id', render_id)
          console.log('3D DB UPDATE:', updateError ? updateError.message : 'OK', modelUrl)
        }

        return res.status(200).json({ status: 'completed', model_url: modelUrl })
      }

      if (isFailed) {
        if (render_id) {
          await supabase.from('renders').update({ status: 'failed' }).eq('id', render_id)
        }
        return res.status(200).json({ status: 'failed', error: 'Generazione 3D fallita su fal.ai' })
      }

      return res.status(200).json({ status: 'processing' })
    }

    // Comportamento originale per i video
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

      return res.status(200).json({ status: 'completed', video_url: videoUrl })
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
