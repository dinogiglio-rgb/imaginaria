import { fal } from '@fal-ai/client'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

async function checkBetaAccess(supabase, userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, beta_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, reason: 'profilo non trovato' }
  if (profile.role === 'admin') return { allowed: true }

  if (profile.beta_expires_at) {
    const expires = new Date(profile.beta_expires_at)
    if (new Date() > expires) {
      return {
        allowed: false,
        reason: 'Hai raggiunto il limite beta, ci vediamo al lancio! 🚀'
      }
    }
  }

  return { allowed: true, role: profile.role }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const { render_url, story_text, drawing_title } = req.body
  if (!render_url || !story_text) {
    return res.status(400).json({ error: 'render_url e story_text obbligatori' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    const betaAccess = await checkBetaAccess(supabase, user.id)
    if (!betaAccess.allowed) return res.status(403).json({ error: betaAccess.reason })

    // Controlla limite video totali (4 per utenti beta)
    const { data: userDrawings } = await supabase
      .from('drawings')
      .select('id')
      .eq('author_id', user.id)

    const drawingIds = (userDrawings || []).map(d => d.id)

    if (drawingIds.length > 0) {
      const { count: videoTotali } = await supabase
        .from('renders')
        .select('id', { count: 'exact', head: true })
        .in('drawing_id', drawingIds)
        .not('video_url', 'is', null)

      if (videoTotali >= 4) {
        return res.status(403).json({
          error: 'Hai raggiunto il limite beta, ci vediamo al lancio! 🚀',
          limitReached: 'videos'
        })
      }
    }

    // STEP 1 — Claude genera un prompt video personalizzato dalla storia
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const promptResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Sei un esperto di prompt per video AI.
Leggi questa storia per bambini e crea un prompt in inglese
per animare l'immagine del personaggio principale.
Il prompt deve descrivere:
- Il movimento del personaggio (cosa fa, come si muove)
- L'atmosfera e le emozioni della scena principale
- Effetti visivi magici se presenti nella storia
- Lo stile: children's book illustration, soft animation, warm colors

Storia: ${story_text.slice(0, 600)}

Rispondi SOLO con il prompt video in inglese, massimo 80 parole,
niente spiegazioni.`
      }]
    })

    const videoPrompt = promptResponse.content[0].text.trim()
    console.log('Prompt video generato:', videoPrompt)

    // STEP 2 — Avvia job Kling con il prompt personalizzato
    fal.config({ credentials: process.env.FAL_KEY })

    const { request_id } = await fal.queue.submit(
      'fal-ai/kling-video/v1.6/standard/image-to-video',
      {
        input: {
          image_url: render_url,
          prompt: videoPrompt,
          duration: '10',
          aspect_ratio: '1:1',
        }
      }
    )

    return res.status(200).json({ request_id })

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
