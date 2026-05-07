import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autorizzato' })

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    const { drawingId, indicazioni } = req.body
    if (!drawingId) return res.status(400).json({ error: 'drawingId mancante' })

    let promptTesto = ''

    if (indicazioni && indicazioni.trim()) {
      promptTesto = `Sei un assistente creativo e poetico che analizza disegni di bambini con meraviglia e amore.

INFORMAZIONE FONDAMENTALE: L'autore del disegno (o chi lo conosce) ha indicato che:
"${indicazioni}"

Questo è ciò che il bambino ha VOLUTO disegnare. Devi usare questa informazione come base principale della tua analisi. Non inventare interpretazioni diverse — il bambino sa cosa ha disegnato lui.

Guarda il disegno e costruisci la tua risposta partendo da questa indicazione.

Rispondi SOLO con un JSON valido in questo formato esatto:
{
  "ai_title": "Un titolo poetico e creativo basato su ciò che ha voluto disegnare (max 6 parole)",
  "ai_description": "Una descrizione meravigliata e affettuosa che racconta ciò che il bambino ha voluto creare (2-3 frasi in italiano, celebra la sua fantasia)",
  "ai_prompt_render": "A children's drawing of [descrizione in inglese di ciò che il bambino voleva disegnare, dettagliata per generare un'immagine AI stilizzata, max 50 parole]"
}

Non aggiungere nulla prima o dopo il JSON.`
    } else {
      promptTesto = `Sei un assistente creativo e poetico che analizza disegni di bambini con meraviglia e amore.

Analizza questo disegno e rispondi SOLO con un JSON valido in questo formato esatto:
{
  "ai_title": "Un titolo poetico e creativo per il disegno (max 6 parole)",
  "ai_description": "Una descrizione meravigliata e affettuosa del disegno (2-3 frasi, in italiano, come se fosse magico)",
  "ai_prompt_render": "A children's drawing of [descrizione in inglese dettagliata per generare un'immagine AI stilizzata, max 50 parole]"
}

Non aggiungere nulla prima o dopo il JSON.`
    }

    const { data: drawing, error: dbError } = await supabase
      .from('drawings')
      .select('*')
      .eq('id', drawingId)
      .single()

    if (dbError || !drawing) return res.status(404).json({ error: 'Disegno non trovato' })
    if (!drawing.original_url) return res.status(400).json({ error: 'Immagine non disponibile' })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: drawing.original_url }
          },
          {
            type: 'text',
            text: promptTesto
          }
        ]
      }]
    })

    const testo = response.content[0].text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const risultato = JSON.parse(testo)

    await supabase
      .from('drawings')
      .update({
        ai_title: risultato.ai_title,
        ai_description: risultato.ai_description,
        ai_prompt_render: risultato.ai_prompt_render
      })
      .eq('id', drawingId)

    return res.status(200).json(risultato)

  } catch (err) {
    console.error('ERRORE API:', err.message, err.stack)
    return res.status(500).json({ error: err.message })
  }
}
